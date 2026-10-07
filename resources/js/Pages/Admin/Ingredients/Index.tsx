import { router, useForm, usePage } from '@inertiajs/react';
import { BasketIcon, ClockCounterClockwiseIcon, PencilSimpleIcon, PlusIcon, SlidersHorizontalIcon } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { KpiGrid } from '@/components/admin/KpiGrid';
import { StockBadge } from '@/components/admin/StockBadge';
import { useFilters } from '@/components/admin/useFilters';
import { ConfirmButton } from '@/components/ConfirmButton';
import { DigitDisplay } from '@/components/DigitDisplay';
import { Pagination } from '@/components/Pagination';
import { Sheet } from '@/components/Sheet';
import { Button, buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, inputClass } from '@/components/ui/Field';
import { SearchField } from '@/components/ui/SearchField';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { cn, formatDateTime, formatPrice, priceDigits } from '@/lib/format';
import type { IngredientMovementRow, IngredientRow, Paginated } from '@/types';

type Filters = { q: string; state: string };
type TypeOption = { value: string; label: string };
type Summary = { total: number; low: number; out: number; value: number };

const TABS = [
    { value: '', label: 'Semua' },
    { value: 'low', label: 'Hampir habis' },
    { value: 'out', label: 'Habis' },
];

const QUANTITY_COPY: Record<string, { label: string; hint: string }> = {
    restock: { label: 'Berapa yang masuk', hint: 'Ditambah pada baki sekarang.' },
    usage: { label: 'Berapa yang digunakan', hint: 'Ditolak daripada baki sekarang.' },
    waste: { label: 'Berapa yang terbuang', hint: 'Ditolak daripada baki sekarang.' },
    adjustment: { label: 'Baki sebenar di rak', hint: 'Masukkan hasil kiraan anda. Sistem simpan bezanya.' },
};

/** 2.5 not 2.500, 12 not 12.000. */
const formatAmount = (value: number): string => new Intl.NumberFormat('en', { maximumFractionDigits: 3 }).format(value);

