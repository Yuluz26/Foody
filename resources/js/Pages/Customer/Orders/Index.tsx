import { Link } from '@inertiajs/react';
import { ArrowLeftIcon, ReceiptIcon } from '@phosphor-icons/react';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { Pagination } from '@/components/Pagination';
import { DigitDisplay } from '@/components/DigitDisplay';
import { cn, formatDateTime, formatPrice } from '@/lib/format';
import type { CustomerOrder, Paginated } from '@/types';

const STATUS_TONE: Record<CustomerOrder['status'], string> = {
    pending: 'bg-amber text-ink',
    confirmed: 'bg-amber-tint text-ink ring-1 ring-ink/20 ring-inset',
    preparing: 'bg-ink text-white',
    ready: 'bg-leaf text-white',
    completed: 'bg-rule/70 text-ink-soft',
    cancelled: 'bg-alert-tint text-alert ring-1 ring-alert/30 ring-inset',
};

export default function OrdersIndex({ orders }: { orders: Paginated<CustomerOrder> }) {
    return (
        <CustomerLayout title="Pesanan saya">
            <header className="border-b-2 border-rule bg-ground">
                <div className="mx-auto max-w-3xl px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6 sm:px-10">
                    <Link href="/" className="-ml-2 inline-flex h-11 items-center gap-2 rounded-(--radius-control) px-2 font-semibold text-ink hover:bg-rule/70">
                        <ArrowLeftIcon size={20} weight="bold" aria-hidden />
                        Menu
                    </Link>
                    <h1 className="mt-4 text-4xl font-extrabold text-ink">Pesanan saya</h1>
                </div>
            </header>

            <main id="kandungan" className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
                {orders.data.length === 0 ? (
                    <div className="flex flex-col items-start gap-4 rounded-(--radius-panel) border-2 border-dashed border-rule-strong px-6 py-14 text-center sm:items-center">
                        <ReceiptIcon size={36} weight="bold" className="text-rule-strong" aria-hidden />
                        <p className="text-2xl font-extrabold text-ink">Belum ada pesanan</p>
                        <p className="max-w-[34ch] text-base text-ink-soft">Pesanan yang anda buat akan muncul di sini.</p>
                        <Link
                            href="/"
                            className="mt-2 inline-flex h-12 items-center gap-2 rounded-(--radius-control) bg-ink px-5 font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-ink-soft active:scale-[0.97]"
                        >
                            Lihat menu
                        </Link>
                    </div>
                ) : (
                    <ul className="divide-y divide-rule border-y border-rule">
                        {orders.data.map((order) => (
                            <li key={order.publicId}>
                                <Link href={`/pesanan/${order.publicId}`} className="flex items-center justify-between gap-4 py-4 transition-colors duration-150 hover:bg-amber-tint/40">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                            <DigitDisplay value={order.number} size="sm" />
                                            <span className={cn('inline-flex h-6 items-center rounded-(--radius-module) px-2 text-xs font-bold tracking-wide uppercase', STATUS_TONE[order.status])}>
                                                {order.statusLabel}
                                            </span>
                                        </div>
                                        <p className="mt-1.5 truncate text-[15px] text-ink-soft">
                                            {order.typeLabel}
                                            {order.tableNumber ? `, meja ${order.tableNumber}` : ''} &middot; {formatDateTime(order.createdAt)} &middot; {order.paymentMethodLabel}
                                        </p>
                                    </div>
                                    <p className="shrink-0 font-mono text-lg font-semibold text-ink tabular-nums">{formatPrice(order.total)}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                <Pagination page={orders} />
            </main>
        </CustomerLayout>
    );
}
