import { Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { DigitDisplay } from '@/components/DigitDisplay';
import { Button } from '@/components/ui/Button';
import { cn, formatPrice, formatWaiting } from '@/lib/format';
import type { AdminOrderRow, OrderStatus } from '@/types';
import { ConfirmButton } from '@/components/ConfirmButton';
import { ORDER_STATUS, StatusBadge } from '@/components/StatusBadge';

/** Re-render once a minute so waiting times stay honest without refetching. */
export function useMinuteTick(): number {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 60_000);

        return () => window.clearInterval(timer);
    }, []);

    return now;
}

export function useStatusUpdate(orderId: number) {
    const [pending, setPending] = useState<OrderStatus | null>(null);

    const update = (status: OrderStatus) =>
        router.patch(
            `/admin/orders/${orderId}/status`,
            { status },
            {
                preserveScroll: true,
                onStart: () => setPending(status),
                onFinish: () => setPending(null),
            },
        );

    return { pending, update };
}

export function OrderActions({ order, size = 'sm' }: { order: AdminOrderRow; size?: 'sm' | 'md' }) {
    const { pending, update } = useStatusUpdate(order.id);
    const next = order.nextStatuses.find((option) => option.value !== 'cancelled');
    const canCancel = order.nextStatuses.some((option) => option.value === 'cancelled');

    return (
        <div className="flex flex-wrap items-center gap-2">
            {next && (
                <Button size={size} variant={next.value === 'ready' ? 'leaf' : next.value === 'completed' ? 'ink' : 'amber'} loading={pending === next.value} disabled={pending !== null} onClick={() => update(next.value)}>
                    {pending === next.value ? 'Menyimpan...' : ORDER_STATUS[next.value].action}
                </Button>
            )}
            {canCancel && (
                <ConfirmButton
                    label="Batal"
                    size={size}
                    disabled={pending !== null}
                    title={`Batalkan ${order.number}?`}
                    message={`Pesanan ${order.customerName} akan dibatalkan dan pelanggan akan nampak status Dibatalkan. Tindakan ini tidak boleh diundur.`}
                    confirmLabel="Ya, batalkan"
                    onConfirm={() => update('cancelled')}
                />
            )}
        </div>
    );
}

type OrderQueueRowProps = {
    order: AdminOrderRow;
    now: number;
    /** Bulk-selection checkbox, only wired up where a bulk toolbar exists (Orders/Index). */
    selected?: boolean;
    onToggleSelect?: (id: number) => void;
};

export function OrderQueueRow({ order, now, selected, onToggleSelect }: OrderQueueRowProps) {
    return (
        <li
            className={cn(
                'neu-tile relative grid gap-3 px-4 py-4 [--neu-radius:var(--radius-panel)] sm:items-center sm:px-5',
                onToggleSelect ? 'sm:grid-cols-[2.75rem_8rem_minmax(0,1fr)_auto]' : 'sm:grid-cols-[8rem_minmax(0,1fr)_auto]',
                order.status === 'pending' && '[--neu-bg:var(--color-amber-tint)]',
                selected && 'shadow-(--shadow-inset-sm)',
            )}
        >
            {onToggleSelect && (
                <label className="absolute top-2 right-2 grid size-11 place-items-center sm:static sm:size-auto sm:place-items-start">
                    <span className="sr-only">Pilih pesanan {order.number}</span>
                    <input
                        type="checkbox"
                        checked={selected ?? false}
                        onChange={() => onToggleSelect(order.id)}
                    />
                </label>
            )}
            <div className="flex items-baseline gap-3 sm:block">
                <Link href={`/admin/orders/${order.id}`} className="group inline-block transition-transform duration-150 ease-out hover:-translate-y-0.5">
                    {/* On hover the number "lights up" amber, the same glow the digit face wears when it's genuinely lit. */}
                    <DigitDisplay
                        value={order.number}
                        chip={false}
                        size="lg"
                        className="transition-[color,text-shadow] duration-150 group-hover:text-amber group-hover:[text-shadow:0_0_2px_currentColor]"
                    />
                </Link>
                <p className="text-sm text-ink-muted">
                    <span className="sr-only">Menunggu </span>
                    {formatWaiting(order.createdAt, now)}
                </p>
            </div>
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="truncate font-semibold">{order.customerName}</p>
                    <StatusBadge status={order.status} />
                    {order.source === 'pos' && <span className="rounded-(--radius-module) bg-ground-deep px-2 py-1 text-[11px] font-bold tracking-wide text-ink-soft uppercase shadow-(--shadow-inset-sm)">Kaunter</span>}
                </div>
                <p className="mt-1 text-[15px] text-ink-soft">
                    {order.typeLabel}
                    {order.tableNumber && <span className="font-semibold text-ink">, meja {order.tableNumber}</span>}. {order.itemsCount} item,{' '}
                    <span className="tabular font-semibold text-ink">{formatPrice(order.total)}</span>
                </p>
            </div>
            <OrderActions order={order} />
        </li>
    );
}
