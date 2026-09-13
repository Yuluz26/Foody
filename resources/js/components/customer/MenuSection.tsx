import { digitCode } from '@/lib/format';
import type { MenuCategory, MenuProduct } from '@/types';
import { DishCard } from './DishCard';

type MenuSectionProps = {
    category: MenuCategory;
    /** Running count of dishes shown before this category, so item numbers stay sequential across the whole menu. */
    startIndex: number;
    canOrder: boolean;
    quantities: Record<number, number>;
    onOpen: (product: MenuProduct, code: string) => void;
    onQuickAdd: (product: MenuProduct) => void;
    priorityImage?: boolean;
};

export function MenuSection({ category, startIndex, canOrder, quantities, onOpen, onQuickAdd, priorityImage = false }: MenuSectionProps) {
    // Numbers follow menu order and run across the whole board, so staff and diners share one number per dish.
    const coded = category.products.map((product, productIndex) => ({ product, code: digitCode(startIndex + productIndex) }));
    const headingId = `tajuk-${category.slug}`;

    return (
        <section id={`kategori-${category.slug}`} data-category-id={category.id} aria-labelledby={headingId} className="scroll-mt-16 pt-10 first:pt-8">
            <header className="border-b-2 border-amber pb-2.5">
                <h2 id={headingId} tabIndex={-1} className="min-w-0 text-2xl font-extrabold text-ink focus-visible:outline-none sm:text-3xl">
                    {category.name}
                </h2>
                {category.description && <p className="mt-1.5 text-[15px] text-ink-muted">{category.description}</p>}
            </header>

            <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-5">
                {coded.map(({ product, code }) => (
                    <DishCard
                        key={product.id}
                        product={product}
                        code={code}
                        quantityInCart={quantities[product.id] ?? 0}
                        canOrder={canOrder}
                        priority={priorityImage && product.id === coded[0]?.product.id}
                        onOpen={() => onOpen(product, code)}
                        onQuickAdd={() => onQuickAdd(product)}
                    />
                ))}
            </ul>
        </section>
    );
}
