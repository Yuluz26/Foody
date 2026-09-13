<?php

namespace App\Support;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductAddOn;
use App\Models\RestaurantSetting;

/**
 * Shapes models into the plain arrays the customer panel receives.
 * Only fields the public page needs are exposed.
 */
class MenuPresenter
{
    /** @return array<string, mixed> */
    public static function restaurant(RestaurantSetting $settings): array
    {
        return [
            'name' => $settings->name,
            'description' => $settings->description,
            'phone' => $settings->phone,
            'address' => $settings->address,
            'logoUrl' => $settings->logo_url,
            'opensAt' => $settings->opens_at ? substr($settings->opens_at, 0, 5) : null,
            'closesAt' => $settings->closes_at ? substr($settings->closes_at, 0, 5) : null,
            'isOpen' => $settings->isOpenNow(),
            'orderingEnabled' => $settings->ordering_enabled,
            'acceptingOrders' => $settings->isAcceptingOrders(),
            'dineInEnabled' => $settings->dine_in_enabled,
            'takeawayEnabled' => $settings->takeaway_enabled,
            'qrCodeUrl' => $settings->qr_code_url,
            'paymentInstructions' => $settings->payment_instructions,
        ];
    }

    /** @return array<string, mixed> */
    public static function product(Product $product): array
    {
        return [
            'id' => $product->id,
            'categoryId' => $product->category_id,
            'name' => $product->name,
            'description' => $product->description,
            'price' => $product->price,
            'imageUrl' => $product->image_url,
            'isAvailable' => $product->is_available,
            'isFeatured' => $product->is_featured,
            'addOns' => $product->addOns->map(fn (ProductAddOn $addOn) => [
                'id' => $addOn->id,
                'name' => $addOn->name,
                'price' => $addOn->price,
            ])->all(),
        ];
    }

    /** @return array<string, mixed> */
    public static function order(Order $order): array
    {
        $order->loadMissing('items.addOns');

        return [
            'publicId' => $order->public_id,
            'number' => $order->order_number,
            'status' => $order->status->value,
            'statusLabel' => $order->status->label(),
            'type' => $order->type->value,
            'typeLabel' => $order->type->label(),
            'tableNumber' => $order->table_number,
            'customerName' => $order->customer_name,
            'notes' => $order->notes,
            'subtotal' => $order->subtotal,
            'total' => $order->total,
            'paymentMethod' => $order->payment_method->value,
            'paymentMethodLabel' => $order->payment_method->label(),
            'paymentStatus' => $order->payment_status->value,
            'paymentStatusLabel' => $order->payment_status->label(),
            'paymentProofUrl' => $order->payment_proof_url,
            'createdAt' => $order->created_at->toIso8601String(),
            'updatedAt' => $order->updated_at->toIso8601String(),
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->product_name,
                'quantity' => $item->quantity,
                'unitPrice' => $item->unit_price,
                'addOnsTotal' => $item->add_ons_total,
                'lineTotal' => $item->line_total,
                'addOns' => $item->addOns->map(fn ($addOn) => ['name' => $addOn->name, 'price' => $addOn->price])->all(),
            ])->all(),
        ];
    }
}
