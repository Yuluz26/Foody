import { Link, useForm } from '@inertiajs/react';
import { ClockCounterClockwiseIcon, PackageIcon, SlidersHorizontalIcon } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { KpiGrid } from '@/components/admin/KpiGrid';
import { StockBadge } from '@/components/admin/StockBadge';
import { useFilters } from '@/components/admin/useFilters';
import { DigitDisplay } from '@/components/DigitDisplay';
import { FoodImage } from '@/components/FoodImage';
import { Pagination } from '@/components/Pagination';
import { Sheet } from '@/components/Sheet';
import { Button, buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, inputClass } from '@/components/ui/Field';
import { SearchField } from '@/components/ui/SearchField';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { cn, formatDateTime } from '@/lib/format';
import type { Paginated, StockMovementRow, StockRow } from '@/types';

type Filters = { q: string; state: string };
type TypeOption = { value: string; label: string };
type Summary = { tracked: number; low: number; out: number; untracked: number };

const TABS = [
    { value: '', label: 'Semua' },
    { value: 'low', label: 'Hampir habis' },
    { value: 'out', label: 'Habis' },
];

/** What the number in the form means changes with the type, so the label and hint follow it. */
const QUANTITY_COPY: Record<string, { label: string; hint: string }> = {
    restock: { label: 'Berapa yang masuk', hint: 'Ditambah pada baki sekarang.' },
    waste: { label: 'Berapa yang terbuang', hint: 'Ditolak daripada baki sekarang.' },
    adjustment: { label: 'Baki sebenar di rak', hint: 'Masukkan hasil kiraan anda. Sistem simpan bezanya.' },
};

