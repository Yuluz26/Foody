import { Link, usePoll } from '@inertiajs/react';
import { ArrowRightIcon, CoffeeIcon } from '@phosphor-icons/react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { OrderPipelineBar } from '@/components/admin/OrderPipelineBar';
import { OrderQueueRow, useMinuteTick } from '@/components/admin/OrderQueue';
import { OrderVolumeChart } from '@/components/admin/OrderVolumeChart';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DigitDisplay } from '@/components/DigitDisplay';
import { cn, formatPrice, formatWaiting, priceDigits } from '@/lib/format';
import type { AdminOrderRow, HourlyPoint } from '@/types';

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
    activeOrders: AdminOrderRow[];
    recentOrders: AdminOrderRow[];
};

export default function Dashboard({ stats, hourly, activeOrders, recentOrders }: DashboardProps) {
    usePoll(15_000, { only: ['stats', 'hourly', 'activeOrders', 'recentOrders', 'adminCounts'] });
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

            {/* Every reading here is a KPI on the operator console: a real digit readout, not a stat label. */}
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-(--radius-panel) border-2 border-rule-strong bg-rule sm:grid-cols-3 xl:grid-cols-6">
                {figures.map((figure) => (
                    <div key={figure.label} className={cn('px-4 py-4', figure.highlight ? 'bg-amber-tint' : 'bg-panel')}>
                        <dt className="text-sm font-medium text-ink-muted">{figure.label}</dt>
                        <dd className="mt-1.5">
                            <DigitDisplay value={figure.value} tone={figure.highlight ? 'amber' : 'ink'} chip={false} size="lg" />
                        </dd>
                    </div>
                ))}
            </dl>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <OrderVolumeChart hourly={hourly} />
                <OrderPipelineBar stats={stats} />
            </div>

            <section aria-labelledby="tindakan-tajuk" className="mt-10">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-amber pb-2">
                    <h2 id="tindakan-tajuk" className="font-heading flex items-baseline gap-3 text-2xl font-extrabold text-ink">
                        Perlu tindakan
                        <span className="font-mono text-lg text-ink-muted tabular-nums">{activeOrders.length}</span>
                    </h2>
                    <Link href="/admin/orders" className="group flex items-center gap-1.5 pb-1 text-[15px] font-semibold text-ink hover:underline">
                        Semua pesanan aktif
                        <ArrowRightIcon size={16} weight="bold" aria-hidden className="transition-transform duration-150 ease-out group-hover:translate-x-1" />
                    </Link>
                </div>
                {activeOrders.length === 0 ? (
                    <div className="flex items-center gap-4 border-b border-rule px-2 py-8">
                        <CoffeeIcon size={36} weight="bold" className="shrink-0 text-rule-strong" aria-hidden />
                        <div>
                            <p className="text-lg font-semibold">Tiada pesanan menunggu</p>
                            <p className="text-[15px] text-ink-muted">Pesanan baru akan muncul di sini sendiri. Halaman ini dikemas kini setiap 15 saat.</p>
                        </div>
                    </div>
                ) : (
                    <ul className="divide-y divide-rule border-b border-rule bg-panel">
                        {activeOrders.map((order) => (
                            <OrderQueueRow key={order.id} order={order} now={now} />
                        ))}
                    </ul>
                )}
            </section>

            <section aria-labelledby="terkini-tajuk" className="mt-12">
                <h2 id="terkini-tajuk" className="font-heading border-b-2 border-amber pb-2 text-2xl font-extrabold text-ink">
                    Pesanan terkini
                </h2>
                {recentOrders.length === 0 ? (
                    <p className="py-8 text-[15px] text-ink-muted">Belum ada pesanan. Kongsi pautan menu atau kod QR meja untuk mula menerima pesanan.</p>
                ) : (
                    <>
                    <ul className="divide-y divide-rule sm:hidden">
                        {recentOrders.map((order) => (
                            <li key={order.id} className="flex items-center justify-between gap-3 py-3">
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
                    <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full min-w-[640px] text-left text-[15px]">
                            <thead>
                                <tr className="border-b-2 border-rule-strong text-sm text-ink-muted">
                                    <th scope="col" className="py-3 pr-4 font-semibold">No.</th>
                                    <th scope="col" className="py-3 pr-4 font-semibold">Pelanggan</th>
                                    <th scope="col" className="py-3 pr-4 font-semibold">Jenis</th>
                                    <th scope="col" className="py-3 pr-4 text-right font-semibold">Jumlah</th>
                                    <th scope="col" className="py-3 pr-4 font-semibold">Status</th>
                                    <th scope="col" className="py-3 font-semibold">Masa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-rule">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="transition-colors duration-150 hover:bg-amber-tint/50">
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
                                        <td className="tabular py-3 pr-4 text-right font-semibold">{formatPrice(order.total)}</td>
                                        <td className="py-3 pr-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="py-3 whitespace-nowrap text-ink-muted">{formatWaiting(order.createdAt, now)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    </>
                )}
            </section>
        </AdminLayout>
    );
}
