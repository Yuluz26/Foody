import { Link, router } from '@inertiajs/react';
import { BowlFoodIcon, MagnifyingGlassIcon, PencilSimpleIcon, PlusIcon, StarIcon } from '@phosphor-icons/react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmButton } from '@/components/ConfirmButton';
import { Pagination } from '@/components/Pagination';
import { useFilters } from '@/components/admin/useFilters';
import { FoodImage } from '@/components/FoodImage';
import { Button } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/Field';
import { Switch } from '@/components/ui/Switch';
import { cn, formatPrice } from '@/lib/format';
import type { AdminProduct, Option, Paginated } from '@/types';

type Filters = { q: string; category: string; availability: string };

const addLinkClass =
    'flex h-12 items-center gap-2 rounded-(--radius-control) bg-ink px-4 font-semibold text-white transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:bg-ink-soft hover:shadow-(--shadow-lift) active:translate-y-0 active:scale-[0.97]';

export default function ProductsIndex({ products, categories, filters: initial }: { products: Paginated<AdminProduct>; categories: Option[]; filters: Filters }) {
    const { filters, set, reset } = useFilters('/admin/products', initial);
    const filtered = Object.values(filters).some((value) => value !== '');

    return (
        <AdminLayout
            title="Produk"
            actions={
                <Link href="/admin/products/create" className={addLinkClass}>
                    <PlusIcon size={18} weight="bold" aria-hidden />
                    Tambah produk
                </Link>
            }
        >
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem_11rem]">
                <label className="relative block">
                    <span className="sr-only">Cari produk</span>
                    <MagnifyingGlassIcon size={20} weight="bold" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" aria-hidden />
                    <input type="search" value={filters.q} onChange={(event) => set('q', event.target.value)} placeholder="Cari nama produk" className={cn(inputClass, 'pl-10')} />
                </label>
                <label className="block">
                    <span className="sr-only">Kategori</span>
                    <select value={filters.category} onChange={(event) => set('category', event.target.value)} className={inputClass}>
                        <option value="">Semua kategori</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="sr-only">Ketersediaan</span>
                    <select value={filters.availability} onChange={(event) => set('availability', event.target.value)} className={inputClass}>
                        <option value="">Semua</option>
                        <option value="available">Ada dijual</option>
                        <option value="unavailable">Habis</option>
                    </select>
                </label>
            </div>

            {products.data.length === 0 ? (
                <div className="mt-8 flex flex-col items-start gap-4 rounded-(--radius-panel) border-2 border-dashed border-rule-strong p-8">
                    <BowlFoodIcon size={36} weight="bold" className="text-rule-strong" aria-hidden />
                    <div>
                        <p className="text-lg font-semibold">{filtered ? 'Tiada produk sepadan' : 'Menu masih kosong'}</p>
                        <p className="text-[15px] text-ink-muted">{filtered ? 'Cuba kata carian lain atau kosongkan tapisan.' : 'Tambah hidangan pertama supaya pelanggan boleh mula memesan.'}</p>
                    </div>
                    {filtered ? (
                        <Button variant="outline" size="sm" onClick={() => reset({ q: '', category: '', availability: '' })}>
                            Kosongkan tapisan
                        </Button>
                    ) : (
                        <Link href="/admin/products/create" className={addLinkClass}>
                            <PlusIcon size={18} weight="bold" aria-hidden />
                            Tambah produk
                        </Link>
                    )}
                </div>
            ) : (
                <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {products.data.map((product) => (
                        <li key={product.id} className="flex flex-col overflow-hidden rounded-(--radius-panel) border-2 border-rule-strong bg-panel transition-colors duration-150 hover:border-ink">
                            <div className="relative">
                                <FoodImage url={product.imageUrl} alt="" sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 47vw" className={cn('aspect-[4/3] w-full', !product.isAvailable && 'opacity-60 grayscale')} />
                                {product.isFeatured && (
                                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-(--radius-module) bg-amber px-1.5 py-1 text-[11px] font-bold tracking-wide text-ink uppercase">
                                        <StarIcon size={11} weight="fill" aria-hidden />
                                        Pilihan
                                    </span>
                                )}
                            </div>
                            <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-3.5">
                                <div className="min-w-0">
                                    <Link href={`/admin/products/${product.id}/edit`} className="block truncate font-semibold hover:text-ink-soft hover:underline">
                                        {product.name}
                                    </Link>
                                    <p className="mt-0.5 flex items-center justify-between gap-2 text-sm text-ink-muted">
                                        <span className="truncate">{product.categoryName}</span>
                                        <span className="font-mono shrink-0 font-semibold text-ink tabular-nums">{formatPrice(product.price)}</span>
                                    </p>
                                </div>
                                <Switch
                                    checked={product.isAvailable}
                                    label="Ada dijual"
                                    onChange={() => router.patch(`/admin/products/${product.id}/toggle`, {}, { preserveScroll: true })}
                                />
                                <div className="mt-auto flex items-center justify-between gap-2 border-t border-rule pt-2.5">
                                    <Link href={`/admin/products/${product.id}/edit`} className="group flex h-9 items-center gap-1.5 rounded-(--radius-control) px-2 text-sm font-semibold transition-colors duration-150 hover:bg-rule/60">
                                        <PencilSimpleIcon size={15} weight="bold" aria-hidden className="transition-transform duration-150 ease-out group-hover:-rotate-12" />
                                        Edit
                                    </Link>
                                    <ConfirmButton
                                        label="Padam"
                                        size="sm"
                                        title={`Padam ${product.name}?`}
                                        message="Produk akan dibuang dari menu. Pesanan lama kekal dengan nama dan harga asal."
                                        confirmLabel="Ya, padam"
                                        onConfirm={() => router.delete(`/admin/products/${product.id}`, { preserveScroll: true })}
                                    />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Pagination page={products} />
        </AdminLayout>
    );
}
