<?php

namespace App\Http\Controllers\Admin;

use App\Actions\PlaceOrder;
use App\Exceptions\OrderRejected;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PosOrderRequest;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\RestaurantSetting;
use App\Support\MenuPresenter;
use App\Support\TableAvailability;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** The counter screen: staff key in an order for someone standing in front of them. */
class PosController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = Category::query()
            ->active()
            ->ordered()
            ->with(['products' => fn ($query) => $query->ordered()->with('addOns')])
            ->get()
            ->filter(fn (Category $category) => $category->products->isNotEmpty())
            ->values();

        $done = $request->integer('selesai') ?: null;

        return Inertia::render('Admin/Pos/Index', [
            'categories' => $categories->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'products' => $category->products->map(fn (Product $product) => [
                    ...MenuPresenter::product($product),
                    // Staff see the real count, not just the "nearly gone" hint guests get.
                    'stockQuantity' => $product->track_stock ? $product->stock_quantity : null,
                ])->all(),
            ])->all(),
            'tables' => [
                'all' => TableAvailability::all(),
                'available' => TableAvailability::available(),
            ],
            'restaurant' => ['name' => RestaurantSetting::current()->name],
            'completed' => $done ? $this->completed($done) : null,
        ]);
    }

    public function store(PosOrderRequest $request, PlaceOrder $placeOrder): RedirectResponse
    {
        try {
            $order = $placeOrder->handleForStaff([...$request->validated(), 'paid' => $request->boolean('paid')], $request->user('web'));
        } catch (OrderRejected $exception) {
            throw ValidationException::withMessages(['order' => $exception->getMessage()]);
        }

        return to_route('admin.pos', ['selesai' => $order->id]);
    }

    /** @return array<string, mixed>|null */
    private function completed(int $id): ?array
    {
        $order = Order::query()->where('source', 'pos')->find($id);

        if ($order === null) {
            return null;
        }

        return [
            'id' => $order->id,
            'number' => $order->order_number,
            'total' => $order->total,
            'typeLabel' => $order->type->label(),
            'tableNumber' => $order->table_number,
            'paymentStatus' => $order->payment_status->value,
            'paymentStatusLabel' => $order->payment_status->label(),
            'receiptUrl' => route('admin.orders.receipt', $order),
        ];
    }
}
