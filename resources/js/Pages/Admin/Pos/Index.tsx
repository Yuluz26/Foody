import { router } from '@inertiajs/react';
import { CashRegisterIcon, CheckCircleIcon, MagnifyingGlassIcon, PrinterIcon, ShoppingBagIcon } from '@phosphor-icons/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CartPanel, type OrderDraft } from '@/components/admin/pos/CartPanel';
import { ProductTile } from '@/components/admin/pos/ProductTile';
import { usePosCart, type PosProduct } from '@/components/admin/pos/usePosCart';
import { DigitDisplay } from '@/components/DigitDisplay';
import { FoodImage } from '@/components/FoodImage';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Sheet } from '@/components/Sheet';
import { useToast } from '@/components/Toaster';
import { Button, buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchField } from '@/components/ui/SearchField';
import { cn, formatPrice, priceDigits } from '@/lib/format';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { useStickyTop } from '@/lib/useStickyTop';
import type { AddOn } from '@/types';

type PosCategory = { id: number; name: string; products: PosProduct[] };

type Completed = {
    id: number;
    number: string;
    total: number;
    typeLabel: string;
    tableNumber: string | null;
    paymentStatus: string;
    paymentStatusLabel: string;
    receiptUrl: string;
};

type PosProps = {
    categories: PosCategory[];
    tables: { all: string[]; available: string[] };
    completed: Completed | null;
};

const EMPTY_DRAFT: OrderDraft = { type: 'takeaway', table: '', name: '', phone: '', notes: '', payment: 'cashier', paid: true, tendered: '' };

