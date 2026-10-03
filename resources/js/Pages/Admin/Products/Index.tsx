import { Link, router } from '@inertiajs/react';
import { BowlFoodIcon, PencilSimpleIcon, PlusIcon, StarIcon } from '@phosphor-icons/react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmButton } from '@/components/ConfirmButton';
import { Pagination } from '@/components/Pagination';
import { useFilters } from '@/components/admin/useFilters';
import { FoodImage } from '@/components/FoodImage';
import { Button, buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { inputClass } from '@/components/ui/Field';
import { SearchField } from '@/components/ui/SearchField';
import { Switch } from '@/components/ui/Switch';
import { cn, formatPrice } from '@/lib/format';
import type { AdminProduct, Option, Paginated } from '@/types';

type Filters = { q: string; category: string; availability: string };

export default function ProductsIndex({ products, categories, filters: initial }: { products: Paginated<AdminProduct>; categories: Option[]; filters: Filters }) {
    const { filters, set, reset } = useFilters('/admin/products', initial);
    const filtered = Object.values(filters).some((value) => value !== '');

    return (
        <AdminLayout
            title="Produk"
            actions={
                <Link href="/admin/products/create" className={buttonClass()}>
                    <PlusIcon size={18} weight="bold" aria-hidden />
                    Tambah produk
                </Link>
            }
        >
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem_11rem]">
                <SearchField label="Cari produk" value={filters.q} onChange={(value) => set('q', value)} placeholder="Cari nama produk" />
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
                <EmptyState
                    Icon={BowlFoodIcon}
                    className="mt-8"
                    title={filtered ? 'Tiada produk sepadan' : 'Menu masih kosong'}
                    description={filtered ? 'Cuba kata carian lain atau kosongkan tapisan.' : 'Tambah hidangan pertama supaya pelanggan boleh mula memesan.'}
                >
                    {filtered ? (
                        <Button variant="soft" size="sm" onClick={() => reset({ q: '', category: '', availability: '' })}>
                            Kosongkan tapisan
                        </Button>
                    ) : (
                        <Link href="/admin/products/create" className={buttonClass()}>
                            <PlusIcon size={18} weight="bold" aria-hidden />
                            Tambah produk
                        </Link>
                    )}
                </EmptyState>
            ) : (
                <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {products.data.map((product) => (
                        <li key={product.id} className="neu-tile flex flex-col p-2.5 transition-[transform,box-shadow] duration-300 ease-spring [--neu-radius:var(--radius-panel)] hover:-translate-y-1 hover:shadow-(--shadow-raised) motion-reduce:transition-shadow motion-reduce:hover:translate-y-0">
                            <div className="relative overflow-hidden rounded-[calc(var(--radius-panel)-10px)] bg-ground-deep">
                                <FoodImage url={product.imageUrl} alt="" sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 47vw" className={cn('aspect-[4/3] w-full', !product.isAvailable && 'opacity-60 grayscale')} />
                                {product.isFeatured && (
                                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-(--radius-module) bg-amber px-1.5 py-1 text-[11px] font-bold tracking-wide text-ink uppercase shadow-(--shadow-raised-2xs)">
                                        <StarIcon size={11} weight="fill" aria-hidden />
                                        Pilihan
                                    </span>
                                )}
                            </div>
                            <div className="flex min-h-0 flex-1 flex-col gap-3 px-1.5 pt-3.5 pb-1">
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
                                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-ink/10 pt-2.5">
                                    <Link href={`/admin/products/${product.id}/edit`} className={buttonClass({ variant: 'quiet', size: 'sm' })}>
                                        <PencilSimpleIcon size={15} weight="bold" aria-hidden />
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
