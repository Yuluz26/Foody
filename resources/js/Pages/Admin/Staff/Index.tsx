import { Link, router, usePage } from '@inertiajs/react';
import { CheckIcon, HourglassIcon, IdentificationBadgeIcon, PencilSimpleIcon, PlusIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmButton } from '@/components/ConfirmButton';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/format';
import type { AdminStaff, SharedProps } from '@/types';

const addLinkClass =
    'flex h-12 items-center gap-2 rounded-(--radius-control) bg-ink px-4 font-semibold text-white transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:bg-ink-soft hover:shadow-(--shadow-lift) active:translate-y-0 active:scale-[0.97]';

function ApprovalBadge({ isApproved }: { isApproved: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-(--radius-module) px-2.5 text-xs font-bold tracking-wide whitespace-nowrap uppercase',
                isApproved ? 'bg-leaf text-white' : 'bg-amber-tint text-ink ring-1 ring-ink/20 ring-inset',
            )}
        >
            {isApproved ? <CheckIcon size={14} weight="bold" aria-hidden /> : <HourglassIcon size={14} weight="bold" aria-hidden />}
            {isApproved ? 'Aktif' : 'Belum diluluskan'}
        </span>
    );
}

export default function StaffIndex({ staff }: { staff: AdminStaff[] }) {
    const { auth } = usePage<SharedProps>().props;
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [bulkPending, setBulkPending] = useState(false);

    const ids = staff.map((member) => member.id);
    const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
    const toggleSelectAll = () => setSelected(allSelected ? new Set() : new Set(ids));

    const toggleSelect = (id: number) =>
        setSelected((current) => {
            const next = new Set(current);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });

    const runBulk = (action: 'approve' | 'delete') => {
        setBulkPending(true);
        router.post(
            '/admin/staff/bulk',
            { ids: [...selected], action },
            {
                preserveScroll: true,
                onSuccess: () => setSelected(new Set()),
                onFinish: () => setBulkPending(false),
            },
        );
    };

    return (
        <AdminLayout
            title="Kakitangan"
            actions={
                <Link href="/admin/staff/create" className={addLinkClass}>
                    <PlusIcon size={18} weight="bold" aria-hidden />
                    Tambah kakitangan
                </Link>
            }
        >
            <p className="-mt-2 max-w-[65ch] text-[15px] text-ink-muted">
                Akaun baharu perlu diluluskan sebelum boleh log masuk ke panel ini. Akaun anda sendiri dan kakitangan diluluskan terakhir tidak boleh dipadam.
            </p>

            {staff.length === 0 ? (
                <div className="mt-8 flex flex-col items-start gap-4 rounded-(--radius-panel) border-2 border-dashed border-rule-strong p-8">
                    <IdentificationBadgeIcon size={36} weight="bold" className="text-rule-strong" aria-hidden />
                    <div>
                        <p className="text-lg font-semibold">Belum ada kakitangan</p>
                        <p className="text-[15px] text-ink-muted">Tambah akaun untuk staf lain menguruskan panel ini.</p>
                    </div>
                    <Link href="/admin/staff/create" className={addLinkClass}>
                        <PlusIcon size={18} weight="bold" aria-hidden />
                        Tambah kakitangan
                    </Link>
                </div>
            ) : (
                <>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-t-(--radius-panel) border-2 border-b-0 border-rule-strong bg-ground px-4 py-2.5">
                        <label className="flex items-center gap-2.5 text-[15px] font-semibold text-ink-soft">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                className="size-5 shrink-0 rounded-sm border-2 border-rule-strong accent-ink"
                            />
                            {selected.size > 0 ? `${selected.size} kakitangan dipilih` : 'Pilih semua'}
                        </label>
                        {selected.size > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
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
                                    label="Padam"
                                    size="sm"
                                    disabled={bulkPending}
                                    title={`Padam ${selected.size} kakitangan?`}
                                    message="Akaun yang dipilih akan dipadam selama-lamanya. Akaun anda sendiri dan kakitangan diluluskan terakhir tidak akan dipadam."
                                    confirmLabel="Ya, padam"
                                    onConfirm={() => runBulk('delete')}
                                />
                                <Button variant="quiet" size="sm" disabled={bulkPending} onClick={() => setSelected(new Set())}>
                                    Nyahpilih
                                </Button>
                            </div>
                        )}
                    </div>
                    <ul className="divide-y divide-rule border-y border-rule bg-panel">
                        {staff.map((member) => {
                            const isSelf = member.id === auth.user?.id;

                            return (
                                <li key={member.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-4 transition-colors duration-150 hover:bg-ground sm:px-5">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(member.id)}
                                        onChange={() => toggleSelect(member.id)}
                                        aria-label={`Pilih ${member.name}`}
                                        className="size-5 shrink-0 rounded-sm border-2 border-rule-strong accent-ink"
                                    />
                                    <div className="min-w-0">
                                        <Link href={`/admin/staff/${member.id}/edit`} className="font-semibold hover:text-ink-soft hover:underline">
                                            {member.name}
                                            {isSelf && <span className="ml-2 text-sm font-medium text-ink-muted">(anda)</span>}
                                        </Link>
                                        <p className="truncate text-sm text-ink-muted">{member.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ApprovalBadge isApproved={member.isApproved} />
                                        <Link
                                            href={`/admin/staff/${member.id}/edit`}
                                            className="group flex h-10 items-center gap-1.5 rounded-(--radius-control) px-3 text-sm font-semibold transition-colors duration-150 hover:bg-rule/60"
                                        >
                                            <PencilSimpleIcon size={16} weight="bold" aria-hidden className="transition-transform duration-150 ease-out group-hover:-rotate-12" />
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
