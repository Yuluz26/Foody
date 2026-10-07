import { Link, router, usePage } from '@inertiajs/react';
import { CheckIcon, IdentificationBadgeIcon, PauseCircleIcon, PencilSimpleIcon, PlusIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SelectionToolbar } from '@/components/admin/OrderListControls';
import { useRowSelection } from '@/components/admin/useRowSelection';
import { ConfirmButton } from '@/components/ConfirmButton';
import { Button, buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/format';
import type { AdminStaff, SharedProps } from '@/types';

type BulkAction = 'approve' | 'revoke' | 'delete';

function AccessBadge({ isApproved }: { isApproved: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-(--radius-module) px-2.5 text-xs font-bold tracking-wide whitespace-nowrap uppercase shadow-(--shadow-raised-xs)',
                isApproved ? 'bg-leaf text-white' : 'bg-amber-tint text-ink ring-1 ring-ink/20 ring-inset',
            )}
        >
            {isApproved ? <CheckIcon size={14} weight="bold" aria-hidden /> : <PauseCircleIcon size={14} weight="bold" aria-hidden />}
            {isApproved ? 'Aktif' : 'Tidak aktif'}
        </span>
    );
}

export default function StaffIndex({ staff }: { staff: AdminStaff[] }) {
    const { auth } = usePage<SharedProps>().props;
    const [bulkPending, setBulkPending] = useState(false);
    const { selected, toggleSelect, allSelected, toggleSelectAll, clear } = useRowSelection(staff);

    const runBulk = (action: BulkAction) => {
        setBulkPending(true);
        router.post(
            '/admin/staff/bulk',
            { ids: [...selected], action },
            {
                preserveScroll: true,
                onSuccess: clear,
                onFinish: () => setBulkPending(false),
            },
        );
    };

    const setAccess = (member: AdminStaff, action: 'approve' | 'revoke') => router.patch(`/admin/staff/${member.id}/${action}`, {}, { preserveScroll: true });

    return (
        <AdminLayout
            title="Kakitangan"
            actions={
                <Link href="/admin/staff/create" className={buttonClass()}>
                    <PlusIcon size={18} weight="bold" aria-hidden />
                    Tambah kakitangan
                </Link>
            }
        >
            <p className="-mt-2 max-w-[65ch] text-[15px] text-ink-muted">
                Admin mengurus menu, pelanggan, kakitangan dan tetapan. Chef hanya nampak ringkasan dan pesanan. Akaun baharu perlu diluluskan sebelum boleh log masuk, dan akaun yang digantung dilog keluar serta-merta.
            </p>

            {staff.length === 0 ? (
                <EmptyState Icon={IdentificationBadgeIcon} className="mt-8" title="Belum ada kakitangan" description="Tambah akaun untuk staf lain menguruskan panel ini.">
                    <Link href="/admin/staff/create" className={buttonClass()}>
                        <PlusIcon size={18} weight="bold" aria-hidden />
                        Tambah kakitangan
                    </Link>
                </EmptyState>
            ) : (
                <>
                    <SelectionToolbar
                        noun="kakitangan"
                        selectAllLabel="Pilih semua"
                        count={selected.size}
                        allSelected={allSelected}
                        bulkPending={bulkPending}
                        onToggleAll={toggleSelectAll}
                        onClear={clear}
                    >
                        <ConfirmButton
                            label="Luluskan"
                            variant="leaf"
                            size="sm"
                            disabled={bulkPending}
                            title={`Luluskan ${selected.size} kakitangan?`}
                            message="Akaun yang dipilih akan boleh log masuk ke panel ini. Akaun yang sudah aktif akan diabaikan."
                            confirmLabel="Ya, luluskan"
                            onConfirm={() => runBulk('approve')}
                        />
                        <ConfirmButton
                            label="Gantung"
                            size="sm"
                            disabled={bulkPending}
                            title={`Gantung ${selected.size} kakitangan?`}
                            message="Akaun yang dipilih akan dilog keluar serta-merta dan tidak boleh log masuk sehingga diluluskan semula. Akaun anda sendiri dan admin aktif terakhir tidak akan digantung."
                            confirmLabel="Ya, gantung"
                            onConfirm={() => runBulk('revoke')}
                        />
                        <ConfirmButton
                            label="Padam"
                            size="sm"
                            disabled={bulkPending}
                            title={`Padam ${selected.size} kakitangan?`}
                            message="Akaun yang dipilih akan dipadam selama-lamanya. Akaun anda sendiri dan admin aktif terakhir tidak akan dipadam."
                            confirmLabel="Ya, padam"
                            onConfirm={() => runBulk('delete')}
                        />
                    </SelectionToolbar>
                    <ul className="mt-4 grid gap-3">
                        {staff.map((member) => {
                            const isSelf = member.id === auth.user?.id;

                            return (
                                <li
                                    key={member.id}
                                    className={cn(
                                        'neu-tile grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-4 py-4 [--neu-radius:var(--radius-panel)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-5',
                                        selected.has(member.id) && 'shadow-(--shadow-inset-sm)',
                                    )}
                                >
                                    <input type="checkbox" checked={selected.has(member.id)} onChange={() => toggleSelect(member.id)} aria-label={`Pilih ${member.name}`} />
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                            <Link href={`/admin/staff/${member.id}/edit`} className="font-semibold hover:text-ink-soft hover:underline">
                                                {member.name}
                                            </Link>
                                            {isSelf && <span className="text-sm font-medium text-ink-muted">(anda)</span>}
                                            <span className={cn('inline-flex items-center gap-1 self-center text-sm font-semibold', member.role === 'admin' ? 'text-ink' : 'text-ink-muted')}>
                                                {member.role === 'admin' && <ShieldCheckIcon size={15} weight="bold" aria-hidden />}
                                                {member.roleLabel}
                                            </span>
                                        </div>
                                        <p className="truncate text-sm text-ink-muted">{member.email}</p>
                                    </div>
                                    <div className="col-start-2 flex flex-wrap items-center gap-2 sm:col-start-auto sm:justify-end">
                                        <AccessBadge isApproved={member.isApproved} />
                                        {!member.isApproved && (
                                            <Button variant="leaf" size="sm" onClick={() => setAccess(member, 'approve')}>
                                                Luluskan
                                            </Button>
                                        )}
                                        {member.isApproved && !isSelf && (
                                            <ConfirmButton
                                                label="Gantung"
                                                size="sm"
                                                title={`Gantung akses ${member.name}?`}
                                                message="Akaun ini akan dilog keluar serta-merta dan tidak boleh log masuk sehingga diluluskan semula."
                                                confirmLabel="Ya, gantung"
                                                onConfirm={() => setAccess(member, 'revoke')}
                                            />
                                        )}
                                        <Link href={`/admin/staff/${member.id}/edit`} aria-label={`Edit ${member.name}`} className={buttonClass({ variant: 'quiet', size: 'sm' })}>
                                            <PencilSimpleIcon size={16} weight="bold" aria-hidden />
                                            <span className="sr-only sm:not-sr-only">Edit</span>
                                        </Link>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </AdminLayout>
    );
}
