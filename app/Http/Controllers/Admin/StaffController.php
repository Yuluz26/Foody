<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StaffRequest;
use App\Models\User;
use App\Support\AdminPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Staff/Index', [
            'staff' => User::query()->orderBy('name')->get()->map(AdminPresenter::staff(...)),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Staff/Form', ['staff' => null]);
    }

    public function store(StaffRequest $request): RedirectResponse
    {
        $staff = new User([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),
        ]);
        $staff->is_admin = true;
        $staff->save();

        return to_route('admin.staff.index')->with('success', "Kakitangan {$staff->name} ditambah. Menunggu kelulusan sebelum boleh log masuk.");
    }

    public function edit(User $staff): Response
    {
        return Inertia::render('Admin/Staff/Form', ['staff' => AdminPresenter::staff($staff)]);
    }

    public function update(StaffRequest $request, User $staff): RedirectResponse
    {
        $staff->name = $request->validated('name');
        $staff->email = $request->validated('email');

        if ($request->filled('password')) {
            $staff->password = $request->validated('password');
        }

        $staff->save();

        return to_route('admin.staff.index')->with('success', "Maklumat {$staff->name} dikemas kini.");
    }

    public function destroy(Request $request, User $staff): RedirectResponse
    {
        if ($staff->id === $request->user('web')->id) {
            return back()->with('error', 'Anda tidak boleh memadam akaun anda sendiri.');
        }

        if ($this->isLastApprovedAdmin($staff)) {
            return back()->with('error', 'Tidak boleh memadam kakitangan diluluskan yang terakhir.');
        }

        $name = $staff->name;
        $staff->delete();

        return to_route('admin.staff.index')->with('success', "Kakitangan {$name} dipadam.");
    }

    public function approve(User $staff): RedirectResponse
    {
        $staff->approved_at = now();
        $staff->save();

        return back()->with('success', "Kakitangan {$staff->name} diluluskan.");
    }

    public function bulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer'],
            'action' => ['required', Rule::in(['approve', 'delete'])],
        ]);

        $action = $validated['action'];
        $affected = 0;
        $currentUserId = $request->user('web')->id;

        DB::transaction(function () use ($validated, $action, &$affected, $currentUserId) {
            $staffMembers = User::query()->whereIn('id', $validated['ids'])->lockForUpdate()->get();

            foreach ($staffMembers as $staff) {
                if ($action === 'approve') {
                    if ($staff->isApproved()) {
                        continue;
                    }

                    $staff->approved_at = now();
                    $staff->save();
                    $affected++;

                    continue;
                }

                if ($staff->id === $currentUserId || $this->isLastApprovedAdmin($staff)) {
                    continue;
                }

                $staff->delete();
                $affected++;
            }
        });

        $messages = [
            'approve' => $affected === 1 ? '1 kakitangan diluluskan.' : "{$affected} kakitangan diluluskan.",
            'delete' => $affected === 1 ? '1 kakitangan dipadam.' : "{$affected} kakitangan dipadam.",
        ];

        return back()->with($affected > 0 ? 'success' : 'error', $affected > 0 ? $messages[$action] : 'Tiada kakitangan yang boleh dikemas kini dengan tindakan ini.');
    }

    private function isLastApprovedAdmin(User $staff): bool
    {
        if (! $staff->isApproved()) {
            return false;
        }

        return User::query()->whereNotNull('approved_at')->where('id', '!=', $staff->id)->doesntExist();
    }
}
