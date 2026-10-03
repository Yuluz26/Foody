import { Link, usePoll } from '@inertiajs/react';
import { ArrowRightIcon, CoffeeIcon, PackageIcon, ReceiptIcon } from '@phosphor-icons/react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { KpiGrid } from '@/components/admin/KpiGrid';
import { OrderPipelineBar } from '@/components/admin/OrderPipelineBar';
import { OrderQueueRow, useMinuteTick } from '@/components/admin/OrderQueue';
import { OrderVolumeChart } from '@/components/admin/OrderVolumeChart';
import { StockBadge } from '@/components/admin/StockBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { DigitDisplay } from '@/components/DigitDisplay';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice, formatWaiting, priceDigits } from '@/lib/format';
import type { AdminOrderRow, HourlyPoint, StockState } from '@/types';

type DashboardProps = {
    stats: {
        orders: number;
        revenue: number;
        pending: number;
        preparing: number;
        ready: number;
        completed: number;
        averageOrder: number | null;
    };
    hourly: HourlyPoint[];
    lowStock: { id: number; name: string; stockQuantity: number; stockState: StockState }[];
    activeOrders: AdminOrderRow[];
    recentOrders: AdminOrderRow[];
};

export default function Dashboard({ stats, hourly, lowStock, activeOrders, recentOrders }: DashboardProps) {
    usePoll(15_000, { only: ['stats', 'hourly', 'lowStock', 'activeOrders', 'recentOrders', 'adminCounts'] });
    const now = useMinuteTick();

    const today = new Intl.DateTimeFormat('ms-MY', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);

    const figures = [
        { label: 'Pesanan hari ini', value: String(stats.orders) },
        { label: 'Jualan hari ini', value: priceDigits(stats.revenue) },
        { label: 'Baru', value: String(stats.pending), highlight: stats.pending > 0 },
        { label: 'Di dapur', value: String(stats.preparing) },
        { label: 'Siap diambil', value: String(stats.ready) },
        { label: stats.averageOrder !== null ? 'Purata pesanan' : 'Selesai', value: stats.averageOrder !== null ? priceDigits(stats.averageOrder) : String(stats.completed) },
    ];

    return (
        <AdminLayout title="Ringkasan hari ini">
            <p className="-mt-3 text-[15px] text-ink-muted capitalize">{today}</p>

            <div className="mt-6">
                <KpiGrid figures={figures} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <OrderVolumeChart hourly={hourly} />
                <OrderPipelineBar stats={stats} />
            </div>

            {lowStock.length > 0 && (
                <section aria-labelledby="stok-tajuk" className="neu-card mt-6 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 id="stok-tajuk" className="flex items-center gap-2 text-lg font-bold text-ink">
                            <PackageIcon size={22} weight="bold" className="text-amber-deep" aria-hidden />
                            Stok perlu ditambah
                        </h2>
                        <Link href="/admin/stock" className={buttonClass({ variant: 'quiet', size: 'sm' })}>
                            Buka stok
                            <ArrowRightIcon size={16} weight="bold" aria-hidden />
                        </Link>
                    </div>
                    <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-2.5 sm:grid-cols-2">
                        {lowStock.map((product) => (
                            <li key={product.id} className="neu-well-sm flex items-center justify-between gap-3 px-4 py-3">
                                <span className="min-w-0 truncate font-semibold text-ink">{product.name}</span>
                                <span className="flex shrink-0 items-center gap-2.5">
                                    <span className="font-mono text-lg font-semibold text-ink tabular-nums">{product.stockQuantity}</span>
                                    <StockBadge state={product.stockState} />
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section aria-labelledby="tindakan-tajuk" className="mt-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <h2 id="tindakan-tajuk" className="section-title font-heading text-2xl font-extrabold text-ink">
                        Perlu tindakan
                        <span className="ml-3 font-mono text-lg text-ink-muted tabular-nums">{activeOrders.length}</span>
                    </h2>
                    <Link href="/admin/orders" className={buttonClass({ variant: 'quiet', size: 'sm' })}>
                        Semua pesanan aktif
                        <ArrowRightIcon size={16} weight="bold" aria-hidden />
                    </Link>
                </div>
                {activeOrders.length === 0 ? (
                    <EmptyState
                        Icon={CoffeeIcon}
                        className="mt-6"
                        title="Tiada pesanan menunggu"
                        description="Pesanan baru akan muncul di sini sendiri. Halaman ini dikemas kini setiap 15 saat."
                    />
                ) : (
                    <ul className="mt-6 grid gap-3">
                        {activeOrders.map((order) => (
                            <OrderQueueRow key={order.id} order={order} now={now} />
                        ))}
                    </ul>
                )}
            </section>

            <section aria-labelledby="terkini-tajuk" className="mt-12">
                <h2 id="terkini-tajuk" className="section-title font-heading text-2xl font-extrabold text-ink">
                    Pesanan terkini
                </h2>
                {recentOrders.length === 0 ? (
                    <EmptyState Icon={ReceiptIcon} className="mt-6" title="Belum ada pesanan" description="Kongsi pautan menu atau kod QR meja untuk mula menerima pesanan." />
                ) : (
                    <>
                    <ul className="mt-6 grid gap-3 sm:hidden">
                        {recentOrders.map((order) => (
                            <li key={order.id} className="neu-tile flex items-center justify-between gap-3 px-4 py-3 [--neu-radius:var(--radius-panel)]">
                                <div className="min-w-0">
                                    <Link href={`/admin/orders/${order.id}`} className="group inline-block">
                                        <DigitDisplay
                                            value={order.number}
                                            chip={false}
                                            size="md"
                                            className="transition-[color,text-shadow] duration-150 group-hover:text-amber group-hover:[text-shadow:0_0_2px_currentColor]"
                                        />
                                    </Link>
                                    <p className="truncate text-sm text-ink-soft">
                                        {order.customerName}, <span className="tabular">{formatPrice(order.total)}</span>
                                    </p>
                                </div>
                                <StatusBadge status={order.status} />
                            </li>
                        ))}
                    </ul>
                    <div className="neu-card mt-6 hidden p-3 sm:block">
                      <div className="overflow-x-auto">
                        <table className="data-table w-full min-w-[640px] text-left text-[15px]">
                            <thead>
                                <tr className="text-sm text-ink-muted">
                                    <th scope="col" className="py-3 pr-4 font-semibold">No.</th>
                                    <th scope="col" className="py-3 pr-4 font-semibold">Pelanggan</th>
                                    <th scope="col" className="py-3 pr-4 font-semibold">Jenis</th>
                                    <th scope="col" className="py-3 pr-4 text-right font-semibold">Jumlah</th>
                                    <th scope="col" className="py-3 pr-4 font-semibold">Status</th>
                                    <th scope="col" className="py-3 font-semibold">Masa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((order) => (
                                    <tr key={order.id}>
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
                                        <td className="py-3 pr-4 font-medium">{order.customerName}</td>
                                        <td className="py-3 pr-4 text-ink-soft">
                                            {order.typeLabel}
                                            {order.tableNumber ? `, meja ${order.tableNumber}` : ''}
                                        </td>
                                        <td className="tabular py-3 pr-4 text-right font-semibold whitespace-nowrap">{formatPrice(order.total)}</td>
                                        <td className="py-3 pr-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="py-3 whitespace-nowrap text-ink-muted">{formatWaiting(order.createdAt, now)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                    </div>
                    </>
                )}
            </section>
        </AdminLayout>
    );
}
