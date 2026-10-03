import { Link } from '@inertiajs/react';
import { ArrowLeftIcon, ReceiptIcon } from '@phosphor-icons/react';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { DigitDisplay } from '@/components/DigitDisplay';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { buttonClass } from '@/components/ui/Button';
import { formatDateTime, formatPrice } from '@/lib/format';
import type { CustomerOrder, Paginated } from '@/types';

export default function OrdersIndex({ orders }: { orders: Paginated<CustomerOrder> }) {
    return (
        <CustomerLayout title="Pesanan saya">
            <header>
                <div className="mx-auto max-w-3xl px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 sm:px-10">
                    <Link href="/" className={buttonClass({ variant: 'soft', size: 'sm' })}>
                        <ArrowLeftIcon size={18} weight="bold" aria-hidden />
                        Menu
                    </Link>
                    <h1 className="mt-5 text-4xl font-extrabold text-ink">Pesanan saya</h1>
                </div>
            </header>

            <main id="kandungan" className="mx-auto max-w-3xl px-6 py-8 sm:px-10">
                {orders.data.length === 0 ? (
                    <div className="neu-well flex flex-col items-center gap-4 px-6 py-14 text-center">
                        <span className="neu-well-sm grid size-16 place-items-center [--neu-radius:9999px]">
                            <ReceiptIcon size={30} weight="bold" className="text-ink-muted" aria-hidden />
                        </span>
                        <p className="text-2xl font-extrabold text-ink">Belum ada pesanan</p>
                        <p className="max-w-[34ch] text-base text-ink-soft">Pesanan yang anda buat akan muncul di sini.</p>
                        <Link href="/" className={buttonClass({ variant: 'ink', className: 'mt-2' })}>
                            Lihat menu
                        </Link>
                    </div>
                ) : (
                    <ul className="grid gap-4">
                        {orders.data.map((order) => (
                            <li key={order.publicId} className="min-w-0">
                                <Link href={`/pesanan/${order.publicId}`} className="neu-press flex items-center justify-between gap-4 p-4 [--neu-radius:var(--radius-panel)] sm:p-5">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                            <DigitDisplay value={order.number} size="sm" />
                                            <StatusBadge status={order.status} label={order.statusLabel} />
                                        </div>
                                        <p className="mt-2 truncate text-[15px] text-ink-soft">
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
