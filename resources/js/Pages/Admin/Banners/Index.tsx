import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeftIcon, ImagesIcon, UploadSimpleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmButton } from '@/components/ConfirmButton';
import { ReorderButtons } from '@/components/admin/ReorderButtons';
import { Button, buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/format';
import type { AdminBanner } from '@/types';

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
                <Link href="/admin/settings" className={buttonClass({ variant: 'quiet', size: 'sm' })}>
                    <ArrowLeftIcon size={18} weight="bold" aria-hidden />
                    Tetapan
                </Link>
            }
        >
            <p className="-mt-2 max-w-[65ch] text-[15px] text-ink-muted">
                Gambar ini dipaparkan sebagai slaid di atas menu pelanggan. Setiap gambar dicrop secara automatik supaya semua slaid kemas dan sekata.
            </p>

            <div className="neu-well mt-6 p-6 text-center">
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
                <span className="neu-tile mx-auto grid size-14 place-items-center [--neu-radius:9999px]">
                    <ImagesIcon size={26} weight="bold" className="text-ink-muted" aria-hidden />
                </span>
                <p className="mt-3 text-[15px] font-semibold">Tambah gambar slaid baharu</p>
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
                <EmptyState Icon={ImagesIcon} className="mt-6" title="Belum ada slaid" description="Tanpa slaid, menu pelanggan dipaparkan seperti biasa tanpa jalur gambar di atas." />
            ) : (
                <ul className="mt-6 grid gap-5 sm:grid-cols-2">
                    {banners.map((banner, index) => (
                        <li key={banner.id} className="neu-tile p-2.5 [--neu-radius:var(--radius-panel)]">
                            <img src={banner.imageUrl} alt="" className={cn('aspect-[16/7] w-full rounded-[calc(var(--radius-panel)-10px)] object-cover', !banner.isActive && 'opacity-50 grayscale')} />
                            <div className="flex flex-wrap items-center justify-between gap-3 px-1.5 pt-3.5 pb-1.5">
                                <Switch checked={banner.isActive} label="Dipaparkan" onChange={() => router.patch(`/admin/banners/${banner.id}/toggle`, {}, { preserveScroll: true })} />
                                <div className="flex items-center gap-2">
                                    <ReorderButtons name="slaid ini" index={index} count={banners.length} onMove={(direction) => move(index, direction)} />
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
