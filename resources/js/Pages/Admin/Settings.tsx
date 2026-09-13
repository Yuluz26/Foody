import { Link, useForm } from '@inertiajs/react';
import { ArrowRightIcon, ImagesIcon, QrCodeIcon } from '@phosphor-icons/react';
import type { FormEvent, ReactNode } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FormFooter } from '@/components/admin/FormFooter';
import { ImageInput } from '@/components/admin/ImageInput';
import { Field, inputClass } from '@/components/ui/Field';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/format';

type SettingsProps = {
    settings: {
        name: string;
        description: string;
        phone: string;
        address: string;
        opensAt: string;
        closesAt: string;
        currency: string;
        orderingEnabled: boolean;
        dineInEnabled: boolean;
        takeawayEnabled: boolean;
        logoUrl: string | null;
        qrCodeUrl: string | null;
        paymentInstructions: string;
        isOpenNow: boolean;
    };
};

type SettingFields = {
    name: string;
    description: string;
    phone: string;
    address: string;
    opens_at: string;
    closes_at: string;
    currency: string;
    ordering_enabled: boolean;
    dine_in_enabled: boolean;
    takeaway_enabled: boolean;
    logo: File | null;
    remove_logo: boolean;
    qr_code: File | null;
    remove_qr_code: boolean;
    payment_instructions: string;
};

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    const id = title.toLowerCase().replace(/\s+/g, '-');

    return (
        <section aria-labelledby={id} className="grid gap-5 rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-5 sm:p-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
            <div>
                <h2 id={id} className="font-heading text-xl font-extrabold text-ink">
                    {title}
                </h2>
                {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
            </div>
            <div className="grid content-start gap-5">{children}</div>
        </section>
    );
}

