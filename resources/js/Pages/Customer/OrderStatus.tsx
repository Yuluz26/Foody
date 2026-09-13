import { Link, router, usePoll } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    BellRingingIcon,
    CheckIcon,
    CookingPotIcon,
    DownloadSimpleIcon,
    ForkKnifeIcon,
    PhoneIcon,
    ReceiptIcon,
    ThumbsUpIcon,
    XCircleIcon,
    type Icon,
} from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';
import { useCart } from '@/cart/CartProvider';
import { ConfirmButton } from '@/components/ConfirmButton';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { DigitDisplay } from '@/components/DigitDisplay';
import { cn, formatDateTime, formatPrice, priceDigits } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import type { CustomerOrder, OrderStatus as Status } from '@/types';

type OrderStatusProps = {
    order: CustomerOrder;
    restaurant: { name: string; phone: string | null };
    justPlaced: boolean;
};

const FLOW: Status[] = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];

const PAYMENT_TONE: Record<CustomerOrder['paymentStatus'], string> = {
    unpaid: 'bg-rule/70 text-ink-soft',
    pending_verification: 'bg-amber-tint text-ink ring-1 ring-ink/20 ring-inset',
    paid: 'bg-leaf text-white',
};

const STEPS: Record<Status, { label: string; Icon: Icon }> = {
    pending: { label: 'Pesanan diterima', Icon: ReceiptIcon },
    confirmed: { label: 'Disahkan', Icon: ThumbsUpIcon },
    preparing: { label: 'Sedang disediakan', Icon: CookingPotIcon },
    ready: { label: 'Siap', Icon: BellRingingIcon },
    completed: { label: 'Selesai', Icon: ForkKnifeIcon },
    cancelled: { label: 'Dibatalkan', Icon: XCircleIcon },
};

function helperText(order: CustomerOrder): string {
    switch (order.status) {
        case 'pending':
            return 'Kedai sedang menyemak pesanan anda.';
        case 'confirmed':
            return 'Pesanan disahkan dan masuk giliran dapur.';
        case 'preparing':
            return 'Dapur sedang menyediakan hidangan anda.';
        case 'ready':
            return order.type === 'dine_in' && order.tableNumber
                ? `Hidangan sedang dibawa ke meja ${order.tableNumber}.`
                : `Sila ambil di kaunter dan tunjukkan nombor ${order.number}.`;
        case 'completed':
            return 'Selamat menjamu selera. Terima kasih kerana memesan.';
        case 'cancelled':
            return 'Pesanan ini telah dibatalkan. Hubungi kedai jika anda perlukan bantuan.';
    }
}

export default function OrderStatus(props: OrderStatusProps) {
    return (
        <CustomerLayout title={`Pesanan ${props.order.number} | ${props.restaurant.name}`}>
            <StatusScreen {...props} />
        </CustomerLayout>
    );
}

