import { Link, router } from '@inertiajs/react';
import { ArrowDownIcon, ArrowUpIcon, PencilSimpleIcon, PlusIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmButton } from '@/components/ConfirmButton';
import { DigitDisplay } from '@/components/DigitDisplay';
import { FoodImage } from '@/components/FoodImage';
import { Switch } from '@/components/ui/Switch';
import { digitCode } from '@/lib/format';
import type { AdminCategory } from '@/types';

const addLinkClass =
    'flex h-12 items-center gap-2 rounded-(--radius-control) bg-ink px-4 font-semibold text-white transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:bg-ink-soft hover:shadow-(--shadow-lift) active:translate-y-0 active:scale-[0.97]';

const moveButtonClass =
    'grid size-10 place-items-center rounded-(--radius-control) border-2 border-rule-strong transition-[transform,background-color,color] duration-150 hover:scale-110 hover:bg-ink hover:text-white active:scale-90 disabled:cursor-not-allowed disabled:border-rule disabled:text-rule-strong disabled:hover:scale-100 disabled:hover:bg-transparent';

export default function CategoriesIndex({ categories }: { categories: AdminCategory[] }) {
    const move = (index: number, direction: -1 | 1) => {
        const ids = categories.map((category) => category.id);
        const target = index + direction;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        router.patch('/admin/categories/reorder', { ids }, { preserveScroll: true });
    };

    return (
        <AdminLayout
            title="Kategori"
            actions={
                <Link href="/admin/categories/create" className={addLinkClass}>
                    <PlusIcon size={18} weight="bold" aria-hidden />
                    Tambah kategori
                </Link>
            }
        >
            <p className="-mt-2 max-w-[65ch] text-[15px] text-ink-muted">
                Susunan di sini menentukan susunan di menu pelanggan, dan nombor hidangan (01, 02...) mengikutnya. Kategori yang masih ada produk tidak boleh dipadam.
            </p>

            {categories.length === 0 ? (
                <div className="mt-8 flex flex-col items-start gap-4 rounded-(--radius-panel) border-2 border-dashed border-rule-strong p-8">
                    <SquaresFourIcon size={36} weight="bold" className="text-rule-strong" aria-hidden />
                    <div>
                        <p className="text-lg font-semibold">Belum ada kategori</p>
                        <p className="text-[15px] text-ink-muted">Mulakan dengan kumpulan seperti Nasi, Mi dan Minuman.</p>
                    </div>
                    <Link href="/admin/categories/create" className={addLinkClass}>
                        <PlusIcon size={18} weight="bold" aria-hidden />
                        Tambah kategori
                    </Link>
                </div>
            ) : (
                <ol className="mt-6 divide-y divide-rule border-y border-rule bg-panel">
                    {categories.map((category, index) => {
                        const count = category.productsCount ?? 0;

                        return (
                            <li
                                key={category.id}
                                className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-4 py-4 transition-colors duration-150 hover:bg-ground sm:grid-cols-[3rem_4rem_minmax(0,1fr)_13rem_auto] sm:px-5"
                            >
                                <DigitDisplay value={digitCode(index)} size="sm" />
                                <FoodImage url={category.imageUrl} alt="" sizes="64px" className="hidden size-16 rounded-(--radius-module) sm:block" />
                                <div className="min-w-0">
                                    <Link href={`/admin/categories/${category.id}/edit`} className="font-semibold hover:text-ink-soft hover:underline">
                                        {category.name}
                                    </Link>
                                    <p className="text-sm text-ink-muted">{count} produk</p>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <Switch
                                        checked={category.isActive}
                                        label="Dipaparkan"
                                        onChange={() => router.patch(`/admin/categories/${category.id}/toggle`, {}, { preserveScroll: true })}
                                    />
                                </div>
                                <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
                                    <button type="button" className={moveButtonClass} disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Naikkan ${category.name}`}>
                                        <ArrowUpIcon size={16} weight="bold" aria-hidden />
                                    </button>
                                    <button type="button" className={moveButtonClass} disabled={index === categories.length - 1} onClick={() => move(index, 1)} aria-label={`Turunkan ${category.name}`}>
                                        <ArrowDownIcon size={16} weight="bold" aria-hidden />
                                    </button>
                                    <Link href={`/admin/categories/${category.id}/edit`} className="group flex h-10 items-center gap-1.5 rounded-(--radius-control) px-3 text-sm font-semibold transition-colors duration-150 hover:bg-rule/60">
                                        <PencilSimpleIcon size={16} weight="bold" aria-hidden className="transition-transform duration-150 ease-out group-hover:-rotate-12" />
                                        Edit
                                    </Link>
                                    <ConfirmButton
                                        label="Padam"
                                        disabled={count > 0}
                                        title={`Padam ${category.name}?`}
                                        message="Kategori kosong ini akan dibuang dari menu."
                                        confirmLabel="Ya, padam"
                                        onConfirm={() => router.delete(`/admin/categories/${category.id}`, { preserveScroll: true })}
                                    />
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </AdminLayout>
    );
}
