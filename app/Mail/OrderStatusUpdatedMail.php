<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\RestaurantSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** Queued — see OrderPlacedCustomerMail for why. */
class OrderStatusUpdatedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order)
    {
        //
    }

    public function envelope(): Envelope
    {
        $restaurant = RestaurantSetting::current();

        return new Envelope(
            subject: "Pesanan {$this->order->order_number} kini {$this->order->status->label()} — {$restaurant->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.order-status-updated',
            with: [
                'order' => $this->order,
                'restaurant' => RestaurantSetting::current(),
                'statusUrl' => route('orders.show', $this->order),
            ],
        );
    }
}
