import { Link, router, useForm } from '@inertiajs/react';
import { ArrowDownIcon, ArrowLeftIcon, ArrowUpIcon, ImagesIcon, UploadSimpleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmButton } from '@/components/ConfirmButton';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/format';
import type { AdminBanner } from '@/types';

const moveButtonClass =
    'grid size-10 shrink-0 place-items-center rounded-(--radius-control) border-2 border-rule-strong transition-[transform,background-color,color] duration-150 hover:scale-110 hover:bg-ink hover:text-white active:scale-90 disabled:cursor-not-allowed disabled:border-rule disabled:text-rule-strong disabled:hover:scale-100 disabled:hover:bg-transparent';

export default function BannersIndex({ banners }: { banners: AdminBanner[] }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const form = useForm<{ image: File | null }>({ image: null });

    const upload = (file: File) => {
        form.setData('image', file);
        form.post('/admin/banners', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.setData('image', null),
        });
    };

    const move = (index: number, direction: -1 | 1) => {
        const ids = banners.map((banner) => banner.id);
        const target = index + direction;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        router.patch('/admin/banners/reorder', { ids }, { preserveScroll: true });
    };

    return (
        <AdminLayout
            title="Slaid menu"
            actions={
                <Link href="/admin/settings" className="flex h-11 items-center gap-2 rounded-(--radius-control) px-3 font-semibold text-ink-soft hover:bg-rule/60 hover:text-ink">
                    <ArrowLeftIcon size={18} weight="bold" aria-hidden />
                    Tetapan
                </Link>
            }
        >
            <p className="-mt-2 max-w-[65ch] text-[15px] text-ink-muted">
                Gambar ini dipaparkan sebagai slaid di atas menu pelanggan. Setiap gambar dicrop secara automatik supaya semua slaid kemas dan sekata.
            </p>

            <div className="mt-6 rounded-(--radius-panel) border-2 border-dashed border-rule-strong p-6 text-center">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                            upload(file);
                        }
                        event.target.value = '';
                    }}
                />
                <ImagesIcon size={32} weight="bold" className="mx-auto text-rule-strong" aria-hidden />
                <p className="mt-2 text-[15px] font-semibold">Tambah gambar slaid baharu</p>
                <p className="mt-1 text-sm text-ink-muted">JPG, PNG atau WebP, maksimum 6 MB. Akan dicrop kepada nisbah 16:7.</p>
                <Button type="button" variant="ink" size="sm" className="mt-4" loading={form.processing} onClick={() => inputRef.current?.click()}>
                    <UploadSimpleIcon size={18} weight="bold" aria-hidden />
                    Pilih gambar
                </Button>
                {form.errors.image && (
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-alert">
                        <WarningCircleIcon size={18} weight="bold" aria-hidden />
                        {form.errors.image}
                    </p>
                )}
            </div>

            {banners.length === 0 ? (
                <div className="mt-6 flex flex-col items-start gap-2 rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-6">
                    <p className="text-[15px] font-semibold">Belum ada slaid</p>
                    <p className="text-sm text-ink-muted">Tanpa slaid, menu pelanggan dipaparkan seperti biasa tanpa jalur gambar di atas.</p>
                </div>
            ) : (
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                    {banners.map((banner, index) => (
                        <li key={banner.id} className="overflow-hidden rounded-(--radius-panel) border-2 border-rule-strong bg-panel">
                            <img src={banner.imageUrl} alt="" className={cn('aspect-[16/7] w-full object-cover', !banner.isActive && 'opacity-50 grayscale')} />
                            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                                <Switch checked={banner.isActive} label="Dipaparkan" onChange={() => router.patch(`/admin/banners/${banner.id}/toggle`, {}, { preserveScroll: true })} />
                                <div className="flex items-center gap-2">
                                    <button type="button" className={moveButtonClass} disabled={index === 0} onClick={() => move(index, -1)} aria-label="Naikkan slaid ini">
                                        <ArrowUpIcon size={16} weight="bold" aria-hidden />
                                    </button>
                                    <button type="button" className={moveButtonClass} disabled={index === banners.length - 1} onClick={() => move(index, 1)} aria-label="Turunkan slaid ini">
                                        <ArrowDownIcon size={16} weight="bold" aria-hidden />
                                    </button>
                                    <ConfirmButton
                                        label="Padam"
                                        title="Padam slaid ini?"
                                        message="Slaid akan dibuang dari menu pelanggan."
                                        confirmLabel="Ya, padam"
                                        onConfirm={() => router.delete(`/admin/banners/${banner.id}`, { preserveScroll: true })}
                                    />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </AdminLayout>
    );
}
