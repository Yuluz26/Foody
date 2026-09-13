import { router, usePage, usePoll } from '@inertiajs/react';
import { MagnifyingGlassIcon, TrayIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmButton } from '@/components/ConfirmButton';
import { OrderQueueRow, useMinuteTick } from '@/components/admin/OrderQueue';
import { Pagination } from '@/components/Pagination';
import { ADMIN_STATUS } from '@/components/admin/StatusBadge';
import { useFilters } from '@/components/admin/useFilters';
import { Button } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/Field';
import { cn } from '@/lib/format';
import type { AdminOrderRow, Paginated, StatusOption } from '@/types';

type Filters = { q: string; status: string; type: string; date: string };

type OrdersIndexProps = {
    orders: Paginated<AdminOrderRow>;
    filters: Filters;
    statusOptions: StatusOption[];
    activeCount: number;
};

const EMPTY: Filters = { q: '', status: 'active', type: '', date: '' };

export default function OrdersIndex({ orders, filters: initial, statusOptions, activeCount }: OrdersIndexProps) {
    const { filters, set, reset } = useFilters('/admin/orders', initial);
    const now = useMinuteTick();
    usePoll(15_000, { only: ['orders', 'activeCount', 'adminCounts'] });

    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [bulkPending, setBulkPending] = useState(false);
    const isAdmin = usePage().props.auth.user?.role === 'admin';
    const pageIds = orders.data.map((order) => order.id);

    // The visible page of orders changes under selection (poll, filter, page nav) — drop
    // any pick that's no longer on screen instead of silently bulk-acting on it later.
    useEffect(() => {
        setSelected((current) => {
            const next = new Set([...current].filter((id) => pageIds.includes(id)));
            return next.size === current.size ? current : next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders.data]);

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

    const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
    const toggleSelectAll = () => setSelected(allSelected ? new Set() : new Set(pageIds));

    const runBulk = (action: 'approve' | 'reject' | 'delete') => {
        setBulkPending(true);
        router.post(
            '/admin/orders/bulk',
            { ids: [...selected], action },
            {
                preserveScroll: true,
                onSuccess: () => setSelected(new Set()),
                onFinish: () => setBulkPending(false),
            },
        );
    };

    const tabs = [
        { value: 'active', label: `Aktif (${activeCount})` },
        { value: 'all', label: 'Semua' },
        ...statusOptions.map((option) => ({ value: option.value, label: ADMIN_STATUS[option.value].label })),
    ];

    const filtered = filters.q !== '' || filters.type !== '' || filters.date !== '' || filters.status !== 'active';

    return (
        <AdminLayout title="Pesanan">
            <div role="tablist" aria-label="Tapis status" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b-2 border-rule px-4 sm:mx-0 sm:px-0">
                {tabs.map((tab) => {
                    const selected = filters.status === tab.value;

                    return (
                        <button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => set('status', tab.value)}
                            className={cn(
                                'relative h-12 shrink-0 px-3 font-semibold whitespace-nowrap transition-colors duration-150',
                                selected ? 'text-ink after:absolute after:inset-x-2 after:-bottom-0.5 after:h-1 after:rounded-full after:bg-amber' : 'text-ink-soft hover:text-ink',
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_11rem]">
                <label className="relative block">
                    <span className="sr-only">Cari nombor pesanan, nama atau telefon</span>
                    <MagnifyingGlassIcon size={20} weight="bold" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" aria-hidden />
                    <input
                        type="search"
                        value={filters.q}
                        onChange={(event) => set('q', event.target.value)}
                        placeholder="Cari FD0012, nama atau telefon"
                        className={cn(inputClass, 'pl-10')}
                    />
                </label>
                <label className="block">
                    <span className="sr-only">Jenis pesanan</span>
                    <select value={filters.type} onChange={(event) => set('type', event.target.value)} className={inputClass}>
                        <option value="">Semua jenis</option>
                        <option value="dine_in">Makan di sini</option>
                        <option value="takeaway">Bungkus</option>
                    </select>
                </label>
                <label className="block">
                    <span className="sr-only">Tarikh</span>
                    <input type="date" value={filters.date} onChange={(event) => set('date', event.target.value)} className={inputClass} />
                </label>
            </div>

            {orders.data.length === 0 ? (
                <div className="mt-8 flex flex-col items-start gap-4 rounded-(--radius-panel) border-2 border-dashed border-rule-strong p-8">
                    <TrayIcon size={36} weight="bold" className="text-rule-strong" aria-hidden />
                    <div>
                        <p className="text-lg font-semibold">{filtered ? 'Tiada pesanan sepadan dengan tapisan ini' : 'Tiada pesanan aktif'}</p>
                        <p className="text-[15px] text-ink-muted">
                            {filtered ? 'Cuba kosongkan carian atau pilih status lain.' : 'Pesanan baru akan muncul di sini sendiri.'}
                        </p>
                    </div>
                    {filtered && (
                        <Button variant="outline" size="sm" onClick={() => reset(EMPTY)}>
                            Kosongkan tapisan
                        </Button>
                    )}
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
                            {selected.size > 0 ? `${selected.size} pesanan dipilih` : 'Pilih semua di halaman ini'}
                        </label>
                        {selected.size > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <ConfirmButton
                                    label="Sahkan"
                                    variant="leaf"
                                    size="sm"
                                    disabled={bulkPending}
                                    title={`Sahkan ${selected.size} pesanan?`}
                                    message="Hanya pesanan yang masih Baru akan disahkan; pesanan lain dalam pilihan ini akan diabaikan."
                                    confirmLabel="Ya, sahkan"
                                    onConfirm={() => runBulk('approve')}
                                />
                                <ConfirmButton
                                    label="Tolak"
                                    size="sm"
                                    disabled={bulkPending}
                                    title={`Tolak ${selected.size} pesanan?`}
                                    message="Pesanan yang dipilih akan dibatalkan dan pelanggan akan nampak status Dibatalkan. Tindakan ini tidak boleh diundur."
                                    confirmLabel="Ya, tolak"
                                    onConfirm={() => runBulk('reject')}
                                />
                                {isAdmin && (
                                    <ConfirmButton
                                        label="Padam"
                                        size="sm"
                                        disabled={bulkPending}
                                        title={`Padam ${selected.size} pesanan?`}
                                        message="Pesanan yang dipilih akan dipadam selama-lamanya bersama semua itemnya. Tindakan ini tidak boleh diundur."
                                        confirmLabel="Ya, padam"
                                        onConfirm={() => runBulk('delete')}
                                    />
                                )}
                                <Button variant="quiet" size="sm" disabled={bulkPending} onClick={() => setSelected(new Set())}>
                                    Nyahpilih
                                </Button>
                            </div>
                        )}
                    </div>
                    <ul className="divide-y divide-rule border-y border-rule bg-panel">
                        {orders.data.map((order) => (
                            <OrderQueueRow key={order.id} order={order} now={now} selected={selected.has(order.id)} onToggleSelect={toggleSelect} />
                        ))}
                    </ul>
                </>
            )}

            <Pagination page={orders} />
        </AdminLayout>
    );
}
