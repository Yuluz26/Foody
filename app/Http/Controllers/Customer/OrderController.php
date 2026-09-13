<?php

namespace App\Http\Controllers\Customer;

use App\Actions\PlaceOrder;
use App\Enums\OrderStatus;
use App\Exceptions\OrderRejected;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Mail\OrderCancelledStaffMail;
use App\Models\Order;
use App\Models\RestaurantSetting;
use App\Support\MenuPresenter;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response as HttpResponse;
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
        $this->authorizeOwner($order);

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
    public function cancel(Order $order): RedirectResponse
    {
        $this->authorizeOwner($order);

        abort_unless(
            in_array($order->status, [OrderStatus::Pending, OrderStatus::Confirmed], true),
            422,
            'Pesanan ini tidak boleh dibatalkan lagi. Sila hubungi kedai.',
        );

        // Timestamp columns (confirmed_at, cancelled_at, ...) aren't mass-assignable — set directly,
        // matching how the admin status-change path does it.
        $order->status = OrderStatus::Cancelled;
        $order->cancelled_at = now();
        $order->cancelled_by_customer = true;
        $order->save();

        try {
            Mail::to(config('mail.from.address'))->send(new OrderCancelledStaffMail($order));
        } catch (Throwable $exception) {
            Log::error('Failed to send order-cancelled staff email', ['order_id' => $order->id, 'error' => $exception->getMessage()]);
        }

        return back()->with('success', "Pesanan {$order->order_number} dibatalkan.");
    }

    public function receipt(Order $order): HttpResponse
    {
        $this->authorizeOwner($order);

        $order->loadMissing('items.addOns');
        $restaurant = RestaurantSetting::current();

        $pdf = Pdf::loadView('receipts.order', ['order' => $order, 'restaurant' => $restaurant])
            ->setPaper('a5', 'portrait');

        return $pdf->download("resit-{$order->order_number}.pdf");
    }

    private function authorizeOwner(Order $order): void
    {
        abort_unless($order->customer_id === auth('customer')->id(), 403, 'Pesanan ini bukan milik anda.');
    }
}
