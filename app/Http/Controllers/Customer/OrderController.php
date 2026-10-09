<?php

namespace App\Http\Controllers\Customer;

use App\Actions\IngredientLedger;
use App\Actions\PlaceOrder;
use App\Actions\StockLedger;
use App\Enums\OrderStatus;
use App\Exceptions\OrderRejected;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Mail\OrderCancelledStaffMail;
use App\Models\Order;
use App\Models\RestaurantSetting;
use App\Support\MenuPresenter;
use App\Support\ReceiptPdf;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class OrderController extends Controller
{
    public function store(StoreOrderRequest $request, PlaceOrder $placeOrder): RedirectResponse
    {
        try {
            $order = $placeOrder->handle($request->validated());
        } catch (OrderRejected $exception) {
            throw ValidationException::withMessages(['order' => $exception->getMessage()]);
        }

        return redirect()
            ->route('orders.show', $order)
            ->with('success', 'placed');
    }

    public function show(Order $order): Response
    {
        $this->authorizeAccess($order);

        $settings = RestaurantSetting::current();

        return Inertia::render('Customer/OrderStatus', [
            'order' => MenuPresenter::order($order),
            'restaurant' => [
                'name' => $settings->name,
                'phone' => $settings->phone,
            ],
            'justPlaced' => session('success') === 'placed',
        ]);
    }

    public function myOrders(): Response
    {
        $orders = auth('customer')->user()->orders()
            ->latest()
            ->paginate(15)
            ->through(MenuPresenter::order(...));

        return Inertia::render('Customer/Orders/Index', [
            'orders' => $orders,
        ]);
    }

    /** Self-service cancel stops once the kitchen has acted — past that, the customer calls the stall instead. */
    public function cancel(Order $order, StockLedger $stock, IngredientLedger $ingredients): RedirectResponse
    {
        $this->authorizeAccess($order);

        // Locked and re-read, so a double tap or the kitchen moving the order at the same moment
        // can't both pass the status check: only one cancel lands, and only while it's still allowed.
        $order = DB::transaction(function () use ($order, $stock, $ingredients) {
            $locked = Order::query()->lockForUpdate()->findOrFail($order->id);

            abort_unless(
                in_array($locked->status, [OrderStatus::Pending, OrderStatus::Confirmed], true),
                422,
                'Pesanan ini tidak boleh dibatalkan lagi. Sila hubungi kedai.',
            );

            // Timestamp columns (confirmed_at, cancelled_at, ...) aren't mass-assignable — set directly,
            // matching how the admin status-change path does it.
            $locked->status = OrderStatus::Cancelled;
            $locked->cancelled_at = now();
            $locked->cancelled_by_customer = true;
            $locked->save();

            $stock->syncOrder($locked);
            $ingredients->syncOrder($locked);

            return $locked;
        }, 3);

        try {
            Mail::to(config('mail.from.address'))->send(new OrderCancelledStaffMail($order));
        } catch (Throwable $exception) {
            Log::error('Failed to send order-cancelled staff email', ['order_id' => $order->id, 'error' => $exception->getMessage()]);
        }

        return back()->with('success', "Pesanan {$order->order_number} dibatalkan.");
    }

    public function receipt(Order $order): HttpResponse
    {
        $this->authorizeAccess($order);

        return ReceiptPdf::for($order)->download("resit-{$order->order_number}.pdf");
    }

    /**
     * An order placed without an account belongs to whoever holds its link: the public id in the URL is an
     * unguessable ULID, so the link is the key. An account's order stays with that account — someone signed
     * out is sent to log in and brought back here, someone signed in as another account is refused.
     */
    private function authorizeAccess(Order $order): void
    {
        if ($order->customer_id === null) {
            return;
        }

        if (! auth('customer')->check()) {
            throw new AuthenticationException('Unauthenticated.', ['customer'], route('customer.login'));
        }

        abort_unless($order->customer_id === auth('customer')->id(), 403, 'Pesanan ini bukan milik anda.');
    }
}
