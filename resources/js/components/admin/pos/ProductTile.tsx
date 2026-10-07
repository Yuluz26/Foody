import { PlusIcon } from '@phosphor-icons/react';
import { FoodImage } from '@/components/FoodImage';
import { cn, formatPrice } from '@/lib/format';
import type { PosProduct } from './usePosCart';

type ProductTileProps = {
    product: PosProduct;
    inCart: number;
    onPick: () => void;
};

/**
 * One dish on the counter: a big picture to tap, name and price below. The whole tile is the button, so a
 * wet thumb can hit it. A count badge says how many are already in the basket; stock shows only when it matters.
 */
export function ProductTile({ product, inCart, onPick }: ProductTileProps) {
    const soldOut = !product.isAvailable;
    const left = product.stockQuantity;
    const hasOptions = product.addOns.length > 0;

    return (
        <li>
            <button
                type="button"
                onClick={onPick}
                disabled={soldOut}
                aria-label={`${product.name}, ${formatPrice(product.price)}${soldOut ? ', habis' : hasOptions ? ', pilih tambahan' : ''}${inCart > 0 ? `, ${inCart} dalam troli` : ''}`}
                className={cn(
                    'neu-tile group relative flex h-full w-full flex-col p-2 text-left [--neu-radius:var(--radius-panel)]',
                    'transition-[transform,box-shadow] duration-200 ease-spring motion-reduce:transition-shadow',
                    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink',
                    soldOut ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-(--shadow-raised) active:translate-y-0 active:scale-[0.98] active:shadow-(--shadow-inset-sm) motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100',
                )}
            >
                <span className="relative block overflow-hidden rounded-[calc(var(--radius-panel)-8px)] bg-ground-deep">
                    <FoodImage
                        url={product.imageUrl}
                        alt=""
                        sizes="(min-width: 1280px) 15vw, (min-width: 768px) 22vw, 45vw"
                        className={cn('aspect-[4/3] w-full', soldOut && 'opacity-60 grayscale')}
                    />
                    {soldOut ? (
                        <span className="absolute top-1.5 left-1.5 rounded-(--radius-module) bg-ink px-1.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase">Habis</span>
                    ) : (
                        left !== null &&
                        left <= 10 && (
                            <span className="absolute top-1.5 left-1.5 rounded-(--radius-module) bg-amber px-1.5 py-1 text-[11px] font-bold tracking-wide text-ink uppercase shadow-(--shadow-raised-2xs)">Tinggal {left}</span>
                        )
                    )}
                    {inCart > 0 && (
                        <span className="absolute top-1.5 right-1.5 grid min-w-7 place-items-center rounded-full bg-ink px-1.5 py-0.5 font-mono text-sm font-semibold text-amber tabular-nums shadow-(--shadow-raised-xs)" aria-hidden>
                            {inCart}
                        </span>
                    )}
                </span>
                <span className="flex flex-1 flex-col gap-1 px-1 pt-2 pb-0.5">
                    <span className="line-clamp-2 text-[15px] leading-snug font-bold text-ink">{product.name}</span>
                    <span className="mt-auto flex items-center justify-between gap-2">
                        <span className="font-mono text-base font-semibold text-ink tabular-nums">{formatPrice(product.price)}</span>
                        {!soldOut && (
                            <span className="grid size-8 place-items-center rounded-full bg-amber text-ink shadow-(--shadow-raised-2xs) transition-transform duration-200 ease-spring group-active:scale-90" aria-hidden>
                                <PlusIcon size={16} weight="bold" />
                            </span>
                        )}
                    </span>
                </span>
            </button>
        </li>
    );
}