const newKey = (): string => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pos-${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** Picking add-ons and a quantity for one dish before it goes into the basket. */
function OptionsSheet({ product, onAdd }: { product: PosProduct; onAdd: (quantity: number, addOns: AddOn[]) => void }) {
    const [quantity, setQuantity] = useState(1);
    const [selected, setSelected] = useState<number[]>([]);
    const chosen = product.addOns.filter((addOn) => selected.includes(addOn.id));
    const total = product.price * quantity + chosen.reduce((sum, addOn) => sum + addOn.price, 0);
    const max = Math.min(50, product.stockQuantity ?? 50);

    return (
        <div className="px-5 pt-1 pb-6 md:px-6">
            <div className="flex items-center gap-3">
                <FoodImage url={product.imageUrl} alt="" sizes="80px" className="size-20 shrink-0 rounded-(--radius-control)" />
                <div className="min-w-0 pr-12">
                    <p className="text-lg font-bold text-ink">{product.name}</p>
                    <p className="font-mono text-base font-semibold text-ink-soft tabular-nums">{formatPrice(product.price)}</p>
                </div>
            </div>

            <fieldset className="mt-5 grid gap-2">
                <legend className="mb-1 text-[15px] font-semibold text-ink">Tambahan</legend>
                {product.addOns.map((addOn) => {
                    const on = selected.includes(addOn.id);

                    return (
                        <label
                            key={addOn.id}
                            className={cn(
                                'flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-(--radius-control) px-3.5 py-2 transition-shadow',
                                on ? 'bg-amber-tint shadow-(--shadow-inset-sm)' : 'bg-panel shadow-(--shadow-raised-2xs)',
                            )}
                        >
                            <span className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={on}
                                    onChange={() => setSelected((ids) => (on ? ids.filter((id) => id !== addOn.id) : [...ids, addOn.id]))}
                                    className="size-5 accent-ink"
                                />
                                <span className="font-semibold text-ink">{addOn.name}</span>
                            </span>
                            <span className="font-mono text-sm font-semibold text-ink-soft tabular-nums">+{formatPrice(addOn.price)}</span>
                        </label>
                    );
                })}
            </fieldset>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-5">
                <QuantityStepper value={quantity} onChange={setQuantity} label={product.name} max={max} />
                <Button variant="amber" size="lg" className="min-w-0 flex-1 basis-44" onClick={() => onAdd(quantity, chosen)}>
                    Tambah
                    <DigitDisplay value={priceDigits(total)} tone="ink" chip={false} size="md" />
                </Button>
            </div>
        </div>
    );
}

function DoneSheet({ order, onNew }: { order: Completed; onNew: () => void }) {
    return (
        <div className="grid justify-items-center gap-4 px-5 pt-2 pb-7 text-center md:px-6">
            <span className="grid size-16 place-items-center rounded-full bg-leaf text-white shadow-(--shadow-raised-xs)">
                <CheckCircleIcon size={34} weight="bold" aria-hidden />
            </span>
            <div>
                <p className="text-sm font-semibold text-ink-muted">Dihantar ke dapur</p>
                <DigitDisplay value={order.number} size="lg" />
            </div>
            <p className="text-[15px] text-ink-soft">
                {order.typeLabel}
                {order.tableNumber && `, meja ${order.tableNumber}`}, <span className="font-mono font-semibold text-ink tabular-nums">{formatPrice(order.total)}</span>,{' '}
                {order.paymentStatusLabel.toLowerCase()}
            </p>
            <div className="mt-2 flex w-full flex-wrap justify-center gap-3">
                <a href={order.receiptUrl} target="_blank" rel="noopener" className={buttonClass({ variant: 'soft', size: 'lg' })}>
                    <PrinterIcon size={20} weight="bold" aria-hidden />
                    Cetak resit
                </a>
                <Button variant="amber" size="lg" onClick={onNew}>
                    Pesanan baharu
                </Button>
            </div>
        </div>
    );
}

function PosScreen({ categories, tables, completed }: PosProps) {
    const toast = useToast();
    const cart = usePosCart();
    const [category, setCategory] = useState<'all' | number>('all');
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<PosProduct | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [draft, setDraft] = useState<OrderDraft>(EMPTY_DRAFT);
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [processing, setProcessing] = useState(false);
    const key = useRef(newKey());
    // One cart at a time: a side column on wide screens, a sheet behind a bottom bar everywhere else. Never both in the DOM, so ids and focus stay unambiguous.
    const wide = useMediaQuery('(min-width: 1280px)');
    // The side cart sticks while the menu scrolls. It ends a gutter above the viewport's bottom wherever it currently sits (its height reads --sticky-top), so it fills the screen once stuck.
    const gridRef = useRef<HTMLDivElement>(null);
    const cartRef = useRef<HTMLElement>(null);
    useStickyTop(gridRef, cartRef, wide);

    const patchDraft = useCallback((patch: Partial<OrderDraft>) => setDraft((current) => ({ ...current, ...patch })), []);

    const sections = useMemo(() => {
        const term = query.trim().toLowerCase();

        return categories
            .filter((item) => category === 'all' || item.id === category)
            .map((item) => ({ ...item, products: item.products.filter((product) => term === '' || product.name.toLowerCase().includes(term)) }))
            .filter((item) => item.products.length > 0);
    }, [categories, category, query]);

    const pick = (product: PosProduct) => {
        if (product.addOns.length > 0) {
            setOptions(product);

            return;
        }

        if (!cart.add(product, 1)) {
            toast(`Baki ${product.name} tinggal ${product.stockQuantity}.`);
        }
    };

    const addFromOptions = (quantity: number, addOns: AddOn[]) => {
        if (options && !cart.add(options, quantity, addOns)) {
            toast(`Baki ${options.name} tinggal ${options.stockQuantity}.`);
        }

        setOptions(null);
    };

    const submit = () => {
        router.post(
            '/admin/pos',
            {
                idempotency_key: key.current,
                type: draft.type,
                table_number: draft.type === 'dine_in' ? draft.table : null,
                customer_name: draft.name,
                customer_phone: draft.phone,
                notes: draft.notes,
                payment_method: draft.payment,
                paid: draft.paid,
                items: cart.lines.map((line) => ({ product_id: line.productId, quantity: line.quantity, add_on_ids: line.addOns.map((addOn) => addOn.id) })),
            },
            {
                preserveScroll: true,
                onStart: () => {
                    setProcessing(true);
                    setErrors({});
                },
                onError: (received) => setErrors(received),
                onSuccess: () => {
                    cart.clear();
                    setDraft(EMPTY_DRAFT);
                    setCartOpen(false);
                    key.current = newKey();
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const startNew = () => router.get('/admin/pos', {}, { replace: true, preserveState: true, preserveScroll: true });

    const panel = (fill: boolean) => (
        <CartPanel
            lines={cart.lines}
            total={cart.total}
            draft={draft}
            onDraft={patchDraft}
            onQuantity={cart.setQuantity}
            onClear={cart.clear}
            onSubmit={submit}
            processing={processing}
            tables={tables}
            errors={errors}
            fill={fill}
        />
    );

    return (
        <>
            <div ref={gridRef} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
                <section aria-label="Menu" className="min-w-0">
                    <div className="grid gap-3 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:items-center">
                        <SearchField label="Cari hidangan" value={query} onChange={setQuery} placeholder="Cari hidangan" />
                        <nav aria-label="Kategori" className="neu-well-sm min-w-0">
                            <div className="no-scrollbar flex gap-1 overflow-x-auto p-2">
                                {[{ id: 'all' as const, name: 'Semua' }, ...categories].map((item) => {
                                    const selected = category === item.id;

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() => setCategory(item.id)}
                                            className={cn(
                                                'h-11 shrink-0 rounded-(--radius-control) px-4 font-semibold whitespace-nowrap transition-[background-color,box-shadow,color] duration-200',
                                                'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink',
                                                selected ? 'bg-panel text-ink shadow-(--shadow-raised-2xs)' : 'text-ink-soft hover:text-ink',
                                            )}
                                        >
                                            {item.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>
                    </div>

                    {sections.length === 0 ? (
                        <EmptyState Icon={MagnifyingGlassIcon} className="mt-6" title="Tiada hidangan sepadan" description="Cuba kata carian lain atau pilih Semua.">
                            <Button
                                variant="soft"
                                size="sm"
                                onClick={() => {
                                    setQuery('');
                                    setCategory('all');
                                }}
                            >
                                Kosongkan
                            </Button>
                        </EmptyState>
                    ) : (
                        <div className="mt-6 grid gap-8 pb-28 xl:pb-6">
                            {sections.map((section) => (
                                <section key={section.id} aria-labelledby={`pos-cat-${section.id}`}>
                                    {(sections.length > 1 || category === 'all') && (
                                        <h2 id={`pos-cat-${section.id}`} className="section-title font-heading text-xl font-extrabold text-ink">
                                            {section.name}
                                        </h2>
                                    )}
                                    <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(9.75rem,1fr))] gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
                                        {section.products.map((product) => (
                                            <ProductTile key={product.id} product={product} inCart={cart.countOf(product.id)} onPick={() => pick(product)} />
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </div>
                    )}
                </section>

                {wide && (
                    <aside ref={cartRef} aria-label="Troli" className="neu-card sticky top-6 hidden h-[max(28rem,calc(100dvh_-_var(--sticky-top,8rem)_-_1.5rem))] p-5 xl:block">
                        {panel(true)}
                    </aside>
                )}
            </div>

            {!wide && (
                <>
                    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 px-4 xl:hidden">
                        <Button variant="amber" size="lg" className="pointer-events-auto mx-auto flex w-full max-w-md justify-between" onClick={() => setCartOpen(true)}>
                            <span className="flex items-center gap-2.5">
                                <ShoppingBagIcon size={22} weight="bold" aria-hidden />
                                {cart.count === 0 ? 'Troli kosong' : `${cart.count} item`}
                            </span>
                            <DigitDisplay value={priceDigits(cart.total)} tone="ink" chip={false} size="md" />
                        </Button>
                    </div>

                    <Sheet open={cartOpen} onClose={() => setCartOpen(false)} title="Pesanan baharu" width="lg">
                        <div className="px-5 pt-1 pb-6 md:px-6">{panel(false)}</div>
                    </Sheet>
                </>
            )}

            <Sheet open={options !== null} onClose={() => setOptions(null)} title={options ? `Tambah ${options.name}` : 'Tambah'} hideTitle>
                {options && <OptionsSheet key={options.id} product={options} onAdd={addFromOptions} />}
            </Sheet>

            <Sheet open={completed !== null} onClose={startNew} title="Pesanan dihantar">
                {completed && <DoneSheet order={completed} onNew={startNew} />}
            </Sheet>
        </>
    );
}

export default function PosIndex(props: PosProps) {
    return (
        <AdminLayout title="Kaunter" wide>
            <p className="-mt-3 mb-5 flex items-center gap-2 text-[15px] text-ink-muted">
                <CashRegisterIcon size={18} weight="bold" aria-hidden />
                Ketik hidangan, pilih meja atau bungkus, terima bayaran. Pesanan terus masuk ke dapur.
            </p>
            <PosScreen {...props} />
        </AdminLayout>
    );
}