function AdjustForm({ product, types, onDone }: { product: StockRow; types: TypeOption[]; onDone: () => void }) {
    const form = useForm({ type: 'restock', quantity: '', note: '' });
    const copy = QUANTITY_COPY[form.data.type];

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/admin/stock/${product.id}`, { preserveScroll: true, onSuccess: onDone });
    };

    return (
        <form onSubmit={submit} className="grid gap-5 px-5 pt-1 pb-6 md:px-6">
            <p className="flex items-center justify-between gap-3 text-[15px] text-ink-soft">
                Baki sekarang
                <DigitDisplay value={String(product.stockQuantity)} size="md" />
            </p>
            <div className="grid gap-1.5">
                <p className="text-[15px] font-semibold text-ink">Apa yang berlaku?</p>
                <SegmentedTabs label="Jenis perubahan stok" tabs={types} value={form.data.type} onChange={(value) => form.setData('type', value)} />
                {form.errors.type && <p className="text-sm font-semibold text-alert">{form.errors.type}</p>}
            </div>
            <Field id="stock-quantity" label={copy.label} hint={copy.hint} error={form.errors.quantity}>
                {(control) => (
                    <input
                        {...control}
                        type="number"
                        inputMode="numeric"
                        min={form.data.type === 'adjustment' ? 0 : 1}
                        step={1}
                        value={form.data.quantity}
                        onChange={(event) => form.setData('quantity', event.target.value)}
                        className={cn(inputClass, 'max-w-40 tabular')}
                        required
                    />
                )}
            </Field>
            <Field id="stock-note" label="Catatan" optional error={form.errors.note}>
                {(control) => <input {...control} type="text" maxLength={160} value={form.data.note} onChange={(event) => form.setData('note', event.target.value)} className={inputClass} placeholder="Contoh: beli di pasar pagi" />}
            </Field>
            <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="quiet" onClick={onDone}>
                    Batal
                </Button>
                <Button type="submit" disabled={form.processing}>
                    Simpan
                </Button>
            </div>
        </form>
    );
}

function Movements({ movements }: { movements: StockMovementRow[] }) {
    if (movements.length === 0) {
        return <EmptyState Icon={ClockCounterClockwiseIcon} title="Belum ada pergerakan" description="Setiap tambah stok, pembaziran dan jualan akan tercatat di sini." />;
    }

    return (
        <ul className="grid gap-2.5">
            {movements.map((movement) => (
                <li key={movement.id} className="neu-well-sm flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{movement.productName}</p>
                        <p className="mt-0.5 text-sm text-ink-muted">
                            {movement.typeLabel}
                            {movement.orderNumber && <span className="tabular"> {movement.orderNumber}</span>}
                            {movement.userName && `, ${movement.userName}`}
                        </p>
                        {movement.note && <p className="mt-0.5 text-sm text-ink-soft">{movement.note}</p>}
                        <p className="mt-0.5 text-xs text-ink-muted">{formatDateTime(movement.createdAt)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className={cn('font-mono text-lg font-semibold tabular-nums', movement.delta < 0 ? 'text-alert' : 'text-leaf-deep')}>
                            {movement.delta > 0 ? '+' : ''}
                            {movement.delta}
                        </p>
                        <p className="text-xs text-ink-muted tabular">baki {movement.balanceAfter}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
}

export default function StockIndex({ products, summary, movements, filters: initial, types }: { products: Paginated<StockRow>; summary: Summary; movements: StockMovementRow[]; filters: Filters; types: TypeOption[] }) {
    const { filters, set, reset } = useFilters('/admin/stock', initial);
    const [editing, setEditing] = useState<StockRow | null>(null);
    const filtered = filters.q !== '' || filters.state !== '';

    return (
        <AdminLayout title="Stok">
            <p className="-mt-3 max-w-[60ch] text-[15px] text-ink-muted">Baki setiap hidangan yang dijejak. Stok ditolak sendiri bila pesanan masuk dan dipulangkan bila pesanan dibatalkan.</p>

            <div className="mt-6">
                <KpiGrid
                    figures={[
                        { label: 'Hidangan dijejak', value: String(summary.tracked) },
                        { label: 'Hampir habis', value: String(summary.low), highlight: summary.low > 0 },
                        { label: 'Habis', value: String(summary.out), highlight: summary.out > 0 },
                    ]}
                />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <SearchField label="Cari produk" value={filters.q} onChange={(value) => set('q', value)} placeholder="Cari nama produk" />
                <SegmentedTabs label="Tapis stok" tabs={TABS} value={filters.state} onChange={(value) => set('state', value)} />
            </div>

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
                <section aria-label="Senarai stok">
                    {products.data.length === 0 ? (
                        <EmptyState
                            Icon={PackageIcon}
                            title={filtered ? 'Tiada produk sepadan' : 'Belum ada hidangan dijejak'}
                            description={filtered ? 'Cuba kata carian lain atau kosongkan tapisan.' : `Hidupkan "Jejak stok" pada borang produk untuk mula. ${summary.untracked} produk belum dijejak.`}
                        >
                            {filtered ? (
                                <Button variant="soft" size="sm" onClick={() => reset({ q: '', state: '' })}>
                                    Kosongkan tapisan
                                </Button>
                            ) : (
                                <Link href="/admin/products" className={buttonClass()}>
                                    Ke senarai produk
                                </Link>
                            )}
                        </EmptyState>
                    ) : (
                        <ul className="grid gap-3">
                            {products.data.map((product) => (
                                <li key={product.id} className="neu-tile flex flex-wrap items-center gap-x-3 gap-y-3 p-2.5 [--neu-radius:var(--radius-panel)] sm:flex-nowrap sm:gap-4">
                                    <FoodImage url={product.imageUrl} alt="" sizes="80px" className="size-16 shrink-0 rounded-(--radius-control) sm:size-20" />
                                    <div className="min-w-0 flex-1 basis-32">
                                        <p className="truncate font-semibold text-ink">{product.name}</p>
                                        <p className="truncate text-sm text-ink-muted">{product.categoryName}</p>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <StockBadge state={product.stockState} />
                                            <span className="text-xs text-ink-muted">Amaran di {product.lowStockThreshold}</span>
                                        </div>
                                    </div>
                                    <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
                                        <DigitDisplay value={String(product.stockQuantity)} size="md" label={`Baki ${product.name}: ${product.stockQuantity}`} tone={product.stockState === 'out' ? 'dim' : 'amber'} />
                                        <button type="button" onClick={() => setEditing(product)} className={buttonClass({ variant: 'soft', size: 'sm' })}>
                                            <SlidersHorizontalIcon size={15} weight="bold" aria-hidden />
                                            Kemas kini
                                            <span className="sr-only"> stok {product.name}</span>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Pagination page={products} />
                </section>

                <aside aria-labelledby="pergerakan-tajuk" className="neu-card p-5">
                    <h2 id="pergerakan-tajuk" className="text-lg font-bold text-ink">
                        Pergerakan terkini
                    </h2>
                    <div className="mt-4">
                        <Movements movements={movements} />
                    </div>
                </aside>
            </div>

            <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing ? `Stok ${editing.name}` : 'Stok'}>
                {editing && <AdjustForm key={editing.id} product={editing} types={types} onDone={() => setEditing(null)} />}
            </Sheet>
        </AdminLayout>
    );
}
