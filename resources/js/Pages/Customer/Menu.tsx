import { MagnifyingGlassIcon, StorefrontIcon, XIcon } from '@phosphor-icons/react';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '@/cart/CartProvider';
import { CartBar, CartPanel } from '@/components/customer/Cart';
import { CategoryRail } from '@/components/customer/CategoryRail';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { CustomerSidebar } from '@/components/customer/CustomerSidebar';
import { DishCard } from '@/components/customer/DishCard';
import { MenuSection } from '@/components/customer/MenuSection';
import { MenuSlider } from '@/components/customer/MenuSlider';
import { ProductSheet } from '@/components/customer/ProductSheet';
import { RestaurantBoard } from '@/components/customer/RestaurantBoard';
import { DigitDisplay } from '@/components/DigitDisplay';
import { useToast } from '@/components/Toaster';
import { inputClass } from '@/components/ui/Field';
import { cn, digitCode, formatClock } from '@/lib/format';
import type { AddOn, MenuBanner, MenuCategory, MenuProduct, Restaurant } from '@/types';

type MenuProps = {
    restaurant: Restaurant;
    banners: MenuBanner[];
    categories: MenuCategory[];
    table: string | null;
};

const TABLE_KEY = 'foody.table';

export default function Menu(props: MenuProps) {
    return (
        <CustomerLayout
            title={`${props.restaurant.name} | Menu dan pesanan`}
            description={props.restaurant.description ?? `Lihat menu dan buat pesanan di ${props.restaurant.name}.`}
        >
            <MenuScreen {...props} />
        </CustomerLayout>
    );
}

function closedMessage(restaurant: Restaurant): string {
    if (!restaurant.orderingEnabled) {
        return 'Pesanan dalam talian ditutup buat sementara. Sila pesan di kaunter.';
    }

    const opens = formatClock(restaurant.opensAt);

    return opens ? `Kedai sudah tutup. Pesanan dibuka semula pada ${opens}.` : 'Kedai tidak menerima pesanan sekarang.';
}

