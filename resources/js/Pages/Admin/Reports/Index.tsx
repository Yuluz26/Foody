import { Link, router, usePage } from '@inertiajs/react';
import { PrinterIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmButton } from '@/components/ConfirmButton';
import { CompletedOrdersChart, TrendSummary, type TrendPoint } from '@/components/admin/CompletedOrdersChart';
import { EmptyOrdersState, OrderFilterBar, SelectionToolbar } from '@/components/admin/OrderListControls';
import { ADMIN_STATUS, StatusBadge } from '@/components/admin/StatusBadge';
import { PaymentBadge } from '@/components/admin/PaymentBadge';
import { useFilters } from '@/components/admin/useFilters';
import { useRowSelection } from '@/components/admin/useRowSelection';
import { DigitDisplay } from '@/components/DigitDisplay';
import { Pagination } from '@/components/Pagination';
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
        <li className={cn('grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 px-4 py-4 transition-colors duration-150', selected ? 'bg-amber-tint' : 'hover:bg-ground')}>
            <label className="flex h-11 items-center">
                <span className="sr-only">Pilih pesanan {order.number}</span>
                <input type="checkbox" checked={selected} onChange={() => onToggleSelect(order.id)} className="size-5 shrink-0 rounded-sm border-2 border-rule-strong accent-ink" />
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
                <a
                    href={`/admin/orders/${order.id}/receipt`}
                    className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-(--radius-control) px-2.5 text-sm font-semibold text-ink-soft hover:bg-rule/60 hover:text-ink"
                >
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
        ...statusOptions.filter((option) => option.value !== 'completed').map((option) => ({ value: option.value, label: ADMIN_STATUS[option.value].label })),
    ];

    const filtered = filters.q !== '' || filters.type !== '' || filters.date_from !== '' || filters.date_to !== '' || filters.status !== 'completed';

    return (
        <AdminLayout title="Laporan">
            <div className="grid gap-4 sm:flex sm:items-center sm:justify-between">
                <p className="text-[15px] text-ink-muted">Prestasi pesanan selesai, mengikut tempoh.</p>
                <div role="tablist" aria-label="Tempoh carta" className="flex gap-0.5 self-start rounded-(--radius-control) border-2 border-rule-strong bg-ground p-0.5">
                    {PERIODS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            role="tab"
                            aria-selected={filters.period === option.value}
                            onClick={() => set('period', option.value)}
                            className={cn(
                                'h-9 rounded-(--radius-module) px-3 text-sm font-semibold transition-colors duration-150',
                                filters.period === option.value ? 'bg-amber text-ink' : 'text-ink-soft hover:text-ink',
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-4 grid gap-6">
                <TrendSummary trend={trend} />
                <CompletedOrdersChart trend={trend} />
            </div>

            <div className="mt-10 border-t-2 border-rule pt-8">
                <h2 className="font-heading text-2xl font-extrabold text-ink">Sejarah pesanan</h2>

                <div role="tablist" aria-label="Tapis status" className="no-scrollbar -mx-4 mt-4 flex gap-1 overflow-x-auto border-b-2 border-rule px-4 sm:mx-0 sm:px-0">
                    {tabs.map((tab) => {
                        const isSelected = filters.status === tab.value;

                        return (
                            <button
                                key={tab.value}
                                type="button"
                                role="tab"
                                aria-selected={isSelected}
                                onClick={() => set('status', tab.value)}
                                className={cn(
                                    'relative h-12 shrink-0 px-3 font-semibold whitespace-nowrap transition-colors duration-150',
                                    isSelected ? 'text-ink after:absolute after:inset-x-2 after:-bottom-0.5 after:h-1 after:rounded-full after:bg-amber' : 'text-ink-soft hover:text-ink',
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
                        title="Tiada pesanan sepadan"
                        description="Cuba kosongkan carian atau pilih tapisan lain."
                        showReset={filtered}
                        onReset={() => reset(EMPTY)}
                    />
                ) : (
                    <>
                        <SelectionToolbar count={selected.size} allSelected={allSelected} bulkPending={bulkPending} onToggleAll={toggleSelectAll} onClear={clear}>
                            <a
                                href={bulkReceiptsHref}
                                target="_blank"
                                rel="noopener"
                                className="inline-flex h-10 touch-manipulation items-center justify-center gap-2 rounded-(--radius-control) border-2 border-ink px-3 text-sm font-semibold text-ink transition-[transform,background-color,color,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:bg-ink hover:text-white hover:shadow-(--shadow-lift) active:translate-y-0 active:scale-[0.97]"
                            >
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

                        <ul className="divide-y divide-rule border-y border-rule bg-panel sm:hidden">
                            {orders.data.map((order) => (
                                <ReportOrderRow key={order.id} order={order} selected={selected.has(order.id)} onToggleSelect={toggleSelect} />
                            ))}
                        </ul>

                        <div className="hidden overflow-x-auto border-y border-rule sm:block">
                            <table className="w-full min-w-[760px] text-left text-[15px]">
                                <thead className="bg-ground">
                                    <tr className="border-b-2 border-rule-strong text-sm text-ink-muted">
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
                                <tbody className="divide-y divide-rule bg-panel">
                                    {orders.data.map((order) => (
                                        <tr key={order.id} className={cn('transition-colors duration-150 hover:bg-amber-tint/40', selected.has(order.id) && 'bg-amber-tint/60')}>
                                            <td className="py-3 pl-4">
                                                <label>
                                                    <span className="sr-only">Pilih pesanan {order.number}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={selected.has(order.id)}
                                                        onChange={() => toggleSelect(order.id)}
                                                        className="size-5 rounded-sm border-2 border-rule-strong accent-ink"
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
                                            <td className="tabular py-3 pr-4 text-right font-semibold">{formatPrice(order.total)}</td>
                                            <td className="py-3 pr-4">
                                                <PaymentBadge status={order.paymentStatus} />
                                            </td>
                                            <td className="py-3 pr-4">
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td className="py-3 pr-4 text-right">
                                                <a
                                                    href={`/admin/orders/${order.id}/receipt`}
                                                    className="inline-flex h-9 items-center gap-1.5 rounded-(--radius-control) px-2.5 text-sm font-semibold text-ink-soft hover:bg-rule/60 hover:text-ink"
                                                >
                                                    <PrinterIcon size={16} weight="bold" aria-hidden />
                                                    Resit
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                <Pagination page={orders} />
            </div>
        </AdminLayout>
    );
}
