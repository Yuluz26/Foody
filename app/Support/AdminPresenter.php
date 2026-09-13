<?php

namespace App\Support;

use App\Enums\OrderStatus;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductAddOn;
use App\Models\User;

class AdminPresenter
{
    /** @return array<string, mixed> */
    public static function orderRow(Order $order): array
    {
        return [
            'id' => $order->id,
            'number' => $order->order_number,
            'publicId' => $order->public_id,
            'customerName' => $order->customer_name,
            'customerPhone' => $order->customer_phone,
            'type' => $order->type->value,
            'typeLabel' => $order->type->label(),
            'tableNumber' => $order->table_number,
            'status' => $order->status->value,
            'statusLabel' => $order->status->label(),
            'isActive' => $order->status->isActive(),
            'total' => $order->total,
            'paymentMethod' => $order->payment_method->value,
            'paymentMethodLabel' => $order->payment_method->label(),
            'paymentStatus' => $order->payment_status->value,
            'paymentStatusLabel' => $order->payment_status->label(),
            'itemsCount' => (int) ($order->items_count ?? $order->items->sum('quantity')),
            'createdAt' => $order->created_at->toIso8601String(),
            'nextStatuses' => self::statusOptions($order->status->nextStatuses()),
        ];
    }

    /** @return array<string, mixed> */
    public static function orderDetail(Order $order): array
    {
        return [
            ...self::orderRow($order),
            ...MenuPresenter::order($order),
            'id' => $order->id,
            'customerPhone' => $order->customer_phone,
            'timeline' => collect(OrderStatus::cases())
                ->map(fn (OrderStatus $status) => [
                    'status' => $status->value,
                    'label' => $status->label(),
                    'at' => ($status === OrderStatus::Pending ? $order->created_at : $order->{$status->timestampColumn()})?->toIso8601String(),
                ])
                ->filter(fn (array $step) => $step['at'] !== null)
                ->values()
                ->all(),
        ];
    }

    /**
     * @param  list<OrderStatus>  $statuses
     * @return list<array{value: string, label: string}>
     */
    public static function statusOptions(array $statuses): array
    {
        return array_map(fn (OrderStatus $status) => ['value' => $status->value, 'label' => $status->label()], $statuses);
    }

    /** @return array<string, mixed> */
    public static function product(Product $product): array
    {
        return [
            'id' => $product->id,
            'categoryId' => $product->category_id,
            'categoryName' => $product->category?->name,
            'name' => $product->name,
            'description' => $product->description,
            'price' => $product->price,
            'imageUrl' => $product->image_url,
            'isAvailable' => $product->is_available,
            'isFeatured' => $product->is_featured,
            'sortOrder' => $product->sort_order,
            'addOns' => $product->addOns->map(fn (ProductAddOn $addOn) => [
                'id' => $addOn->id,
                'name' => $addOn->name,
                'price' => $addOn->price,
            ])->all(),
        ];
    }

    /** @return array<string, mixed> */
    public static function category(Category $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'description' => $category->description,
            'imageUrl' => $category->image_url,
            'isActive' => $category->is_active,
            'sortOrder' => $category->sort_order,
            'productsCount' => $category->products_count ?? null,
        ];
    }

    /** @return array<string, mixed> */
    public static function staff(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'isApproved' => $user->isApproved(),
            'createdAt' => $user->created_at->toIso8601String(),
        ];
    }
}
