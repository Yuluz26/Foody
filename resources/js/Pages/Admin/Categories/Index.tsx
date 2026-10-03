import { Link, router } from '@inertiajs/react';
import { PencilSimpleIcon, PlusIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ReorderButtons } from '@/components/admin/ReorderButtons';
import { ConfirmButton } from '@/components/ConfirmButton';
import { DigitDisplay } from '@/components/DigitDisplay';
import { FoodImage } from '@/components/FoodImage';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Switch } from '@/components/ui/Switch';
import { digitCode } from '@/lib/format';
import type { AdminCategory } from '@/types';

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
                <Link href="/admin/categories/create" className={buttonClass()}>
                    <PlusIcon size={18} weight="bold" aria-hidden />
                    Tambah kategori
                </Link>
            }
        >
            <p className="-mt-2 max-w-[65ch] text-[15px] text-ink-muted">
                Susunan di sini menentukan susunan di menu pelanggan, dan nombor hidangan (01, 02...) mengikutnya. Kategori yang masih ada produk tidak boleh dipadam.
            </p>

            {categories.length === 0 ? (
                <EmptyState Icon={SquaresFourIcon} className="mt-8" title="Belum ada kategori" description="Mulakan dengan kumpulan seperti Nasi, Mi dan Minuman.">
                    <Link href="/admin/categories/create" className={buttonClass()}>
                        <PlusIcon size={18} weight="bold" aria-hidden />
                        Tambah kategori
                    </Link>
                </EmptyState>
            ) : (
                <ol className="mt-6 grid gap-3">
                    {categories.map((category, index) => {
                        const count = category.productsCount ?? 0;

                        return (
                            <li
                                key={category.id}
                                className="neu-tile grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-4 py-4 [--neu-radius:var(--radius-panel)] sm:grid-cols-[3rem_4rem_minmax(0,1fr)_13rem_auto] sm:px-5"
                            >
                                <DigitDisplay value={digitCode(index)} size="sm" />
                                <FoodImage url={category.imageUrl} alt="" sizes="64px" className="hidden size-16 rounded-(--radius-control) shadow-(--shadow-raised-xs) sm:block" />
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
                                    <ReorderButtons name={category.name} index={index} count={categories.length} onMove={(direction) => move(index, direction)} />
                                    <Link href={`/admin/categories/${category.id}/edit`} className={buttonClass({ variant: 'quiet', size: 'sm' })}>
                                        <PencilSimpleIcon size={16} weight="bold" aria-hidden />
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
