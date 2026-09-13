import { Link, useForm } from '@inertiajs/react';
import { ForkKnifeIcon, PlusIcon, TrashIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { FormEvent } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FormFooter } from '@/components/admin/FormFooter';
import { ImageInput } from '@/components/admin/ImageInput';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import type { AdminProduct, Option } from '@/types';

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
        <div className="grid content-start gap-4 rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-5 sm:p-6 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-ink">Add-on</h2>
                    <p className="mt-0.5 text-sm text-ink-muted">Pilihan tambahan seperti telur atau sambal extra. Kosongkan jika produk ini tiada add-on.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addRow}>
                    <PlusIcon size={16} weight="bold" aria-hidden />
                    Tambah add-on
                </Button>
            </div>

            {rows.length === 0 ? (
                <div className="flex items-center gap-3 rounded-(--radius-control) border-2 border-dashed border-rule-strong px-4 py-3.5 text-sm text-ink-muted">
                    <ForkKnifeIcon size={20} weight="bold" className="shrink-0 text-rule-strong" aria-hidden />
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
                                        className="grid size-12 shrink-0 place-items-center rounded-(--radius-control) text-ink-muted transition-[transform,background-color,color] duration-150 ease-out hover:bg-alert-tint hover:text-alert active:scale-90"
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

export default function ProductForm({ product, categories }: { product: AdminProduct | null; categories: Option[] }) {
    const form = useForm<ProductFields>({
        category_id: product ? String(product.categoryId) : String(categories[0]?.id ?? ''),
        name: product?.name ?? '',
        description: product?.description ?? '',
        price: product ? (product.price / 100).toFixed(2) : '',
        is_available: product?.isAvailable ?? true,
        is_featured: product?.isFeatured ?? false,
        image: null,
        remove_image: false,
        add_ons: (product?.addOns ?? []).map((addOn) => ({ key: newAddOnKey(), id: addOn.id, name: addOn.name, price: (addOn.price / 100).toFixed(2) })),
    });
    const errors = form.errors as Record<string, string | undefined>;

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (product) {
            // Files need multipart POST; Laravel reads the intended verb from _method.
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(`/admin/products/${product.id}`, { forceFormData: true, preserveScroll: true });
        } else {
            form.post('/admin/products', { forceFormData: true, preserveScroll: true });
        }
    };

    if (categories.length === 0) {
        return (
            <AdminLayout title="Tambah produk">
                <div className="border-2 border-dashed border-rule-strong p-8">
                    <p className="text-lg font-semibold">Tambah kategori dahulu</p>
                    <p className="mt-1 text-[15px] text-ink-muted">Setiap produk mesti berada dalam satu kategori, contohnya Nasi atau Minuman.</p>
                    <Link href="/admin/categories/create" className="mt-4 inline-flex h-12 items-center rounded-(--radius-control) bg-ink px-4 font-semibold text-white hover:bg-ink-soft">
                        Tambah kategori
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={product ? `Edit ${product.name}` : 'Tambah produk'}>
            <form onSubmit={submit} noValidate>
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                    <div className="grid content-start gap-5 rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-5 sm:p-6">
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

                    <div className="grid content-start gap-6 rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-5 sm:p-6">
                        <ImageInput
                            label="Gambar"
                            currentUrl={product?.imageUrl ?? null}
                            file={form.data.image}
                            removed={form.data.remove_image}
                            onFileChange={(file) => form.setData('image', file)}
                            onRemovedChange={(removed) => form.setData('remove_image', removed)}
                            error={form.errors.image}
                        />
                        <div className="grid gap-4 border-t border-rule pt-5">
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

                    <AddOnsEditor rows={form.data.add_ons} errors={errors} onChange={(rows) => form.setData('add_ons', rows)} />
                </div>

                <FormFooter cancelHref="/admin/products" processing={form.processing} isDirty={form.isDirty} saveLabel={product ? 'Simpan perubahan' : 'Tambah produk'} />
            </form>
        </AdminLayout>
    );
}