function StatusScreen({ order, restaurant, justPlaced }: OrderStatusProps) {
    const cart = useCart();
    const reduce = useReducedMotion();
    const final = order.status === 'completed' || order.status === 'cancelled';
    const { stop } = usePoll(8000, { only: ['order'] }, { autoStart: !final });

    // The order is safely stored; empty the cart and forget this checkout attempt.
    useEffect(() => {
        if (justPlaced) {
            cart.clear();

            try {
                window.sessionStorage.removeItem('foody.checkout');
            } catch {
                // Nothing to clean up.
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [justPlaced]);

    useEffect(() => {
        if (final) {
            stop();
        }
    }, [final, stop]);

    const currentIndex = FLOW.indexOf(order.status);
    const firstName = order.customerName.split(' ')[0];
    const canCancel = order.status === 'pending' || order.status === 'confirmed';

    return (
        <>
            <header className="border-b-2 border-rule bg-ground">
                <div className="mx-auto max-w-3xl px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-9 sm:px-10">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <Link href="/" className="-ml-2 inline-flex h-11 items-center gap-2 rounded-(--radius-control) px-2 font-semibold text-ink hover:bg-rule/70">
                            <ArrowLeftIcon size={20} weight="bold" aria-hidden />
                            Menu {restaurant.name}
                        </Link>
                        <Link href="/pesanan-saya" className="inline-flex h-11 items-center rounded-(--radius-control) px-2 text-[15px] font-semibold text-ink-soft hover:bg-rule/70 hover:text-ink">
                            Pesanan saya
                        </Link>
                    </div>
                    <motion.div
                        className="mt-6"
                        initial={justPlaced && !reduce ? { opacity: 0, transform: 'translateY(12px)' } : false}
                        animate={{ opacity: 1, transform: 'translateY(0px)' }}
                        transition={{ duration: 0.45, ease: ease.out }}
                    >
                        <DigitDisplay value={order.number} size="xl" label={`Nombor pesanan ${order.number}`} />
                    </motion.div>
                    {justPlaced && (
                        <p className="mt-4 max-w-[36ch] text-lg leading-snug font-semibold text-ink">
                            Terima kasih, {firstName}. Pesanan anda sudah sampai ke dapur.
                        </p>
                    )}
                    <p className="mt-2 text-[15px] text-ink-muted">
                        {order.typeLabel}
                        {order.tableNumber ? `, meja ${order.tableNumber}` : ''}. Dibuat {formatDateTime(order.createdAt)}.
                    </p>
                </div>
            </header>

            <main id="kandungan" className="mx-auto grid max-w-3xl gap-12 px-6 pt-10 pb-16 sm:px-10">
                <section aria-labelledby="status-tajuk">
                    <h2 id="status-tajuk" className="text-3xl font-extrabold text-ink">
                        Status pesanan
                    </h2>
                    <p className="sr-only" aria-live="polite">
                        Status terkini: {STEPS[order.status].label}. {helperText(order)}
                    </p>

                    {order.status === 'cancelled' ? (
                        <div className="mt-5 flex gap-4 rounded-(--radius-panel) border-2 border-rule-strong bg-ground p-5">
                            <XCircleIcon size={32} weight="bold" className="shrink-0 text-alert" aria-hidden />
                            <div>
                                <p className="text-2xl font-extrabold text-ink">Dibatalkan</p>
                                <p className="mt-1 text-base text-ink-soft">{helperText(order)}</p>
                            </div>
                        </div>
                    ) : (
                        <ol className="mt-6">
                            {FLOW.map((status, index) => {
                                const state = order.status === 'completed' || index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo';
                                const { label, Icon: StepIcon } = STEPS[status];

                                return (
                                    <li key={status} className="relative flex gap-4 pb-7 last:pb-0" aria-current={state === 'current' ? 'step' : undefined}>
                                        {index < FLOW.length - 1 && (
                                            <span className={cn('absolute top-11 bottom-1 left-[21px] w-1 rounded-full', index < currentIndex || order.status === 'completed' ? 'bg-leaf' : 'bg-rule')} aria-hidden />
                                        )}
                                        <span className="relative grid size-11 shrink-0 place-items-center rounded-(--radius-module)">
                                            {state === 'done' && <span className="absolute inset-0 rounded-(--radius-module) bg-leaf" />}
                                            {state === 'todo' && <span className="absolute inset-0 rounded-(--radius-module) border-2 border-rule-strong bg-panel" />}
                                            {state === 'current' && (
                                                <>
                                                    <motion.span layoutId="status-marker" className="absolute inset-0 rounded-(--radius-module) bg-amber" transition={{ duration: duration.sheet, ease: ease.inOut }} />
                                                    {!reduce && !final && (
                                                        <motion.span
                                                            className="absolute inset-0 rounded-(--radius-module) border-2 border-amber"
                                                            animate={{ opacity: [0.7, 0], scale: [1, 1.45] }}
                                                            transition={{ duration: 1.8, repeat: Infinity, ease: ease.out }}
                                                            aria-hidden
                                                        />
                                                    )}
                                                </>
                                            )}
                                            {state === 'done' ? (
                                                <CheckIcon size={22} weight="bold" className="relative text-white" aria-hidden />
                                            ) : (
                                                <StepIcon size={22} weight="bold" className={cn('relative', state === 'current' ? 'text-ink' : 'text-ink-muted')} aria-hidden />
                                            )}
                                        </span>
                                        <div className="min-w-0 pt-2">
                                            <p className={cn('text-lg leading-tight font-semibold', state === 'todo' && 'text-ink-muted')}>
                                                {label}
                                                <span className="sr-only">{state === 'done' ? ', selesai' : state === 'current' ? ', sekarang' : ''}</span>
                                            </p>
                                            <AnimatePresence mode="wait" initial={false}>
                                                {state === 'current' && (
                                                    <motion.p
                                                        key={order.status}
                                                        className="mt-1 text-base text-ink-soft"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: duration.base, ease: ease.out }}
                                                    >
                                                        {helperText(order)}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    )}

                    {!final && <p className="mt-6 text-sm text-ink-muted">Status dikemas kini sendiri. Anda boleh simpan pautan halaman ini.</p>}
                </section>

                <section aria-labelledby="ringkasan-tajuk">
                    <h2 id="ringkasan-tajuk" className="border-b-2 border-amber pb-2 text-3xl font-extrabold text-ink">
                        Ringkasan
                    </h2>
                    <ul className="divide-y divide-rule">
                        {order.items.map((item) => (
                            <li key={item.id} className="py-3">
                                <div className="flex items-baseline gap-2">
                                    <span className="w-8 shrink-0 font-mono text-lg font-semibold text-ink-muted tabular-nums">{item.quantity}×</span>
                                    <span className="min-w-0 font-semibold">{item.name}</span>
                                    <span className="min-w-4 flex-1 -translate-y-1 border-b-2 border-dotted border-rule-strong" aria-hidden />
                                    <DigitDisplay value={priceDigits(item.lineTotal)} chip={false} size="sm" className="shrink-0" />
                                </div>
                                {item.addOns.length > 0 && (
                                    <p className="mt-0.5 pl-10 text-sm text-ink-muted">
                                        + {item.addOns.map((addOn) => addOn.name).join(', ')} ({formatPrice(item.addOnsTotal)})
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                    <dl className="flex items-baseline justify-between border-t-2 border-ink pt-4">
                        <dt className="text-lg font-semibold">Jumlah</dt>
                        <dd>
                            <DigitDisplay value={priceDigits(order.total)} size="lg" />
                        </dd>
                    </dl>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-4">
                        <p className="text-[15px] font-semibold text-ink">{order.paymentMethodLabel}</p>
                        <span className={cn('inline-flex h-7 items-center rounded-(--radius-module) px-2.5 text-xs font-bold tracking-wide uppercase', PAYMENT_TONE[order.paymentStatus])}>
                            {order.paymentStatusLabel}
                        </span>
                    </div>
                    {order.notes && (
                        <p className="mt-4 rounded-(--radius-panel) border-2 border-rule-strong bg-amber-tint p-4 text-[15px]">
                            <span className="font-semibold">Nota: </span>
                            {order.notes}
                        </p>
                    )}
                </section>

                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/"
                        className="inline-flex h-12 items-center rounded-(--radius-control) border-2 border-ink px-5 font-semibold transition-[transform,background-color,color] duration-150 hover:bg-ink hover:text-white active:scale-[0.97]"
                    >
                        Pesan lagi
                    </Link>
                    <a
                        href={`/pesanan/${order.publicId}/resit`}
                        className="inline-flex h-12 items-center gap-2 rounded-(--radius-control) px-4 font-semibold text-ink hover:bg-amber-tint"
                    >
                        <DownloadSimpleIcon size={18} weight="bold" aria-hidden />
                        Muat turun resit
                    </a>
                    {restaurant.phone && (
                        <a
                            href={`tel:${restaurant.phone.replace(/[^\d+]/g, '')}`}
                            className="inline-flex h-12 items-center gap-2 rounded-(--radius-control) px-4 font-semibold text-ink hover:bg-amber-tint"
                        >
                            <PhoneIcon size={18} weight="bold" aria-hidden />
                            Hubungi kedai
                        </a>
                    )}
                    {canCancel && (
                        <ConfirmButton
                            label="Batal pesanan"
                            size="md"
                            title={`Batalkan ${order.number}?`}
                            message="Pesanan ini akan dibatalkan. Tindakan ini tidak boleh diundur."
                            confirmLabel="Ya, batalkan"
                            onConfirm={() => router.patch(`/pesanan/${order.publicId}/batal`, {}, { preserveScroll: true })}
                            className="h-12"
                        />
                    )}
                </div>
            </main>
        </>
    );
}