function MenuScreen({ restaurant, banners, categories, table: tableFromLink }: MenuProps) {
    const cart = useCart();
    const toast = useToast();
    const reduce = useReducedMotion();
    const [activeId, setActiveId] = useState<number | null>(categories[0]?.id ?? null);
    const [selection, setSelection] = useState<{ product: MenuProduct; code: string } | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [table, setTable] = useState<string | null>(tableFromLink);
    const [query, setQuery] = useState('');
    const scrollLock = useRef(0);
    const canOrder = restaurant.acceptingOrders;

    // Remember the table from the QR link for the rest of the visit.
    useEffect(() => {
        try {
            if (tableFromLink) {
                window.sessionStorage.setItem(TABLE_KEY, tableFromLink);
            } else {
                setTable(window.sessionStorage.getItem(TABLE_KEY));
            }
        } catch {
            // Storage blocked: the table is asked for at checkout instead.
        }
    }, [tableFromLink]);

    // Highlight the category whose section is passing under the sticky rail.
    useEffect(() => {
        const sections = categories
            .map((category) => document.getElementById(`kategori-${category.slug}`))
            .filter((section): section is HTMLElement => section !== null);

        const observer = new IntersectionObserver(
            (entries) => {
                if (Date.now() < scrollLock.current) {
                    return;
                }

                const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

                if (current) {
                    setActiveId(Number((current.target as HTMLElement).dataset.categoryId));
                }
            },
            { rootMargin: '-72px 0px -70% 0px' },
        );

        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, [categories]);

    // A dish can sit in the cart as several lines (one per add-on combination); the badge sums them all.
    const quantities = useMemo(() => {
        const totals: Record<number, number> = {};

        for (const line of cart.lines) {
            totals[line.productId] = (totals[line.productId] ?? 0) + line.quantity;
        }

        return totals;
    }, [cart.lines]);
    const checkoutHref = table ? `/pesan?meja=${encodeURIComponent(table)}` : '/pesan';

    // Dish numbers run sequentially across the whole menu, so each category starts where the last left off.
    const sections = useMemo(() => {
        let count = 0;

        return categories.map((category) => {
            const startIndex = count;
            count += category.products.length;

            return { category, startIndex };
        });
    }, [categories]);

    const normalizedQuery = query.trim().toLowerCase();
    const isSearching = normalizedQuery.length > 0;

    const searchResults = useMemo(() => {
        if (!isSearching) {
            return [];
        }

        return sections.flatMap(({ category, startIndex }) =>
            category.products
                .map((product, productIndex) => ({ product, code: digitCode(startIndex + productIndex) }))
                .filter(
                    ({ product }) =>
                        product.name.toLowerCase().includes(normalizedQuery) || (product.description?.toLowerCase().includes(normalizedQuery) ?? false),
                ),
        );
    }, [sections, isSearching, normalizedQuery]);

    const selectCategory = (category: MenuCategory) => {
        setActiveId(category.id);
        scrollLock.current = Date.now() + 900;
        document.getElementById(`kategori-${category.slug}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        document.getElementById(`tajuk-${category.slug}`)?.focus({ preventScroll: true });
    };

    const add = (product: MenuProduct, quantity: number, addOns: AddOn[] = []) => {
        cart.add({ productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, addOns }, quantity);
        toast(quantity > 1 ? `${quantity} × ${product.name} ditambah` : `${product.name} ditambah`);
    };

    return (
        <>
            <div className="lg:hidden">
                <RestaurantBoard restaurant={restaurant} />
            </div>
            <MenuSlider banners={banners} />

            {table && (
                <p className="border-b border-rule bg-amber-tint px-6 py-2.5 text-center text-[15px] font-semibold text-ink">
                    Anda di meja{' '}
                    <DigitDisplay value={table} size="sm" className="mx-0.5 align-middle" />. Pesanan makan di sini akan dihantar ke meja ini.
                </p>
            )}

            {!canOrder && (
                <p role="status" className="flex items-center justify-center gap-2 bg-ink px-6 py-3 text-center text-[15px] font-semibold text-white">
                    <StorefrontIcon size={20} weight="bold" className="shrink-0 text-amber" aria-hidden />
                    {closedMessage(restaurant)} Menu masih boleh dilihat.
                </p>
            )}

            {categories.length === 0 ? (
                <main id="kandungan" className="mx-auto max-w-xl px-6 py-20 text-center">
                    <p className="text-3xl font-extrabold text-ink">Menu sedang dikemas kini</p>
                    <p className="mt-3 text-base text-ink-soft">Hidangan akan dipaparkan sebentar lagi. Sila muat semula halaman ini nanti.</p>
                </main>
            ) : (
                <>
                    <div className="lg:hidden">
                        <CategoryRail categories={categories} activeId={activeId} onSelect={selectCategory} />
                    </div>

                    <div className="mx-auto max-w-[96rem] gap-8 px-5 pt-6 pb-32 sm:px-8 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)_340px] lg:pb-20">
                        <CustomerSidebar restaurant={restaurant} categories={categories} activeId={activeId} onSelect={selectCategory} />

                        <main id="kandungan" className="min-w-0">
                            <label className="relative block">
                                <span className="sr-only">Cari hidangan</span>
                                <MagnifyingGlassIcon size={20} weight="bold" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted" aria-hidden />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Cari hidangan atau bahan..."
                                    className={cn(inputClass, 'pl-11')}
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => setQuery('')}
                                        aria-label="Kosongkan carian"
                                        className="absolute top-1/2 right-2.5 grid size-8 -translate-y-1/2 place-items-center rounded-(--radius-control) text-ink-muted hover:bg-ground hover:text-ink"
                                    >
                                        <XIcon size={18} weight="bold" aria-hidden />
                                    </button>
                                )}
                            </label>

                            {isSearching ? (
                                <section aria-labelledby="carian-tajuk" className="pt-8">
                                    <h2 id="carian-tajuk" className="border-b-2 border-amber pb-2.5 text-2xl font-extrabold text-ink sm:text-3xl">
                                        Hasil carian
                                    </h2>
                                    {searchResults.length === 0 ? (
                                        <p className="py-8 text-[15px] text-ink-muted">Tiada hidangan sepadan dengan &ldquo;{query}&rdquo;.</p>
                                    ) : (
                                        <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-5">
                                            {searchResults.map(({ product, code }) => (
                                                <DishCard
                                                    key={product.id}
                                                    product={product}
                                                    code={code}
                                                    quantityInCart={quantities[product.id] ?? 0}
                                                    canOrder={canOrder}
                                                    onOpen={() => setSelection({ product, code })}
                                                    onQuickAdd={() => add(product, 1)}
                                                />
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            ) : (
                                sections.map(({ category, startIndex }, index) => (
                                    <MenuSection
                                        key={category.id}
                                        category={category}
                                        startIndex={startIndex}
                                        canOrder={canOrder}
                                        quantities={quantities}
                                        priorityImage={index === 0}
                                        onOpen={(product, code) => setSelection({ product, code })}
                                        onQuickAdd={(product) => add(product, 1)}
                                    />
                                ))
                            )}
                        </main>
                        <div className="hidden pt-8 lg:block">
                            <CartPanel checkoutHref={checkoutHref} canOrder={canOrder} />
                        </div>
                    </div>
                </>
            )}

            <ProductSheet
                selection={selection}
                canOrder={canOrder}
                closedMessage={closedMessage(restaurant)}
                onClose={() => setSelection(null)}
                onAdd={(product, quantity, addOns) => {
                    add(product, quantity, addOns);
                    setSelection(null);
                }}
            />

            <CartBar checkoutHref={checkoutHref} canOrder={canOrder} open={cartOpen} onOpenChange={setCartOpen} />
        </>
    );
}
