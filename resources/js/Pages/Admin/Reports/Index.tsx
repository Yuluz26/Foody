import { Link, router, usePage } from '@inertiajs/react';
import { PrinterIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmButton } from '@/components/ConfirmButton';
import { CompletedOrdersChart, TrendSummary, type TrendPoint } from '@/components/admin/CompletedOrdersChart';
import { EmptyOrdersState, OrderFilterBar, SelectionToolbar } from '@/components/admin/OrderListControls';
import { ORDER_STATUS, StatusBadge } from '@/components/StatusBadge';
import { PaymentBadge } from '@/components/PaymentBadge';
import { useFilters } from '@/components/admin/useFilters';
import { useRowSelection } from '@/components/admin/useRowSelection';
import { DigitDisplay } from '@/components/DigitDisplay';
import { Pagination } from '@/components/Pagination';
import { buttonClass } from '@/components/ui/Button';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { cn, formatDateTime, formatPrice } from '@/lib/format';
import type { AdminOrderRow, Paginated, StatusOption } from '@/types';

type Filters = { q: string; status: string; type: string; date_from: string; date_to: string; period: string };

type ReportsIndexProps = {
    orders: Paginated<AdminOrderRow>;
    filters: Filters;
    statusOptions: StatusOption[];
    trend: TrendPoint[];
};

const EMPTY: Filters = { q: '', status: 'completed', type: '', date_from: '', date_to: '', period: 'day' };

const PERIODS = [
    { value: 'day', label: 'Hari' },
    { value: 'week', label: 'Minggu' },
    { value: 'month', label: 'Bulan' },
    { value: 'year', label: 'Tahun' },
];