function AdjustForm({ ingredient, types, onDone }: { ingredient: IngredientRow; types: TypeOption[]; onDone: () => void }) {
    const form = useForm({ type: 'restock', quantity: '', unit_cost: (ingredient.unitCost / 100).toFixed(2), note: '' });
    const copy = QUANTITY_COPY[form.data.type];

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({ ...data, unit_cost: data.type === 'restock' ? data.unit_cost : '' }));
        form.post(`/admin/ingredients/${ingredient.id}/adjust`, { preserveScroll: true, onSuccess: onDone });
    };

    return (
        <form onSubmit={submit} className="grid gap-5 px-5 pt-1 pb-6 md:px-6">
            <p className="flex items-center justify-between gap-3 text-[15px] text-ink-soft">
                Baki sekarang
                <DigitDisplay value={`${formatAmount(ingredient.quantity)} ${ingredient.unit}`} size="md" />
            </p>
            <div className="grid gap-1.5">
                <p className="text-[15px] font-semibold text-ink">Apa yang berlaku?</p>
                <SegmentedTabs label="Jenis perubahan bahan" tabs={types} value={form.data.type} onChange={(value) => form.setData('type', value)} />
                {form.errors.type && <p className="text-sm font-semibold text-alert">{form.errors.type}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field id="ing-quantity" label={`${copy.label} (${ingredient.unit})`} hint={copy.hint} error={form.errors.quantity}>
                    {(control) => <input {...control} type="text" inputMode="decimal" value={form.data.quantity} onChange={(event) => form.setData('quantity', event.target.value)} className={cn(inputClass, 'tabular')} required />}
                </Field>
                {form.data.type === 'restock' && (
                    <Field id="ing-cost" label="Harga beli seunit (RM)" hint="Menjadi harga semasa bahan ini." error={form.errors.unit_cost} optional>
                        {(control) => <input {...control} type="text" inputMode="decimal" value={form.data.unit_cost} onChange={(event) => form.setData('unit_cost', event.target.value)} className={cn(inputClass, 'tabular')} />}
                    </Field>
                )}
            </div>
            <Field id="ing-note" label="Catatan" optional error={form.errors.note}>
                {(control) => <input {...control} type="text" maxLength={160} value={form.data.note} onChange={(event) => form.setData('note', event.target.value)} className={inputClass} placeholder="Contoh: beli di pasar borong" />}
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

function IngredientForm({ ingredient, onDone }: { ingredient: IngredientRow | null; onDone: () => void }) {
    const form = useForm({
        name: ingredient?.name ?? '',
        unit: ingredient?.unit ?? 'kg',
        quantity: '',
        unit_cost: ingredient ? (ingredient.unitCost / 100).toFixed(2) : '',
        low_stock_threshold: ingredient ? String(ingredient.lowStockThreshold) : '',
        supplier: ingredient?.supplier ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onDone };

        if (ingredient) {
            form.put(`/admin/ingredients/${ingredient.id}`, options);
        } else {
            form.post('/admin/ingredients', options);
        }
    };

    return (
        <form onSubmit={submit} className="grid gap-5 px-5 pt-1 pb-6 md:px-6">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <Field id="ing-name" label="Nama bahan" error={form.errors.name}>
                    {(control) => <input {...control} type="text" maxLength={80} value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className={inputClass} placeholder="Contoh: Beras wangi" required />}
                </Field>
                <Field id="ing-unit" label="Unit" error={form.errors.unit}>
                    {(control) => <input {...control} type="text" maxLength={20} value={form.data.unit} onChange={(event) => form.setData('unit', event.target.value)} className={inputClass} placeholder="kg" required />}
                </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
                {!ingredient && (
                    <Field id="ing-open" label="Baki sekarang" error={form.errors.quantity} optional>
                        {(control) => <input {...control} type="text" inputMode="decimal" value={form.data.quantity} onChange={(event) => form.setData('quantity', event.target.value)} className={cn(inputClass, 'tabular')} />}
                    </Field>
                )}
                <Field id="ing-price" label="Harga seunit (RM)" error={form.errors.unit_cost} optional>
                    {(control) => <input {...control} type="text" inputMode="decimal" value={form.data.unit_cost} onChange={(event) => form.setData('unit_cost', event.target.value)} className={cn(inputClass, 'tabular')} />}
                </Field>
                <Field id="ing-low" label="Amaran bila baki" error={form.errors.low_stock_threshold} optional>
                    {(control) => <input {...control} type="text" inputMode="decimal" value={form.data.low_stock_threshold} onChange={(event) => form.setData('low_stock_threshold', event.target.value)} className={cn(inputClass, 'tabular')} />}
                </Field>
            </div>
            <Field id="ing-supplier" label="Pembekal" optional error={form.errors.supplier}>
                {(control) => <input {...control} type="text" maxLength={80} value={form.data.supplier} onChange={(event) => form.setData('supplier', event.target.value)} className={inputClass} placeholder="Contoh: Kedai Runcit Pak Din" />}
            </Field>
            <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="quiet" onClick={onDone}>
                    Batal
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {ingredient ? 'Simpan perubahan' : 'Tambah bahan'}
                </Button>
            </div>
        </form>
    );
}

function Movements({ movements }: { movements: IngredientMovementRow[] }) {
    if (movements.length === 0) {
        return <EmptyState Icon={ClockCounterClockwiseIcon} title="Belum ada pergerakan" description="Setiap pembelian, penggunaan dan pembaziran akan tercatat di sini." />;
    }

    return (
        <ul className="grid gap-2.5">
            {movements.map((movement) => (
                <li key={movement.id} className="neu-well-sm flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{movement.ingredientName}</p>
                        <p className="mt-0.5 text-sm text-ink-muted">
                            {movement.typeLabel}
                            {movement.unitCost !== null && <span className="tabular">
                                    , {formatPrice(movement.unitCost)}/{movement.unit}
                                </span>}
                            {movement.orderNumber && <span className="tabular"> {movement.orderNumber}</span>}
                            {movement.userName && `, ${movement.userName}`}
                        </p>
                        {movement.note && <p className="mt-0.5 text-sm text-ink-soft">{movement.note}</p>}
                        <p className="mt-0.5 text-xs text-ink-muted">{formatDateTime(movement.createdAt)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className={cn('font-mono text-lg font-semibold tabular-nums', movement.delta < 0 ? 'text-alert' : 'text-leaf-deep')}>
                            {movement.delta > 0 ? '+' : ''}
                            {formatAmount(movement.delta)}
                        </p>
                        <p className="text-xs text-ink-muted tabular">
                            baki {formatAmount(movement.balanceAfter)} {movement.unit}
                        </p>
                    </div>
                </li>
            ))}
        </ul>
    );
}

type Props = { ingredients: Paginated<IngredientRow>; summary: Summary; movements: IngredientMovementRow[]; filters: Filters; types: TypeOption[] };

export default function IngredientsIndex({ ingredients, summary, movements, filters: initial, types }: Props) {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.role === 'admin';
    const { filters, set, reset } = useFilters('/admin/ingredients', initial);
    const [adjusting, setAdjusting] = useState<IngredientRow | null>(null);
    const [editing, setEditing] = useState<IngredientRow | 'new' | null>(null);
    const filtered = filters.q !== '' || filters.state !== '';

    return (
        <AdminLayout
            title="Stok bahan"
            actions={
                isAdmin && (
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon size={18} weight="bold" aria-hidden />
                        Tambah bahan
                    </Button>
                )
            }
        >
            <p className="-mt-3 max-w-[62ch] text-[15px] text-ink-muted">Bahan di dapur, harganya dan baki. Letak resipi pada setiap hidangan (di borang produk) dan bahan ditolak sendiri bila hidangan dijual. Baki negatif bermakna bahan sudah digunakan tetapi pembelian belum dicatat.</p>

            <div className="mt-6">
                <KpiGrid
                    phoneColumns={2}
                    figures={[
                        { label: 'Jenis bahan', value: String(summary.total) },
                        { label: 'Nilai stok (RM)', value: priceDigits(summary.value) },
                        { label: 'Hampir habis', value: String(summary.low), highlight: summary.low > 0 },
                        { label: 'Habis', value: String(summary.out), highlight: summary.out > 0 },
                    ]}
                />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <SearchField label="Cari bahan" value={filters.q} onChange={(value) => set('q', value)} placeholder="Cari nama bahan" />
                <SegmentedTabs label="Tapis bahan" tabs={TABS} value={filters.state} onChange={(value) => set('state', value)} />
            </div>

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
                <section aria-label="Senarai bahan">
                    {ingredients.data.length === 0 ? (
                        <EmptyState
                            Icon={BasketIcon}
                            title={filtered ? 'Tiada bahan sepadan' : 'Belum ada bahan'}
                            description={filtered ? 'Cuba kata carian lain atau kosongkan tapisan.' : 'Tambah bahan seperti beras, ayam atau santan untuk mula merekod baki dan harga.'}
                        >
                            {filtered ? (
                                <Button variant="soft" size="sm" onClick={() => reset({ q: '', state: '' })}>
                                    Kosongkan tapisan
                                </Button>
                            ) : (
                                isAdmin && (
                                    <Button onClick={() => setEditing('new')}>
                                        <PlusIcon size={18} weight="bold" aria-hidden />
                                        Tambah bahan
                                    </Button>
                                )
                            )}
                        </EmptyState>
                    ) : (
                        <ul className="grid gap-3">
                            {ingredients.data.map((ingredient) => (
                                <li key={ingredient.id} className="neu-tile flex flex-wrap items-center gap-x-4 gap-y-3 p-3.5 [--neu-radius:var(--radius-panel)] sm:flex-nowrap">
                                    <div className="min-w-0 flex-1 basis-40">
                                        <p className="truncate font-semibold text-ink">{ingredient.name}</p>
                                        <p className="truncate text-sm text-ink-muted">
                                            <span className="tabular">{formatPrice(ingredient.unitCost)}</span> / {ingredient.unit}
                                            {ingredient.supplier && `, ${ingredient.supplier}`}
                                        </p>
                                        {ingredient.dishCount > 0 && <p className="text-sm text-ink-soft">Dalam resipi {ingredient.dishCount} hidangan</p>}
                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <StockBadge state={ingredient.stockState} />
                                            <span className="text-xs text-ink-muted tabular">Bernilai {formatPrice(ingredient.stockValue)}</span>
                                        </div>
                                    </div>
                                    <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
                                        <DigitDisplay
                                            value={`${formatAmount(ingredient.quantity)} ${ingredient.unit}`}
                                            size="md"
                                            label={`Baki ${ingredient.name}: ${formatAmount(ingredient.quantity)} ${ingredient.unit}`}
                                            tone={ingredient.stockState === 'out' && ingredient.quantity === 0 ? 'dim' : 'amber'}
                                        />
                                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                                            {isAdmin && (
                                                <button type="button" onClick={() => setEditing(ingredient)} className={buttonClass({ variant: 'quiet', size: 'sm' })}>
                                                    <PencilSimpleIcon size={15} weight="bold" aria-hidden />
                                                    Edit
                                                    <span className="sr-only"> {ingredient.name}</span>
                                                </button>
                                            )}
                                            <button type="button" onClick={() => setAdjusting(ingredient)} className={buttonClass({ variant: 'soft', size: 'sm' })}>
                                                <SlidersHorizontalIcon size={15} weight="bold" aria-hidden />
                                                Kemas kini
                                                <span className="sr-only"> baki {ingredient.name}</span>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Pagination page={ingredients} />
                </section>

                <aside aria-labelledby="pergerakan-bahan-tajuk" className="neu-card p-5">
                    <h2 id="pergerakan-bahan-tajuk" className="text-lg font-bold text-ink">
                        Pergerakan terkini
                    </h2>
                    <div className="mt-4">
                        <Movements movements={movements} />
                    </div>
                </aside>
            </div>

            <Sheet open={adjusting !== null} onClose={() => setAdjusting(null)} title={adjusting ? `Baki ${adjusting.name}` : 'Baki'}>
                {adjusting && <AdjustForm key={adjusting.id} ingredient={adjusting} types={types} onDone={() => setAdjusting(null)} />}
            </Sheet>

            <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Tambah bahan' : editing ? `Edit ${editing.name}` : 'Bahan'} width="lg">
                {editing && (
                    <>
                        <IngredientForm key={editing === 'new' ? 'new' : editing.id} ingredient={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
                        {editing !== 'new' && (
                            <div className="flex justify-start border-t border-ink/10 px-5 py-4 md:px-6">
                                <ConfirmButton
                                    label="Padam bahan"
                                    title={`Padam ${editing.name}?`}
                                    message="Bahan dan sejarah pergerakannya dibuang, dan ia keluar dari resipi hidangan yang menggunakannya."
                                    confirmLabel="Ya, padam"
                                    onConfirm={() => router.delete(`/admin/ingredients/${editing.id}`, { preserveScroll: true, onSuccess: () => setEditing(null) })}
                                />
                            </div>
                        )}
                    </>
                )}
            </Sheet>
        </AdminLayout>
    );
}
