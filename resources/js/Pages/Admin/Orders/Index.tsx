import { router, usePage, usePoll } from '@inertiajs/react';
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmButton } from '@/components/ConfirmButton';
import { EmptyOrdersState, OrderFilterBar, SelectionToolbar } from '@/components/admin/OrderListControls';
import { OrderQueueRow, useMinuteTick } from '@/components/admin/OrderQueue';
import { Pagination } from '@/components/Pagination';
import { ADMIN_STATUS } from '@/components/admin/StatusBadge';
import { useFilters } from '@/components/admin/useFilters';
import { useRowSelection } from '@/components/admin/useRowSelection';
import { cn } from '@/lib/format';
import type { AdminOrderRow, Paginated, StatusOption } from '@/types';

type Filters = { q: string; status: string; type: string; date_from: string; date_to: string };

type OrdersIndexProps = {
    orders: Paginated<AdminOrderRow>;
    filters: Filters;
    statusOptions: StatusOption[];
    activeCount: number;
};

const EMPTY: Filters = { q: '', status: 'active', type: '', date_from: '', date_to: '' };

export default function OrdersIndex({ orders, filters: initial, statusOptions, activeCount }: OrdersIndexProps) {
    const { filters, set, reset } = useFilters('/admin/orders', initial);
    const now = useMinuteTick();
    usePoll(15_000, { only: ['orders', 'activeCount', 'adminCounts'] });

    const [bulkPending, setBulkPending] = useState(false);
    const isAdmin = usePage().props.auth.user?.role === 'admin';
    const { selected, toggleSelect, allSelected, toggleSelectAll, clear } = useRowSelection(orders.data);

    const runBulk = (action: 'approve' | 'reject' | 'delete') => {
        setBulkPending(true);
        router.post(
            '/admin/orders/bulk',
            { ids: [...selected], action },
            {
                preserveScroll: true,
                onSuccess: clear,
                onFinish: () => setBulkPending(false),
            },
        );
    };

    const tabs = [
        { value: 'active', label: `Aktif (${activeCount})` },
        { value: 'all', label: 'Semua' },
        ...statusOptions.map((option) => ({ value: option.value, label: ADMIN_STATUS[option.value].label })),
    ];

    const filtered = filters.q !== '' || filters.type !== '' || filters.date_from !== '' || filters.date_to !== '' || filters.status !== 'active';

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

            <OrderFilterBar filters={filters} onChange={set} />

            {orders.data.length === 0 ? (
                <EmptyOrdersState
                    title={filtered ? 'Tiada pesanan sepadan dengan tapisan ini' : 'Tiada pesanan aktif'}
                    description={filtered ? 'Cuba kosongkan carian atau pilih status lain.' : 'Pesanan baru akan muncul di sini sendiri.'}
                    showReset={filtered}
                    onReset={() => reset(EMPTY)}
                />
            ) : (
                <>
                    <SelectionToolbar count={selected.size} allSelected={allSelected} bulkPending={bulkPending} onToggleAll={toggleSelectAll} onClear={clear}>
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
                    </SelectionToolbar>
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
