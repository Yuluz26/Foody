<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $term = trim((string) ($request->validate(['q' => ['nullable', 'string', 'max:100']])['q'] ?? ''));
        $digits = preg_replace('/\D+/', '', $term);

        $customers = Customer::query()
            ->withCount('orders')
            ->when($term !== '', function (Builder $query) use ($term, $digits) {
                $query->where(function (Builder $query) use ($term, $digits) {
                    $query->where('name', 'like', "%{$term}%");

                    if ($digits !== '') {
                        $query->orWhere('phone', 'like', "%{$digits}%");
                    }
                });
            })
            ->orderByDesc('last_order_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Customer $customer) => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'ordersCount' => $customer->orders_count,
                'lastOrderAt' => $customer->last_order_at?->toIso8601String(),
                'createdAt' => $customer->created_at->toIso8601String(),
            ]);

        return Inertia::render('Admin/Customers/Index', [
            'customers' => $customers,
            'filters' => ['q' => $term],
        ]);
    }
}
