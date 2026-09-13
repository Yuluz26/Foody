<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** Queued — see OrderPlacedCustomerMail for why. */
class OrderPlacedStaffMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing('items.addOns');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Pesanan baru {$this->order->order_number}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.order-placed-staff',
            with: [
                'order' => $this->order,
                'adminUrl' => route('admin.orders.show', $this->order),
            ],
        );
    }
}
