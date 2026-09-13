import { Link } from '@inertiajs/react';
import { ArrowRightIcon, BasketIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCart } from '@/cart/CartProvider';
import { DigitDisplay } from '@/components/DigitDisplay';
import { FoodImage } from '@/components/FoodImage';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Sheet } from '@/components/Sheet';
import { cn, formatPrice, priceDigits } from '@/lib/format';
import { duration, ease } from '@/lib/motion';

export function CartLines() {
    const { lines, setQuantity, remove } = useCart();
    const reduce = useReducedMotion();

    return (
        <ul className="divide-y divide-rule">
            <AnimatePresence initial={false}>
                {lines.map((line) => {
                    // Add-ons are a flat charge for the line, not per unit: quantity only scales the dish price.
                    const addOnsTotal = line.addOns.reduce((sum, addOn) => sum + addOn.price, 0);
                    const lineTotal = line.price * line.quantity + addOnsTotal;

                    return (
                        <motion.li
                            key={line.id}
                            layout={reduce ? false : 'position'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: duration.exit } }}
                            transition={{ duration: duration.base, ease: ease.out }}
                            className="flex gap-3 py-4"
                        >
                            <FoodImage url={line.imageUrl} alt="" sizes="64px" className="size-16 shrink-0 rounded-(--radius-module)" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2">
                                    <p className="min-w-0 leading-snug font-semibold">{line.name}</p>
                                    {/* Dotted leader, as on a printed menu. */}
                                    <span className="min-w-4 flex-1 -translate-y-1 border-b-2 border-dotted border-rule-strong" aria-hidden />
                                    <DigitDisplay value={priceDigits(lineTotal)} chip={false} size="sm" className="shrink-0" />
                                </div>
                                {line.addOns.length > 0 && (
                                    <p className="mt-0.5 truncate text-sm text-ink-muted">
                                        + {line.addOns.map((addOn) => addOn.name).join(', ')} ({formatPrice(addOnsTotal)})
                                    </p>
                                )}
                                <div className="mt-2 flex items-center justify-between gap-3">
                                    <QuantityStepper size="sm" min={0} value={line.quantity} onChange={(quantity) => setQuantity(line.id, quantity)} label={line.name} />
                                    <button
                                        type="button"
                                        onClick={() => remove(line.id)}
                                        className="-mr-2 h-10 px-2 text-sm font-semibold text-ink-muted underline decoration-rule-strong hover:text-alert hover:decoration-alert"
                                    >
                                        Buang
                                    </button>
                                </div>
                            </div>
                        </motion.li>
                    );
                })}
            </AnimatePresence>
        </ul>
    );
}

function CartEmpty() {
    return (
        <div className="py-10 text-center">
            <BasketIcon size={40} weight="bold" className="mx-auto text-rule-strong" aria-hidden />
            <p className="mt-3 text-2xl font-extrabold text-ink">Troli masih kosong</p>
            <p className="mx-auto mt-1 max-w-[28ch] text-[15px] text-ink-muted">Tekan butang tambah pada hidangan untuk mula memesan.</p>
        </div>
    );
}

function CheckoutLink({ href, disabled }: { href: string; disabled: boolean }) {
    const { subtotal } = useCart();
    const className =
        'flex h-14 w-full items-center justify-between gap-3 rounded-(--radius-control) bg-ink px-5 font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-ink-soft active:scale-[0.98]';

    if (disabled) {
        return (
            <p className="rounded-(--radius-control) bg-ground px-4 py-3 text-center text-[15px] font-semibold text-ink-soft">
                Pesanan ditutup buat masa ini.
            </p>
        );
    }

    return (
        <Link href={href} className={cn(className, 'on-module')}>
            <span className="flex items-center gap-2">
                Teruskan pesanan
                <ArrowRightIcon size={18} weight="bold" aria-hidden />
            </span>
            <DigitDisplay value={priceDigits(subtotal)} tone="amber" chip={false} size="lg" />
        </Link>
    );
}

type CartSurfaceProps = { checkoutHref: string; canOrder: boolean };

/** Desktop: a standing order chit beside the menu. */
export function CartPanel({ checkoutHref, canOrder }: CartSurfaceProps) {
    const { lines, count } = useCart();

    return (
        <aside aria-labelledby="troli-tajuk" className="sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col rounded-(--radius-panel) border-2 border-rule-strong bg-panel">
            <div className="flex items-baseline justify-between border-b-2 border-amber px-5 pt-4 pb-3">
                <h2 id="troli-tajuk" className="text-2xl font-extrabold text-ink">
                    Troli
                </h2>
                <p className="text-sm font-semibold text-ink-muted">{count} item</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5">{lines.length ? <CartLines /> : <CartEmpty />}</div>
            {lines.length > 0 && (
                <div className="border-t border-rule p-4">
                    <CheckoutLink href={checkoutHref} disabled={!canOrder} />
                </div>
            )}
        </aside>
    );
}

/** Phones and tablets: a dark strip rises once the cart has something in it. */
export function CartBar({ checkoutHref, canOrder, open, onOpenChange }: CartSurfaceProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { lines, count, subtotal } = useCart();
    const reduce = useReducedMotion();

    return (
        <>
            <AnimatePresence>
                {count > 0 && (
                    <motion.div
                        className="on-module fixed inset-x-0 bottom-0 z-40 bg-ink pb-safe shadow-(--shadow-lift) lg:hidden"
                        initial={reduce ? { opacity: 0 } : { transform: 'translateY(100%)' }}
                        animate={reduce ? { opacity: 1 } : { transform: 'translateY(0%)' }}
                        exit={reduce ? { opacity: 0 } : { transform: 'translateY(100%)' }}
                        transition={{ duration: duration.sheet, ease: ease.drawer }}
                    >
                        <button
                            type="button"
                            onClick={() => onOpenChange(true)}
                            className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-5 text-white active:bg-ink-soft"
                            aria-haspopup="dialog"
                        >
                            <span className="flex items-center gap-3">
                                <span className="sr-only">{count} item dalam troli.</span>
                                <AnimatePresence mode="popLayout" initial={false}>
                                    <motion.span
                                        key={count}
                                        aria-hidden
                                        initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(70%)' }}
                                        animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0%)' }}
                                        exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-70%)' }}
                                        transition={{ duration: duration.fast, ease: ease.out }}
                                    >
                                        <DigitDisplay value={String(count)} size="md" />
                                    </motion.span>
                                </AnimatePresence>
                                <span className="text-base font-semibold">Lihat troli</span>
                            </span>
                            <DigitDisplay value={priceDigits(subtotal)} tone="amber" chip={false} size="lg" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <Sheet
                open={open}
                onClose={() => onOpenChange(false)}
                title="Troli"
                footer={lines.length > 0 ? <CheckoutLink href={checkoutHref} disabled={!canOrder} /> : undefined}
            >
                <div className={cn('px-5 md:px-6', lines.length === 0 && 'pb-6')}>{lines.length ? <CartLines /> : <CartEmpty />}</div>
            </Sheet>
        </>
    );
}
