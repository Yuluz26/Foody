<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CustomerRequest;
use App\Models\Customer;
use App\Support\AdminPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
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
            ->through(AdminPresenter::customer(...));

        return Inertia::render('Admin/Customers/Index', [
            'customers' => $customers,
            'filters' => ['q' => $term],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Customers/Form', ['customer' => null]);
    }

    public function store(CustomerRequest $request): RedirectResponse
    {
        $customer = new Customer($request->safe()->only(['name', 'email']));
        $customer->phone = Customer::normalizePhone($request->validated('phone'));

        if ($request->filled('password')) {
            $customer->password = $request->validated('password');
        }

        $customer->save();

        return to_route('admin.customers.index')->with('success', "Pelanggan {$customer->name} ditambah.");
    }

    public function edit(Customer $customer): Response
    {
        return Inertia::render('Admin/Customers/Form', ['customer' => AdminPresenter::customer($customer)]);
    }

    public function update(CustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->name = $request->validated('name');
        $customer->email = $request->validated('email');
        $customer->phone = Customer::normalizePhone($request->validated('phone'));

        if ($request->filled('password')) {
            $customer->password = $request->validated('password');
        }

        $customer->save();

        return to_route('admin.customers.index')->with('success', "Maklumat {$customer->name} dikemas kini.");
    }

    /** Orders keep their own customer_name/customer_phone snapshot, so deleting the account never touches order history. */
    public function destroy(Customer $customer): RedirectResponse
    {
        $name = $customer->name;
        $customer->delete();

        return to_route('admin.customers.index')->with('success', "Pelanggan {$name} dipadam.");
    }

    public function bulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer'],
            'action' => ['required', Rule::in(['delete'])],
        ]);

        $affected = Customer::query()->whereIn('id', $validated['ids'])->delete();

        return back()->with(
            $affected > 0 ? 'success' : 'error',
            $affected > 0 ? ($affected === 1 ? '1 pelanggan dipadam.' : "{$affected} pelanggan dipadam.") : 'Tiada pelanggan yang boleh dipadam.',
        );
    }
}
