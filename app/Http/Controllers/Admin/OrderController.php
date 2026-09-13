<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateOrderRequest;
use App\Mail\OrderStatusUpdatedMail;
use App\Models\Order;
use App\Models\RestaurantSetting;
use App\Support\AdminPresenter;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['active', 'all', ...array_column(OrderStatus::cases(), 'value')])],
            'type' => ['nullable', Rule::enum(OrderType::class)],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $status = $filters['status'] ?? 'active';

        $orders = Order::query()
            ->withCount('items')
            ->when($filters['q'] ?? null, function (Builder $query, string $term) {
                $digits = preg_replace('/\D+/', '', $term);

                $query->where(function (Builder $query) use ($term, $digits) {
                    $query->where('order_number', 'like', "%{$term}%")
                        ->orWhere('customer_name', 'like', "%{$term}%");

                    if ($digits !== '') {
                        $query->orWhere('customer_phone', 'like', "%{$digits}%");
                    }
                });
            })
            ->when($status === 'active', fn (Builder $query) => $query->active())
            ->when(! in_array($status, ['active', 'all'], true), fn (Builder $query) => $query->where('status', $status))
            ->when($filters['type'] ?? null, fn (Builder $query, string $type) => $query->where('type', $type))
            ->when($filters['date_from'] ?? null, fn (Builder $query, string $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn (Builder $query, string $date) => $query->whereDate('created_at', '<=', $date))
            // Active queue reads oldest first, like a kitchen docket rail; history reads newest first.
            ->when($status === 'active', fn (Builder $query) => $query->oldest(), fn (Builder $query) => $query->latest())
            ->paginate(20)
            ->withQueryString()
            ->through(AdminPresenter::orderRow(...));

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $orders,
            'filters' => [
                'q' => $filters['q'] ?? '',
                'status' => $status,
                'type' => $filters['type'] ?? '',
                'date_from' => $filters['date_from'] ?? '',
                'date_to' => $filters['date_to'] ?? '',
            ],
            'statusOptions' => AdminPresenter::statusOptions(OrderStatus::cases()),
            'activeCount' => Order::query()->active()->count(),
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load('items.addOns');

        return Inertia::render('Admin/Orders/Show', [
            'order' => AdminPresenter::orderDetail($order),
        ]);
    }

    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(OrderStatus::class)],
        ]);

        $to = OrderStatus::from($validated['status']);

        $updated = DB::transaction(function () use ($order, $to) {
            $locked = Order::query()->with('customer')->lockForUpdate()->findOrFail($order->id);
            $from = $locked->status;

            if (! $from->canTransitionTo($to)) {
                throw ValidationException::withMessages([
                    'status' => "Pesanan {$locked->order_number} tidak boleh ditukar dari {$from->label()} ke {$to->label()}.",
                ]);
            }

            $locked->status = $to;
            $locked->{$to->timestampColumn()} = now();

            if ($to === OrderStatus::Cancelled) {
                $locked->cancelled_by_customer = false;
            }

            $locked->save();

            Log::info('Order status changed', [
                'order_id' => $locked->id,
                'from' => $from->value,
                'to' => $to->value,
                'user_id' => request()->user()?->id,
            ]);

            return $locked;
        });

        $this->sendStatusNotification($updated);

        return back()->with('success', "Pesanan {$updated->order_number} kini {$to->label()}.");
    }

    /** Never let a mail hiccup (or a blocked SMTP AUTH setting) fail a status change that's already saved. */
    private function sendStatusNotification(Order $order): void
    {
        try {
            Mail::to($order->customer)->send(new OrderStatusUpdatedMail($order));
        } catch (Throwable $exception) {
            Log::error('Failed to send order-status-updated email', ['order_id' => $order->id, 'error' => $exception->getMessage()]);
        }
    }

    public function confirmPayment(Order $order): RedirectResponse
    {
        abort_if($order->payment_status === PaymentStatus::Paid, 422, 'Pesanan ini sudah disahkan bayar.');

        $order->payment_status = PaymentStatus::Paid;
        $order->save();

        return back()->with('success', "Pembayaran pesanan {$order->order_number} disahkan.");
    }

    /**
     * Staff can edit customer/logistics details and adjust item quantities. Unit prices and
     * add-ons stay fixed to their checkout snapshot — only quantity moves — and every line
     * total plus the order subtotal/total are always recomputed server-side, never trusted
     * from the client.
     */
    public function update(UpdateOrderRequest $request, Order $order): RedirectResponse
    {
        DB::transaction(function () use ($request, $order) {
            $locked = Order::query()->with('items')->lockForUpdate()->findOrFail($order->id);

            $locked->update($request->safe()->except('items'));

            if ($request->has('items')) {
                $items = $locked->items->keyBy('id');

                foreach ($request->validated('items') as $line) {
                    $item = $items->get((int) $line['id']);

                    if (! $item) {
                        continue;
                    }

                    $item->quantity = (int) $line['quantity'];
                    $item->line_total = ($item->unit_price * $item->quantity) + $item->add_ons_total;
                    $item->save();
                }

                $subtotal = (int) $locked->items()->sum('line_total');
                $locked->subtotal = $subtotal;
                // No service charge or tax in MVP; total equals subtotal.
                $locked->total = $subtotal;
                $locked->save();
            }
        });

        return back()->with('success', "Pesanan {$order->order_number} dikemas kini.");
    }

    public function destroy(Order $order): RedirectResponse
    {
        $number = $order->order_number;
        $order->delete();

        return to_route('admin.orders.index')->with('success', "Pesanan {$number} dipadam.");
    }

    public function bulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer'],
            'action' => ['required', Rule::in(['approve', 'reject', 'delete'])],
        ]);

        abort_if($validated['action'] === 'delete' && ! $request->user('web')->hasAdminRole(), 403, 'Hanya admin boleh memadam pesanan.');

        $action = $validated['action'];
        $affected = 0;
        $transitioned = [];

        DB::transaction(function () use ($validated, $action, &$affected, &$transitioned) {
            $orders = Order::query()->with('customer')->whereIn('id', $validated['ids'])->lockForUpdate()->get();

            foreach ($orders as $order) {
                if ($action === 'delete') {
                    $order->delete();
                    $affected++;
                    continue;
                }

                $from = $order->status;
                $to = $action === 'approve' ? OrderStatus::Confirmed : OrderStatus::Cancelled;

                if (! $from->canTransitionTo($to)) {
                    continue;
                }

                $order->status = $to;
                $order->{$to->timestampColumn()} = now();

                if ($to === OrderStatus::Cancelled) {
                    $order->cancelled_by_customer = false;
                }

                $order->save();
                $affected++;
                $transitioned[] = $order;

                Log::info('Order status changed', ['order_id' => $order->id, 'from' => $from->value, 'to' => $to->value, 'user_id' => request()->user()?->id]);
            }
        });

        foreach ($transitioned as $order) {
            $this->sendStatusNotification($order);
        }

        $messages = [
            'approve' => $affected === 1 ? '1 pesanan disahkan.' : "{$affected} pesanan disahkan.",
            'reject' => $affected === 1 ? '1 pesanan dibatalkan.' : "{$affected} pesanan dibatalkan.",
            'delete' => $affected === 1 ? '1 pesanan dipadam.' : "{$affected} pesanan dipadam.",
        ];

        return back()->with($affected > 0 ? 'success' : 'error', $affected > 0 ? $messages[$action] : 'Tiada pesanan yang boleh dikemas kini dengan tindakan ini.');
    }

    /** Any staff may reprint any order's receipt — unlike the customer-facing route, this isn't scoped to an owner. */
    public function receipt(Order $order): HttpResponse
    {
        $order->loadMissing('items.addOns');
        $restaurant = RestaurantSetting::current();

        $pdf = Pdf::loadView('receipts.order', ['order' => $order, 'restaurant' => $restaurant])
            ->setPaper('a5', 'portrait');

        return $pdf->download("resit-{$order->order_number}.pdf");
    }

    public function receipts(Request $request): HttpResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer'],
        ]);

        $orders = Order::query()
            ->with('items.addOns')
            ->whereIn('id', $validated['ids'])
            ->oldest()
            ->get();

        abort_if($orders->isEmpty(), 404);

        $restaurant = RestaurantSetting::current();

        $pdf = Pdf::loadView('receipts.bulk', ['orders' => $orders, 'restaurant' => $restaurant])
            ->setPaper('a5', 'portrait');

        return $pdf->download('resit-pukal-'.now()->format('Y-m-d-His').'.pdf');
    }
}
