import { Link, useForm } from '@inertiajs/react';
import { ForkKnifeIcon, PlusIcon, SquaresFourIcon, TrashIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { FormEvent } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FormFooter } from '@/components/admin/FormFooter';
import { ImageInput } from '@/components/admin/ImageInput';
import { newRecipeKey, RecipeEditor, type RecipeField } from '@/components/admin/RecipeEditor';
import { Button, buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, inputClass } from '@/components/ui/Field';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import type { AdminProduct, IngredientOption, Option } from '@/types';

type AddOnField = {
    /** Client-only, so React and the row-removal logic have a stable key even before the row is saved. */
    key: string;
    id: number | null;
    name: string;
    price: string;
};

type ProductFields = {
    category_id: string;
    name: string;
    description: string;
    price: string;
    is_available: boolean;
    is_featured: boolean;
    track_stock: boolean;
    stock_quantity: string;
    low_stock_threshold: string;
    recipe: RecipeField[];
    image: File | null;
    remove_image: boolean;
    add_ons: AddOnField[];
};

function newAddOnKey(): string {
    return typeof window !== 'undefined' && window.crypto?.randomUUID ? window.crypto.randomUUID() : `new-${Math.random().toString(36).slice(2)}`;
}

function AddOnsEditor({ rows, errors, onChange }: { rows: AddOnField[]; errors: Record<string, string | undefined>; onChange: (rows: AddOnField[]) => void }) {
    const reduce = useReducedMotion();
    const addRow = () => onChange([...rows, { key: newAddOnKey(), id: null, name: '', price: '' }]);
    const updateRow = (key: string, patch: Partial<AddOnField>) => onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    const removeRow = (key: string) => onChange(rows.filter((row) => row.key !== key));

    return (
        <div className="neu-card grid content-start gap-4 p-5 sm:p-6 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-ink">Add-on</h2>
                    <p className="mt-0.5 text-sm text-ink-muted">Pilihan tambahan seperti telur atau sambal extra. Kosongkan jika produk ini tiada add-on.</p>
                </div>
                <Button type="button" variant="soft" size="sm" onClick={addRow}>
                    <PlusIcon size={16} weight="bold" aria-hidden />
                    Tambah add-on
                </Button>
            </div>

            {rows.length === 0 ? (
                <div className="neu-well-sm flex items-center gap-3 px-4 py-3.5 text-sm text-ink-muted">
                    <ForkKnifeIcon size={20} weight="bold" className="shrink-0" aria-hidden />
                    Tiada add-on lagi. Produk ini akan dipaparkan tanpa pilihan tambahan di panel pelanggan.
                </div>
            ) : (
                <ul className="grid gap-3">
                    <AnimatePresence initial={false}>
                        {rows.map((row, index) => {
                            const nameError = errors[`add_ons.${index}.name`];
                            const priceError = errors[`add_ons.${index}.price`];

                            return (
                                <motion.li
                                    key={row.key}
                                    layout={reduce ? false : 'position'}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, transition: { duration: duration.exit } }}
                                    transition={{ duration: duration.base, ease: ease.out }}
                                    className="grid grid-cols-[minmax(0,1fr)_8rem_auto] items-start gap-2.5"
                                >
                                    <div>
                                        <label htmlFor={`add-on-name-${row.key}`} className="sr-only">
                                            Nama add-on {index + 1}
                                        </label>
                                        <input
                                            id={`add-on-name-${row.key}`}
                                            type="text"
                                            maxLength={60}
                                            placeholder="Contoh: Telur"
                                            value={row.name}
                                            onChange={(event) => updateRow(row.key, { name: event.target.value })}
                                            aria-invalid={nameError ? true : undefined}
                                            className={inputClass}
                                        />
                                        {nameError && (
                                            <p className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-alert">
                                                <WarningCircleIcon size={16} weight="bold" className="mt-px shrink-0" aria-hidden />
                                                {nameError}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor={`add-on-price-${row.key}`} className="sr-only">
                                            Harga add-on {index + 1}
                                        </label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-ink-muted" aria-hidden>
                                                RM
                                            </span>
                                            <input
                                                id={`add-on-price-${row.key}`}
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="0.00"
                                                value={row.price}
                                                onChange={(event) => updateRow(row.key, { price: event.target.value.replace(',', '.') })}
                                                aria-invalid={priceError ? true : undefined}
                                                className={cn(inputClass, 'tabular pl-9')}
                                            />
                                        </div>
                                        {priceError && (
                                            <p className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-alert">
                                                <WarningCircleIcon size={16} weight="bold" className="mt-px shrink-0" aria-hidden />
                                                {priceError}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeRow(row.key)}
                                        aria-label={`Buang add-on ${row.name || index + 1}`}
                                        className={buttonClass({ variant: 'quiet', icon: true, className: 'hover:text-alert' })}
                                    >
                                        <TrashIcon size={18} weight="bold" aria-hidden />
                                    </button>
                                </motion.li>
                            );
                        })}
                    </AnimatePresence>
                </ul>
            )}
        </div>
    );
}

type StockPanelProps = {
    product: AdminProduct | null;
    tracked: boolean;
    quantity: string;
    threshold: string;
    errors: Record<string, string | undefined>;
    onTrackedChange: (checked: boolean) => void;
    onQuantityChange: (value: string) => void;
    onThresholdChange: (value: string) => void;
};

/** Opening count only while tracking is being switched on; after that every change goes through the Stok page so it is logged. */
function StockPanel({ product, tracked, quantity, threshold, errors, onTrackedChange, onQuantityChange, onThresholdChange }: StockPanelProps) {
    const alreadyTracked = product?.trackStock ?? false;

    return (
        <div className="neu-card grid content-start gap-5 p-5 sm:p-6 lg:col-span-2">
            <Switch
                checked={tracked}
                onChange={onTrackedChange}
                label="Jejak stok"
                description="Baki ditolak sendiri bila pesanan masuk. Bila sampai kosong, hidangan ditanda habis dengan sendirinya."
            />
            {tracked && (
                <div className="grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-2">
                    {alreadyTracked ? (
                        <div className="grid content-start gap-1.5">
                            <p className="text-[15px] font-semibold text-ink">Baki sekarang</p>
                            <p className="font-mono text-2xl font-semibold text-ink tabular-nums">{product?.stockQuantity}</p>
                            <Link href="/admin/stock" className="inline-flex min-h-10 w-fit items-center text-sm font-semibold text-ink-soft underline-offset-2 hover:underline">
                                Tambah atau betulkan di halaman Stok
                            </Link>
                        </div>
                    ) : (
                        <Field id="stock_quantity" label="Baki permulaan" hint="Berapa yang ada sekarang." error={errors.stock_quantity}>
                            {(control) => <input {...control} type="number" inputMode="numeric" min={0} step={1} value={quantity} onChange={(event) => onQuantityChange(event.target.value)} className={cn(inputClass, 'max-w-40 tabular')} />}
                        </Field>
                    )}
                    <Field id="low_stock_threshold" label="Beri amaran bila baki" hint="Hidangan muncul sebagai hampir habis pada atau bawah angka ini." error={errors.low_stock_threshold}>
                        {(control) => <input {...control} type="number" inputMode="numeric" min={0} step={1} value={threshold} onChange={(event) => onThresholdChange(event.target.value)} className={cn(inputClass, 'max-w-40 tabular')} />}
                    </Field>
                </div>
            )}
        </div>
    );
}

export default function ProductForm({ product, categories, ingredients }: { product: AdminProduct | null; categories: Option[]; ingredients: IngredientOption[] }) {
    const form = useForm<ProductFields>({
        category_id: product ? String(product.categoryId) : String(categories[0]?.id ?? ''),
        name: product?.name ?? '',
        description: product?.description ?? '',
        price: product ? (product.price / 100).toFixed(2) : '',
        is_available: product?.isAvailable ?? true,
        is_featured: product?.isFeatured ?? false,
        track_stock: product?.trackStock ?? false,
        stock_quantity: '',
        low_stock_threshold: String(product?.lowStockThreshold ?? 5),
        recipe: (product?.recipe ?? []).map((line) => ({ key: newRecipeKey(), ingredientId: String(line.ingredientId), quantity: String(line.quantity) })),
        image: null,
        remove_image: false,
        add_ons: (product?.addOns ?? []).map((addOn) => ({ key: newAddOnKey(), id: addOn.id, name: addOn.name, price: (addOn.price / 100).toFixed(2) })),
    });
    const errors = form.errors as Record<string, string | undefined>;

    const submit = (event: FormEvent) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            recipe: data.recipe.map((row) => ({ ingredient_id: row.ingredientId, quantity: row.quantity })),
            // Files need multipart POST; Laravel reads the intended verb from _method.
            ...(product ? { _method: 'put' } : {}),
        }));

        form.post(product ? `/admin/products/${product.id}` : '/admin/products', { forceFormData: true, preserveScroll: true });
    };

    if (categories.length === 0) {
        return (
            <AdminLayout title="Tambah produk">
                <EmptyState Icon={SquaresFourIcon} title="Tambah kategori dahulu" description="Setiap produk mesti berada dalam satu kategori, contohnya Nasi atau Minuman.">
                    <Link href="/admin/categories/create" className={buttonClass()}>
                        Tambah kategori
                    </Link>
                </EmptyState>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={product ? `Edit ${product.name}` : 'Tambah produk'}>
            <form onSubmit={submit} noValidate>
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                    <div className="neu-card grid content-start gap-5 p-5 sm:p-6">
                        <Field id="name" label="Nama produk" error={form.errors.name}>
                            {(control) => (
                                <input {...control} type="text" maxLength={120} value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className={inputClass} />
                            )}
                        </Field>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field id="category_id" label="Kategori" error={form.errors.category_id}>
                                {(control) => (
                                    <select {...control} value={form.data.category_id} onChange={(event) => form.setData('category_id', event.target.value)} className={inputClass}>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </Field>
                            <Field id="price" label="Harga (RM)" error={form.errors.price} hint="Contoh: 12.50">
                                {(control) => (
                                    <div className="relative">
                                        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-semibold text-ink-muted" aria-hidden>
                                            RM
                                        </span>
                                        <input
                                            {...control}
                                            type="text"
                                            inputMode="decimal"
                                            value={form.data.price}
                                            onChange={(event) => form.setData('price', event.target.value.replace(',', '.'))}
                                            className={cn(inputClass, 'tabular pl-12')}
                                        />
                                    </div>
                                )}
                            </Field>
                        </div>
                        <Field id="description" label="Penerangan" optional error={form.errors.description} hint="Satu atau dua ayat tentang bahan dan rasa.">
                            {(control) => (
                                <textarea
                                    {...control}
                                    rows={3}
                                    maxLength={500}
                                    value={form.data.description}
                                    onChange={(event) => form.setData('description', event.target.value)}
                                    className={cn(inputClass, 'resize-y')}
                                />
                            )}
                        </Field>
                    </div>

                    <div className="neu-card grid content-start gap-6 p-5 sm:p-6">
                        <ImageInput
                            label="Gambar"
                            currentUrl={product?.imageUrl ?? null}
                            file={form.data.image}
                            removed={form.data.remove_image}
                            onFileChange={(file) => form.setData('image', file)}
                            onRemovedChange={(removed) => form.setData('remove_image', removed)}
                            error={form.errors.image}
                        />
                        <div className="grid gap-4 border-t border-ink/10 pt-5">
                            <Switch
                                checked={form.data.is_available}
                                onChange={(checked) => form.setData('is_available', checked)}
                                label="Ada dijual"
                                description="Matikan apabila hidangan habis. Pelanggan masih nampak, tetapi tidak boleh pesan."
                            />
                            <Switch
                                checked={form.data.is_featured}
                                onChange={(checked) => form.setData('is_featured', checked)}
                                label="Hidangan pilihan"
                                description="Dipaparkan dengan foto besar di atas kategorinya."
                            />
                        </div>
                    </div>

                    <StockPanel
                        product={product}
                        tracked={form.data.track_stock}
                        quantity={form.data.stock_quantity}
                        threshold={form.data.low_stock_threshold}
                        errors={errors}
                        onTrackedChange={(checked) => form.setData('track_stock', checked)}
                        onQuantityChange={(value) => form.setData('stock_quantity', value)}
                        onThresholdChange={(value) => form.setData('low_stock_threshold', value)}
                    />

                    <RecipeEditor
                        rows={form.data.recipe}
                        ingredients={ingredients}
                        priceInSen={Math.round((Number.parseFloat(form.data.price) || 0) * 100)}
                        errors={errors}
                        onChange={(rows) => form.setData('recipe', rows)}
                    />

                    <AddOnsEditor rows={form.data.add_ons} errors={errors} onChange={(rows) => form.setData('add_ons', rows)} />
                </div>

                <FormFooter cancelHref="/admin/products" processing={form.processing} isDirty={form.isDirty} saveLabel={product ? 'Simpan perubahan' : 'Tambah produk'} />
            </form>
        </AdminLayout>
    );
}