function ReportOrderRow({ order, selected, onToggleSelect }: { order: AdminOrderRow; selected: boolean; onToggleSelect: (id: number) => void }) {
    return (
        <li className={cn('neu-tile grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 px-4 py-4 [--neu-radius:var(--radius-panel)]', selected && 'shadow-(--shadow-inset-sm)')}>
            <label className="flex h-11 items-center">
                <span className="sr-only">Pilih pesanan {order.number}</span>
                <input type="checkbox" checked={selected} onChange={() => onToggleSelect(order.id)} />
            </label>
            <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/admin/orders/${order.id}`} className="group inline-block">
                        <DigitDisplay value={order.number} chip={false} size="md" className="transition-[color,text-shadow] duration-150 group-hover:text-amber group-hover:[text-shadow:0_0_2px_currentColor]" />
                    </Link>
                    <StatusBadge status={order.status} />
                </div>
                <p className="mt-1 truncate font-semibold">{order.customerName}</p>
                <p className="text-[15px] text-ink-soft">
                    {order.typeLabel}
                    {order.tableNumber && `, meja ${order.tableNumber}`}. {formatDateTime(order.createdAt)}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                    <PaymentBadge status={order.paymentStatus} />
                    <span className="tabular font-semibold">{formatPrice(order.total)}</span>
                </div>
                <a href={`/admin/orders/${order.id}/receipt`} className={buttonClass({ variant: 'quiet', size: 'sm', className: 'mt-2 -ml-3' })}>
                    <PrinterIcon size={16} weight="bold" aria-hidden />
                    Cetak resit
                </a>
            </div>
        </li>
    );
}

export default function ReportsIndex({ orders, filters: initial, statusOptions, trend }: ReportsIndexProps) {
    const { filters, set, reset } = useFilters('/admin/reports', initial);
    const isAdmin = usePage().props.auth.user?.role === 'admin';

    const [bulkPending, setBulkPending] = useState(false);
    const { selected, toggleSelect, allSelected, toggleSelectAll, clear } = useRowSelection(orders.data);

    const bulkDelete = () => {
        setBulkPending(true);
        router.post(
            '/admin/orders/bulk',
            { ids: [...selected], action: 'delete' },
            { preserveScroll: true, onSuccess: clear, onFinish: () => setBulkPending(false) },
        );
    };

    const bulkReceiptsHref = `/admin/orders/receipts?${[...selected].map((id) => `ids[]=${id}`).join('&')}`;

    const tabs = [
        { value: 'completed', label: 'Selesai' },
        { value: 'all', label: 'Semua' },
        ...statusOptions.filter((option) => option.value !== 'completed').map((option) => ({ value: option.value, label: ORDER_STATUS[option.value].label })),
    ];

    const filtered = filters.q !== '' || filters.type !== '' || filters.date_from !== '' || filters.date_to !== '' || filters.status !== 'completed';

    return (
        <AdminLayout title="Laporan">
            <div className="grid gap-4 sm:flex sm:items-center sm:justify-between">
                <p className="text-[15px] text-ink-muted">Prestasi pesanan selesai, mengikut tempoh.</p>
                <SegmentedTabs label="Tempoh carta" tabs={PERIODS} value={filters.period} onChange={(period) => set('period', period)} className="self-start" />
            </div>

            <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-6">
                <TrendSummary trend={trend} />
                <CompletedOrdersChart trend={trend} />
            </div>

            <div className="mt-12">
                <h2 className="section-title font-heading text-2xl font-extrabold text-ink">Sejarah pesanan</h2>

                <SegmentedTabs label="Tapis status" tabs={tabs} value={filters.status} onChange={(status) => set('status', status)} className="mt-6" />

                <OrderFilterBar filters={filters} onChange={set} />

                {orders.data.length === 0 ? (
                    <EmptyOrdersState
                        title="Tiada pesanan sepadan"
                        description="Cuba kosongkan carian atau pilih tapisan lain."
                        showReset={filtered}
                        onReset={() => reset(EMPTY)}
                    />
                ) : (
                    <>
                        <SelectionToolbar count={selected.size} allSelected={allSelected} bulkPending={bulkPending} onToggleAll={toggleSelectAll} onClear={clear}>
                            <a href={bulkReceiptsHref} target="_blank" rel="noopener" className={buttonClass({ variant: 'soft', size: 'sm' })}>
                                <PrinterIcon size={16} weight="bold" aria-hidden />
                                Cetak resit
                            </a>
                            {isAdmin && (
                                <ConfirmButton
                                    label="Padam"
                                    size="sm"
                                    disabled={bulkPending}
                                    title={`Padam ${selected.size} pesanan?`}
                                    message="Pesanan yang dipilih akan dipadam selama-lamanya bersama semua itemnya. Tindakan ini tidak boleh diundur."
                                    confirmLabel="Ya, padam"
                                    onConfirm={bulkDelete}
                                />
                            )}
                        </SelectionToolbar>

                        <ul className="mt-4 grid gap-3 sm:hidden">
                            {orders.data.map((order) => (
                                <ReportOrderRow key={order.id} order={order} selected={selected.has(order.id)} onToggleSelect={toggleSelect} />
                            ))}
                        </ul>

                        <div className="neu-card mt-4 hidden p-3 sm:block">
                          <div className="overflow-x-auto">
                            <table className="data-table w-full min-w-[760px] text-left text-[15px]">
                                <thead>
                                    <tr className="text-sm text-ink-muted">
                                        <th scope="col" className="w-12 py-3 pl-4">
                                            <span className="sr-only">Pilih</span>
                                        </th>
                                        <th scope="col" className="py-3 pr-4 font-semibold">
                                            No.
                                        </th>
                                        <th scope="col" className="py-3 pr-4 font-semibold">
                                            Pelanggan
                                        </th>
                                        <th scope="col" className="py-3 pr-4 font-semibold">
                                            Tarikh
                                        </th>
                                        <th scope="col" className="py-3 pr-4 text-right font-semibold">
                                            Jumlah
                                        </th>
                                        <th scope="col" className="py-3 pr-4 font-semibold">
                                            Bayaran
                                        </th>
                                        <th scope="col" className="py-3 pr-4 font-semibold">
                                            Status
                                        </th>
                                        <th scope="col" className="py-3 pr-4">
                                            <span className="sr-only">Tindakan</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.data.map((order) => (
                                        <tr key={order.id} className={cn(selected.has(order.id) && '[&>*]:bg-amber-tint/60')}>
                                            <td className="py-3 pl-4">
                                                <label>
                                                    <span className="sr-only">Pilih pesanan {order.number}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={selected.has(order.id)}
                                                        onChange={() => toggleSelect(order.id)}
                                                    />
                                                </label>
                                            </td>
                                            <td className="py-3 pr-4">
                                                <Link href={`/admin/orders/${order.id}`} className="group inline-block">
                                                    <DigitDisplay
                                                        value={order.number}
                                                        chip={false}
                                                        size="md"
                                                        className="transition-[color,text-shadow] duration-150 group-hover:text-amber group-hover:[text-shadow:0_0_2px_currentColor]"
                                                    />
                                                </Link>
                                            </td>
                                            <td className="py-3 pr-4">
                                                <p className="font-semibold">{order.customerName}</p>
                                                <p className="text-sm text-ink-soft">
                                                    {order.typeLabel}
                                                    {order.tableNumber ? `, meja ${order.tableNumber}` : ''}
                                                </p>
                                            </td>
                                            <td className="py-3 pr-4 text-ink-muted whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                                            <td className="tabular py-3 pr-4 text-right font-semibold whitespace-nowrap">{formatPrice(order.total)}</td>
                                            <td className="py-3 pr-4">
                                                <PaymentBadge status={order.paymentStatus} />
                                            </td>
                                            <td className="py-3 pr-4">
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td className="py-3 pr-4 text-right">
                                                <a href={`/admin/orders/${order.id}/receipt`} className={buttonClass({ variant: 'quiet', size: 'sm' })}>
                                                    <PrinterIcon size={16} weight="bold" aria-hidden />
                                                    Resit
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                          </div>
                        </div>
                    </>
                )}

                <Pagination page={orders} />
            </div>
        </AdminLayout>
    );
}
