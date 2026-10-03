import { Link } from '@inertiajs/react';
import { ArrowRightIcon, BasketIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCart } from '@/cart/CartProvider';
import { DigitDisplay } from '@/components/DigitDisplay';
import { FoodImage } from '@/components/FoodImage';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Sheet } from '@/components/Sheet';
import { buttonClass } from '@/components/ui/Button';
import { cn, formatPrice, priceDigits } from '@/lib/format';
import { duration, ease } from '@/lib/motion';

export function CartLines() {
    const { lines, setQuantity, remove } = useCart();
    const reduce = useReducedMotion();

    return (
        <ul className="divide-y divide-rule/70">
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
                            className="flex gap-3.5 py-4"
                        >
                            <FoodImage url={line.imageUrl} alt="" sizes="64px" className="size-16 shrink-0 rounded-(--radius-control) shadow-(--shadow-raised-xs)" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2">
                                    <p className="min-w-0 leading-snug font-semibold">{line.name}</p>
                                    {/* Dotted leader, as on a printed menu. */}
                                    <span className="min-w-4 flex-1 -translate-y-1 border-b-2 border-dotted border-rule-strong/70" aria-hidden />
                                    <DigitDisplay value={priceDigits(lineTotal)} chip={false} size="sm" className="shrink-0" />
                                </div>
                                {line.addOns.length > 0 && (
                                    <p className="mt-0.5 truncate text-sm text-ink-muted">
                                        + {line.addOns.map((addOn) => addOn.name).join(', ')} ({formatPrice(addOnsTotal)})
                                    </p>
                                )}
                                <div className="mt-2 flex items-center justify-between gap-3">
                                    <QuantityStepper size="sm" min={0} value={line.quantity} onChange={(quantity) => setQuantity(line.id, quantity)} label={line.name} />
                                    <button type="button" onClick={() => remove(line.id)} className={buttonClass({ variant: 'quiet', size: 'sm', className: 'hover:text-alert' })}>
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
            <span className="neu-well-sm mx-auto grid size-16 place-items-center [--neu-radius:9999px]">
                <BasketIcon size={30} weight="bold" className="text-ink-muted" aria-hidden />
            </span>
            <p className="mt-3 text-2xl font-extrabold text-ink">Troli masih kosong</p>
            <p className="mx-auto mt-1 max-w-[28ch] text-[15px] text-ink-muted">Tekan butang tambah pada hidangan untuk mula memesan.</p>
        </div>
    );
}

function CheckoutLink({ href, disabled }: { href: string; disabled: boolean }) {
    const { subtotal } = useCart();

    if (disabled) {
        return <p className="neu-well-sm px-4 py-3 text-center text-[15px] font-semibold text-ink-soft">Pesanan ditutup buat masa ini.</p>;
    }

    return (
        <Link href={href} className={buttonClass({ variant: 'ink', size: 'lg', className: 'on-module w-full justify-between' })}>
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
        <aside aria-labelledby="troli-tajuk" className="neu-card sticky top-5 flex max-h-[calc(100dvh-2.5rem)] flex-col">
            <div className="flex items-baseline justify-between px-5 pt-5">
                <h2 id="troli-tajuk" className="section-title text-2xl font-extrabold text-ink">
                    Troli
                </h2>
                <p className="text-sm font-semibold text-ink-muted">{count} item</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-1">{lines.length ? <CartLines /> : <CartEmpty />}</div>
            {lines.length > 0 && (
                <div className="p-4 pt-3">
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
                        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden"
                        initial={reduce ? { opacity: 0 } : { transform: 'translateY(100%)' }}
                        animate={reduce ? { opacity: 1 } : { transform: 'translateY(0%)' }}
                        exit={reduce ? { opacity: 0 } : { transform: 'translateY(100%)' }}
                        transition={{ duration: duration.sheet, ease: ease.drawer }}
                    >
                        <button
                            type="button"
                            onClick={() => onOpenChange(true)}
                            className={buttonClass({ variant: 'ink', size: 'lg', className: 'on-module mx-auto h-16 w-full max-w-3xl justify-between px-5' })}
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
