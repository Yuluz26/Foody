<?php

namespace App\Support;

use App\Models\Order;
use App\Models\RestaurantSetting;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DomPdf;
use Illuminate\Database\Eloquent\Collection;

/** Builds the a5-portrait receipt PDF shared by the customer's own download and the admin single/bulk reprints. */
class ReceiptPdf
{
    public static function for(Order $order): DomPdf
    {
        $order->loadMissing('items.addOns');

        return Pdf::loadView('receipts.order', [
            'order' => $order,
            'restaurant' => RestaurantSetting::current(),
        ])->setPaper('a5', 'portrait');
    }

    /** @param  Collection<int, Order>  $orders */
    public static function forMany(Collection $orders): DomPdf
    {
        $orders->loadMissing('items.addOns');

        return Pdf::loadView('receipts.bulk', [
            'orders' => $orders,
            'restaurant' => RestaurantSetting::current(),
        ])->setPaper('a5', 'portrait');
    }
}