export default function Settings({ settings }: SettingsProps) {
    const form = useForm<SettingFields>({
        name: settings.name,
        description: settings.description,
        phone: settings.phone,
        address: settings.address,
        opens_at: settings.opensAt,
        closes_at: settings.closesAt,
        currency: settings.currency,
        ordering_enabled: settings.orderingEnabled,
        dine_in_enabled: settings.dineInEnabled,
        takeaway_enabled: settings.takeawayEnabled,
        logo: null,
        remove_logo: false,
        qr_code: null,
        remove_qr_code: false,
        payment_instructions: settings.paymentInstructions,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({ ...data, _method: 'put' }));
        form.post('/admin/settings', { forceFormData: true, preserveScroll: true });
    };

    const origin = typeof window === 'undefined' ? '' : window.location.origin;

    return (
        <AdminLayout title="Tetapan">
            <form onSubmit={submit} noValidate className="grid gap-6">
                <Panel title="Maklumat restoran" description="Dipaparkan pada papan tanda di atas menu.">
                    <Field id="name" label="Nama restoran" error={form.errors.name}>
                        {(control) => <input {...control} type="text" maxLength={100} value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className={inputClass} />}
                    </Field>
                    <Field id="description" label="Penerangan ringkas" optional error={form.errors.description}>
                        {(control) => (
                            <textarea
                                {...control}
                                rows={2}
                                maxLength={300}
                                value={form.data.description}
                                onChange={(event) => form.setData('description', event.target.value)}
                                className={cn(inputClass, 'resize-y')}
                            />
                        )}
                    </Field>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field id="phone" label="Telefon" optional error={form.errors.phone}>
                            {(control) => <input {...control} type="tel" autoComplete="tel" value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} className={inputClass} />}
                        </Field>
                        <Field id="currency" label="Mata wang" error={form.errors.currency} hint="Kod 3 huruf">
                            {(control) => (
                                <input
                                    {...control}
                                    type="text"
                                    maxLength={3}
                                    value={form.data.currency}
                                    onChange={(event) => form.setData('currency', event.target.value.toUpperCase())}
                                    className={cn(inputClass, 'uppercase')}
                                />
                            )}
                        </Field>
                    </div>
                    <Field id="address" label="Alamat" optional error={form.errors.address}>
                        {(control) => <input {...control} type="text" autoComplete="street-address" value={form.data.address} onChange={(event) => form.setData('address', event.target.value)} className={inputClass} />}
                    </Field>
                    <ImageInput
                        label="Logo"
                        aspect="square"
                        maxMb={2}
                        currentUrl={settings.logoUrl}
                        file={form.data.logo}
                        removed={form.data.remove_logo}
                        onFileChange={(file) => form.setData('logo', file)}
                        onRemovedChange={(removed) => form.setData('remove_logo', removed)}
                        error={form.errors.logo}
                    />
                </Panel>

                <Panel title="Slaid menu" description="Gambar jalur di atas menu pelanggan.">
                    <Link
                        href="/admin/banners"
                        className="group flex items-center justify-between gap-3 rounded-(--radius-control) border-2 border-rule-strong px-4 py-3.5 font-semibold transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-ink hover:shadow-(--shadow-lift) active:translate-y-0"
                    >
                        <span className="flex items-center gap-2.5">
                            <ImagesIcon size={20} weight="bold" className="text-ink-soft" aria-hidden />
                            Urus slaid menu
                        </span>
                        <ArrowRightIcon size={18} weight="bold" aria-hidden className="transition-transform duration-150 ease-out group-hover:translate-x-1" />
                    </Link>
                </Panel>

                <Panel title="Waktu operasi" description={`Sekarang kedai dikira ${settings.isOpenNow ? 'BUKA' : 'TUTUP'}. Kosongkan kedua-dua masa untuk buka sepanjang masa.`}>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field id="opens_at" label="Buka" error={form.errors.opens_at}>
                            {(control) => <input {...control} type="time" value={form.data.opens_at} onChange={(event) => form.setData('opens_at', event.target.value)} className={cn(inputClass, 'tabular')} />}
                        </Field>
                        <Field id="closes_at" label="Tutup" error={form.errors.closes_at} hint="Masa lebih awal dari waktu buka bermaksud tutup selepas tengah malam.">
                            {(control) => <input {...control} type="time" value={form.data.closes_at} onChange={(event) => form.setData('closes_at', event.target.value)} className={cn(inputClass, 'tabular')} />}
                        </Field>
                    </div>
                </Panel>

                <Panel title="Pesanan" description="Kawal cara pelanggan boleh memesan.">
                    <Switch
                        checked={form.data.ordering_enabled}
                        onChange={(checked) => form.setData('ordering_enabled', checked)}
                        label="Terima pesanan dalam talian"
                        description="Matikan untuk tutup pesanan sementara. Menu masih boleh dilihat."
                    />
                    <Switch checked={form.data.dine_in_enabled} onChange={(checked) => form.setData('dine_in_enabled', checked)} label="Makan di sini" description="Pelanggan beri nombor meja." />
                    {form.errors.dine_in_enabled && <p className="-mt-3 text-sm font-semibold text-alert">{form.errors.dine_in_enabled}</p>}
                    <Switch checked={form.data.takeaway_enabled} onChange={(checked) => form.setData('takeaway_enabled', checked)} label="Bungkus" description="Pelanggan ambil di kaunter." />
                    <div className="flex gap-3 border-t border-rule pt-5 text-[15px]">
                        <QrCodeIcon size={24} weight="bold" className="shrink-0 text-ink-soft" aria-hidden />
                        <p className="text-ink-soft">
                            Untuk kod QR meja, gunakan pautan menu dengan nombor meja di hujung, contohnya{' '}
                            <code className="rounded-(--radius-module) bg-amber-tint px-1.5 py-0.5 font-semibold text-ink">{origin}/?meja=12</code>. Nombor meja akan diisi sendiri semasa pelanggan memesan.
                        </p>
                    </div>
                </Panel>

                <Panel title="Pembayaran" description="Kod QR dan arahan bayaran dipaparkan semasa pelanggan memilih 'Imbas kod QR' di checkout.">
                    <ImageInput
                        label="Kod QR pembayaran"
                        aspect="square"
                        maxMb={2}
                        currentUrl={settings.qrCodeUrl}
                        file={form.data.qr_code}
                        removed={form.data.remove_qr_code}
                        onFileChange={(file) => form.setData('qr_code', file)}
                        onRemovedChange={(removed) => form.setData('remove_qr_code', removed)}
                        error={form.errors.qr_code}
                    />
                    {!settings.qrCodeUrl && !form.data.qr_code && (
                        <p className="text-sm text-ink-muted">Tanpa kod QR, pilihan "Imbas kod QR" disembunyikan di checkout dan pelanggan hanya boleh bayar di kaunter.</p>
                    )}
                    <Field id="payment_instructions" label="Arahan pembayaran" optional error={form.errors.payment_instructions} hint="Contoh: Sila sertakan nombor pesanan dalam rujukan pemindahan.">
                        {(control) => (
                            <textarea
                                {...control}
                                rows={2}
                                maxLength={500}
                                value={form.data.payment_instructions}
                                onChange={(event) => form.setData('payment_instructions', event.target.value)}
                                className={cn(inputClass, 'resize-y')}
                            />
                        )}
                    </Field>
                </Panel>

                <FormFooter processing={form.processing} isDirty={form.isDirty} saveLabel="Simpan tetapan" />
            </form>
        </AdminLayout>
    );
}
