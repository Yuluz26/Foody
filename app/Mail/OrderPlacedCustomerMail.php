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

/**
 * Implementing ShouldQueue makes Mail::send() dispatch this to the queue instead of sending
 * inline — real SMTP auth to smtp.office365.com is currently rejected and takes ~20s+ to fail
 * per attempt, which blew past PHP's execution time limit and crashed checkout. Queuing keeps
 * checkout fast regardless of how long (or badly) the SMTP attempt behaves.
 */
class OrderPlacedCustomerMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing('items.addOns');
    }

    public function envelope(): Envelope
    {
        $restaurant = RestaurantSetting::current();

        return new Envelope(
            subject: "Resit pesanan {$this->order->order_number} — {$restaurant->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.order-placed-customer',
            with: [
                'order' => $this->order,
                'restaurant' => RestaurantSetting::current(),
            ],
        );
    }
}
