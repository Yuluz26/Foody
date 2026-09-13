<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StaffRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StaffRequest;
use App\Models\User;
use App\Support\AdminPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    private const LAST_ADMIN_MESSAGE = 'Sekurang-kurangnya seorang admin aktif mesti kekal. Lantik admin lain dahulu.';

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
        $staff = new User($request->safe()->only(['name', 'email', 'password']));
        $staff->is_admin = true;
        $staff->role = StaffRole::from($request->validated('role'));
        $staff->save();

        $this->audit($request, 'Staff account created', $staff, ['role' => $staff->role->value]);

        return to_route('admin.staff.index')->with('success', "Kakitangan {$staff->name} ditambah. Luluskan akaun ini supaya boleh log masuk.");
    }

    public function edit(User $staff): Response
    {
        return Inertia::render('Admin/Staff/Form', ['staff' => AdminPresenter::staff($staff)]);
    }

    public function update(StaffRequest $request, User $staff): RedirectResponse
    {
        $role = StaffRole::from($request->validated('role'));

        $updated = DB::transaction(function () use ($request, $staff, $role) {
            if ($role !== StaffRole::Admin && $this->isLastActiveAdmin($staff)) {
                return false;
            }

            $staff->name = $request->validated('name');
            $staff->email = $request->validated('email');
            $staff->role = $role;

            if ($request->filled('password')) {
                $staff->password = $request->validated('password');
            }

            $changed = array_keys($staff->getDirty());
            $staff->save();

            $this->audit($request, 'Staff account updated', $staff, ['changed' => $changed]);

            return true;
        });

        if (! $updated) {
            return back()->with('error', self::LAST_ADMIN_MESSAGE);
        }

        // auth.session compares the signed-in user's password hash, so hand it the saved copy or editing yourself signs you out.
        if ($staff->is($request->user('web'))) {
            Auth::guard('web')->setUser($staff);
        }

        return to_route('admin.staff.index')->with('success', "Maklumat {$staff->name} dikemas kini.");
    }

    public function destroy(Request $request, User $staff): RedirectResponse
    {
        if ($staff->is($request->user('web'))) {
            return back()->with('error', 'Anda tidak boleh memadam akaun anda sendiri.');
        }

        $deleted = DB::transaction(function () use ($request, $staff) {
            if ($this->isLastActiveAdmin($staff)) {
                return false;
            }

            $staff->delete();
            $this->audit($request, 'Staff account deleted', $staff);

            return true;
        });

        if (! $deleted) {
            return back()->with('error', self::LAST_ADMIN_MESSAGE);
        }

        return to_route('admin.staff.index')->with('success', "Kakitangan {$staff->name} dipadam.");
    }

    public function approve(Request $request, User $staff): RedirectResponse
    {
        if (! $staff->isApproved()) {
            $staff->approved_at = now();
            $staff->save();

            $this->audit($request, 'Staff account approved', $staff);
        }

        return back()->with('success', "Akaun {$staff->name} kini aktif.");
    }

    public function revoke(Request $request, User $staff): RedirectResponse
    {
        if ($staff->is($request->user('web'))) {
            return back()->with('error', 'Anda tidak boleh menggantung akaun anda sendiri.');
        }

        $revoked = DB::transaction(function () use ($request, $staff) {
            if ($this->isLastActiveAdmin($staff)) {
                return false;
            }

            $this->deactivate($staff);
            $this->audit($request, 'Staff account suspended', $staff);

            return true;
        });

        if (! $revoked) {
            return back()->with('error', self::LAST_ADMIN_MESSAGE);
        }

        return back()->with('success', "Akses {$staff->name} digantung.");
    }

    public function bulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer'],
            'action' => ['required', Rule::in(['approve', 'revoke', 'delete'])],
        ]);

        $action = $validated['action'];
        $actorId = $request->user('web')->id;

        $affected = DB::transaction(function () use ($request, $validated, $action, $actorId) {
            // Take the admin locks before the selected rows, the same order the single-account actions use, so they can't deadlock.
            $this->activeAdminIds();
            $affected = 0;

            foreach (User::query()->whereIn('id', $validated['ids'])->lockForUpdate()->get() as $staff) {
                if ($action === 'approve') {
                    if (! $staff->isApproved()) {
                        $staff->approved_at = now();
                        $staff->save();
                        $this->audit($request, 'Staff account approved', $staff);
                        $affected++;
                    }

                    continue;
                }

                if ($staff->id === $actorId || $this->isLastActiveAdmin($staff)) {
                    continue;
                }

                if ($action === 'revoke') {
                    if (! $staff->isApproved()) {
                        continue;
                    }

                    $this->deactivate($staff);
                    $this->audit($request, 'Staff account suspended', $staff);
                } else {
                    $staff->delete();
                    $this->audit($request, 'Staff account deleted', $staff);
                }

                $affected++;
            }

            return $affected;
        });

        if ($affected === 0) {
            return back()->with('error', 'Tiada kakitangan yang boleh dikemas kini dengan tindakan ini.');
        }

        $done = ['approve' => 'diaktifkan', 'revoke' => 'digantung', 'delete' => 'dipadam'][$action];

        return back()->with('success', "{$affected} kakitangan {$done}.");
    }

    /**
     * Row-locks the active admins until the transaction ends, so two removals racing each other can't both pass the check.
     *
     * @return Collection<int, int>
     */
    private function activeAdminIds(): Collection
    {
        return User::query()
            ->where('role', StaffRole::Admin)
            ->whereNotNull('approved_at')
            ->lockForUpdate()
            ->pluck('id')
            ->map(fn ($id) => (int) $id);
    }

    private function isLastActiveAdmin(User $staff): bool
    {
        $ids = $this->activeAdminIds();

        return $ids->count() === 1 && $ids->first() === $staff->id;
    }

    /** A fresh remember token stops an old "keep me signed in" cookie from working if the account is reactivated later. */
    private function deactivate(User $staff): void
    {
        $staff->approved_at = null;
        $staff->setRememberToken(Str::random(60));
        $staff->save();
    }

    /** @param array<string, mixed> $context */
    private function audit(Request $request, string $event, User $staff, array $context = []): void
    {
        Log::info($event, ['staff_id' => $staff->id, 'staff_email' => $staff->email, 'by_user_id' => $request->user('web')?->id, ...$context]);
    }
}
