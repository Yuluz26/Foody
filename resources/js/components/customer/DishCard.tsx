import { PlusIcon, StarIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { DigitDisplay } from '@/components/DigitDisplay';
import { FoodImage } from '@/components/FoodImage';
import { cn, priceDigits } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import type { MenuProduct } from '@/types';

type DishProps = {
    product: MenuProduct;
    code: string;
    quantityInCart: number;
    canOrder: boolean;
    onOpen: () => void;
    onQuickAdd: () => void;
    priority?: boolean;
};

/** A tile on the board: photo up top with its digit code and status riding the frame, name and price below. */
export function DishCard({ product, code, quantityInCart, canOrder, onOpen, onQuickAdd, priority = false }: DishProps) {
    const soldOut = !product.isAvailable;

    return (
        <li>
            <article className="group relative">
                <div className="relative">
                    <div className="relative overflow-hidden rounded-(--radius-panel) border-2 border-rule-strong bg-module">
                        <FoodImage
                            url={product.imageUrl}
                            alt=""
                            priority={priority}
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 45vw, 47vw"
                            className={cn(
                                'aspect-square w-full transition-transform duration-500 ease-out group-hover:scale-[1.04] sm:aspect-[4/3]',
                                soldOut && 'opacity-60 grayscale',
                            )}
                        />
                        <span className="pointer-events-none absolute top-2 left-2">
                            <DigitDisplay value={code} tone={soldOut ? 'dim' : 'amber'} size="xs" />
                        </span>
                        {soldOut ? (
                            <span className="absolute top-2 right-2 rounded-(--radius-module) bg-ink px-1.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase">Habis</span>
                        ) : (
                            product.isFeatured && (
                                <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-(--radius-module) bg-amber px-1.5 py-1 text-[11px] font-bold tracking-wide text-ink uppercase">
                                    <StarIcon size={11} weight="fill" aria-hidden />
                                    Pilihan
                                </span>
                            )
                        )}
                    </div>
                    {!soldOut && canOrder && <QuickAdd name={product.name} quantity={quantityInCart} onAdd={onQuickAdd} />}
                </div>
                <div className="mt-2.5">
                    <h3 className="min-w-0 text-[15px] leading-snug font-bold text-ink">
                        <button
                            type="button"
                            onClick={onOpen}
                            className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-offset-2 focus-visible:after:outline-ink"
                        >
                            {product.name}
                        </button>
                    </h3>
                    {product.description && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-soft">{product.description}</p>}
                    <div className="mt-1.5">
                        <DigitDisplay
                            value={priceDigits(product.price)}
                            chip={false}
                            tone={soldOut ? 'dim' : 'ink'}
                            size="sm"
                            className={cn(soldOut && 'text-ink-muted line-through decoration-2')}
                        />
                    </div>
                </div>
            </article>
        </li>
    );
}

function QuickAdd({ name, quantity, onAdd }: { name: string; quantity: number; onAdd: () => void }) {
    const reduce = useReducedMotion();

    return (
        <button
            type="button"
            onClick={onAdd}
            aria-label={quantity > 0 ? `Tambah satu lagi ${name}, ${quantity} dalam troli` : `Tambah ${name} ke troli`}
            className={cn(
                'absolute right-2 -bottom-2 z-10 grid size-11 place-items-center overflow-hidden rounded-(--radius-control) border-2 border-panel shadow-(--shadow-lift) transition-[transform,background-color] duration-150 ease-out active:scale-[0.9]',
                quantity > 0 ? 'bg-amber text-ink' : 'bg-ink text-white hover:bg-ink-soft',
            )}
        >
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={quantity}
                    className="grid place-items-center"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(70%)' }}
                    animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0%)' }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-70%)' }}
                    transition={{ duration: duration.fast, ease: ease.out }}
                >
                    {quantity > 0 ? (
                        <DigitDisplay value={String(quantity)} chip={false} tone="ink" size="md" />
                    ) : (
                        <PlusIcon size={20} weight="bold" aria-hidden />
                    )}
                </motion.span>
            </AnimatePresence>
        </button>
    );
}
