import { Link, useForm } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    ArrowsOutIcon,
    CheckIcon,
    DownloadSimpleIcon,
    ForkKnifeIcon,
    InfoIcon,
    QrCodeIcon,
    ShoppingBagIcon,
    StorefrontIcon,
    UploadSimpleIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { cartLineId, MAX_QUANTITY, useCart, type CartLine } from '@/cart/CartProvider';
import { CartLines } from '@/components/customer/Cart';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { DigitDisplay } from '@/components/DigitDisplay';
import { Sheet } from '@/components/Sheet';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { cn, formatPrice, priceDigits } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import type { MenuProduct, OrderType, PaymentMethod, Restaurant } from '@/types';

type CheckoutProps = {
    restaurant: Restaurant;
    products: Record<string, MenuProduct>;
    table: string | null;
    availableTables: string[];
};

type FormFields = {
    type: OrderType | '';
    table_number: string;
    customer_name: string;
    customer_phone: string;
    notes: string;
    payment_method: PaymentMethod | '';
    payment_proof: File | null;
};

const CUSTOMER_KEY = 'foody.customer';
const ATTEMPT_KEY = 'foody.checkout';
const FIELD_ORDER: Array<keyof FormFields> = [
    'type',
    'table_number',
    'customer_name',
    'customer_phone',
    'notes',
    'payment_method',
    'payment_proof',
];

export default function Checkout(props: CheckoutProps) {
    return (
        <CustomerLayout title={`Semak pesanan | ${props.restaurant.name}`}>
            <CheckoutScreen {...props} />
        </CustomerLayout>
    );
}

function readSavedCustomer(): { name: string; phone: string } {
    try {
        const saved = JSON.parse(window.localStorage.getItem(CUSTOMER_KEY) ?? '{}');

        return { name: typeof saved.name === 'string' ? saved.name : '', phone: typeof saved.phone === 'string' ? saved.phone : '' };
    } catch {
        return { name: '', phone: '' };
    }
}

function readTable(fromLink: string | null): string {
    if (fromLink) {
        return fromLink;
    }

    try {
        return window.sessionStorage.getItem('foody.table') ?? '';
    } catch {
        return '';
    }
}

/**
 * One key per checkout attempt for a given cart. A retried submit (double tap, flaky network)
 * reuses it, so the server returns the order it already created instead of making a second one.
 */
function useAttemptKey(signature: string): string {
    return useMemo(() => {
        try {
            const saved = JSON.parse(window.sessionStorage.getItem(ATTEMPT_KEY) ?? 'null');

            if (saved?.signature === signature && typeof saved.key === 'string') {
                return saved.key as string;
            }
        } catch {
            // Fall through to a fresh key.
        }

        const key = window.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

        try {
            window.sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify({ key, signature }));
        } catch {
            // Without storage the key still covers repeated taps on this page.
        }

        return key;
    }, [signature]);
}

function validateField(field: keyof FormFields, data: FormFields): string | undefined {
    switch (field) {
        case 'type':
            return data.type ? undefined : 'Pilih Makan di sini atau Bungkus.';
        case 'table_number':
            return data.type === 'dine_in' && !data.table_number.trim() ? 'Pilih meja anda.' : undefined;
        case 'customer_name':
            return data.customer_name.trim().length < 2 ? 'Masukkan nama anda supaya kami boleh panggil.' : undefined;
        case 'customer_phone': {
            const digits = data.customer_phone.replace(/\D/g, '');

            return digits.length < 9 || digits.length > 15 ? 'Nombor telefon tidak sah. Contoh: 012-345 6789.' : undefined;
        }
        case 'payment_method':
            return data.payment_method ? undefined : 'Pilih kaedah pembayaran.';
        case 'payment_proof':
            return data.payment_method === 'qr' && !data.payment_proof ? 'Muat naik bukti bayaran.' : undefined;
        default:
            return undefined;
    }
}

/** Full-size, high-contrast view of the payment QR so it scans cleanly, with a save-to-device option. */
function QrCodeLightbox({ open, onClose, qrCodeUrl }: { open: boolean; onClose: () => void; qrCodeUrl: string }) {
    return (
        <Sheet open={open} onClose={onClose} title="Kod QR pembayaran" hideTitle width="md">
            <div className="grid justify-items-center gap-5 px-5 pt-12 pb-6 md:px-6">
                <img src={qrCodeUrl} alt="Kod QR pembayaran, saiz penuh" className="aspect-square w-full max-w-80 rounded-(--radius-panel) border-2 border-rule-strong bg-white object-contain p-4" />
                <a
                    href={qrCodeUrl}
                    download="kod-qr-pembayaran.png"
                    className="inline-flex h-12 items-center gap-2 rounded-(--radius-control) bg-ink px-5 font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-ink-soft active:scale-[0.97]"
                >
                    <DownloadSimpleIcon size={18} weight="bold" aria-hidden />
                    Muat turun kod QR
                </a>
            </div>
        </Sheet>
    );
}

function CheckoutScreen({ restaurant, products, table, availableTables }: CheckoutProps) {
    const cart = useCart();
    const reduce = useReducedMotion();
    const [notices, setNotices] = useState<string[]>([]);
    const [qrLightboxOpen, setQrLightboxOpen] = useState(false);

    // Bring the stored cart in line with today's menu before the customer reviews it.
    useEffect(() => {
        const messages: string[] = [];
        let changed = false;

        const reconciled = cart.lines.flatMap((line) => {
            const product = products[line.productId];

            if (!product || !product.isAvailable) {
                messages.push(`${line.name} sudah habis dan dibuang dari troli.`);
                changed = true;

                return [];
            }

            let addOnsChanged = false;
            const addOns = line.addOns.flatMap((addOn) => {
                const current = product.addOns.find((candidate) => candidate.id === addOn.id);

                if (!current) {
                    messages.push(`Tambahan "${addOn.name}" untuk ${product.name} sudah tidak tersedia dan dibuang.`);
                    addOnsChanged = true;

                    return [];
                }

                if (current.price !== addOn.price || current.name !== addOn.name) {
                    addOnsChanged = true;

                    return [current];
                }

                return [addOn];
            });

            const basicsChanged = product.price !== line.price || product.name !== line.name || product.imageUrl !== line.imageUrl;

            if (!basicsChanged && !addOnsChanged) {
                return [line];
            }

            if (product.price !== line.price) {
                messages.push(`Harga ${product.name} kini ${formatPrice(product.price)}.`);
            }

            changed = true;

            return [{ ...line, name: product.name, price: product.price, imageUrl: product.imageUrl, addOns, id: cartLineId(line.productId, addOns) }];
        });

        if (changed) {
            // Reconciliation can make two lines collapse onto the same id (e.g. they only differed by an add-on that just got removed).
            const merged: CartLine[] = [];

            for (const line of reconciled) {
                const existing = merged.find((candidate) => candidate.id === line.id);

                if (existing) {
                    existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + line.quantity);
                } else {
                    merged.push({ ...line });
                }
            }

            cart.replace(merged);
            setNotices(messages);
        }
        // Run once on arrival; later edits happen through the cart controls.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saved = useMemo(readSavedCustomer, []);
    const rememberedTable = useMemo(() => readTable(table), [table]);
    // A remembered/QR table only pre-selects if it's still free — otherwise the customer picks again.
    const initialTable = availableTables.includes(rememberedTable) ? rememberedTable : '';

    const defaultType: FormFields['type'] =
        initialTable && restaurant.dineInEnabled
            ? 'dine_in'
            : restaurant.dineInEnabled !== restaurant.takeawayEnabled
              ? restaurant.dineInEnabled
                  ? 'dine_in'
                  : 'takeaway'
              : '';

    // Cashier is always available; QR only once the admin has uploaded a code — with no
    // real choice to make, pick cashier for the customer instead of forcing an extra tap.
    const defaultPaymentMethod: FormFields['payment_method'] = restaurant.qrCodeUrl ? '' : 'cashier';

    const form = useForm<FormFields>({
        type: defaultType,
        table_number: initialTable,
        customer_name: saved.name,
        customer_phone: saved.phone,
        notes: '',
        payment_method: defaultPaymentMethod,
        payment_proof: null,
    });
    const proofInputRef = useRef<HTMLInputElement>(null);

    const signature = cart.lines.map((line) => `${line.id}x${line.quantity}`).join(',');
    const attemptKey = useAttemptKey(signature);
    const canOrder = restaurant.acceptingOrders;
    const itemsError = Object.entries(form.errors).find(([key]) => key.startsWith('items'))?.[1];
    const orderError = (form.errors as Record<string, string | undefined>).order ?? itemsError;

    const focusFirstInvalid = (errors: Partial<Record<string, string>>) => {
        const first = FIELD_ORDER.find((field) => errors[field]);

        if (first === 'type') {
            document.querySelector<HTMLInputElement>('input[name="type"]:not(:disabled)')?.focus();
        } else if (first === 'payment_method') {
            document.querySelector<HTMLInputElement>('input[name="payment_method"]:not(:disabled)')?.focus();
        } else if (first === 'payment_proof') {
            proofInputRef.current?.focus();
        } else if (first) {
            document.getElementById(`medan-${first}`)?.focus();
        } else {
            document.getElementById('ralat-pesanan')?.focus();
        }
    };

    const checkField = (field: keyof FormFields) => {
        const message = validateField(field, form.data);

        if (message) {
            form.setError(field, message);
        } else {
            form.clearErrors(field);
        }
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (form.processing || !canOrder || cart.lines.length === 0) {
            return;
        }

        const errors = Object.fromEntries(
            FIELD_ORDER.map((field) => [field, validateField(field, form.data)]).filter(([, message]) => message),
        ) as Partial<Record<keyof FormFields, string>>;

        if (Object.keys(errors).length > 0) {
            form.clearErrors();
            form.setError(errors as Record<keyof FormFields, string>);
            focusFirstInvalid(errors);

            return;
        }

        form.transform((data) => ({
            ...data,
            table_number: data.type === 'dine_in' ? data.table_number.trim() : null,
            idempotency_key: attemptKey,
            items: cart.lines.map((line) => ({ product_id: line.productId, quantity: line.quantity, add_on_ids: line.addOns.map((addOn) => addOn.id) })),
        }));

        form.post('/pesanan', {
            preserveScroll: true,
            onSuccess: () => {
                try {
                    window.localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: form.data.customer_name.trim(), phone: form.data.customer_phone.trim() }));
                } catch {
                    // Details are simply asked again next time.
                }
            },
            onError: (errors) => focusFirstInvalid(errors),
        });
    };

    const typeOptions = [
        { value: 'dine_in' as const, label: 'Makan di sini', hint: 'Kami hantar ke meja anda', Icon: ForkKnifeIcon, enabled: restaurant.dineInEnabled },
        { value: 'takeaway' as const, label: 'Bungkus', hint: 'Ambil di kaunter', Icon: ShoppingBagIcon, enabled: restaurant.takeawayEnabled },
    ];

    const paymentOptions = [
        { value: 'cashier' as const, label: 'Bayar di kaunter', hint: 'Bayar semasa ambil pesanan', Icon: StorefrontIcon, enabled: true },
        { value: 'qr' as const, label: 'Imbas kod QR', hint: 'Muat naik bukti bayaran', Icon: QrCodeIcon, enabled: Boolean(restaurant.qrCodeUrl) },
    ];

    return (
        <>
            <header className="border-b-2 border-rule bg-ground">
                <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-5 sm:px-8">
                    <Link href={table ? `/?meja=${encodeURIComponent(table)}` : '/'} className="-ml-2 flex h-11 items-center gap-2 rounded-(--radius-control) px-2 font-semibold text-ink hover:bg-rule/70">
                        <ArrowLeftIcon size={20} weight="bold" aria-hidden />
                        Menu
                    </Link>
                    <p className="truncate text-xl font-extrabold text-ink">{restaurant.name}</p>
                </div>
            </header>

            <main id="kandungan" className="mx-auto max-w-3xl px-5 pt-8 pb-44 sm:px-8 lg:pb-20">
                <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">Semak pesanan</h1>

                {notices.length > 0 && (
                    <div role="status" className="mt-5 flex gap-3 rounded-(--radius-panel) border-2 border-rule-strong bg-amber-tint p-4">
                        <InfoIcon size={22} weight="bold" className="mt-0.5 shrink-0 text-amber-deep" aria-hidden />
                        <ul className="grid gap-1 text-[15px] font-medium text-ink">
                            {notices.map((notice) => (
                                <li key={notice}>{notice}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {cart.lines.length === 0 ? (
                    <div className="mt-10 rounded-(--radius-panel) border-2 border-dashed border-rule-strong px-6 py-14 text-center">
                        <p className="text-3xl font-extrabold text-ink">Troli anda kosong</p>
                        <p className="mx-auto mt-2 max-w-[34ch] text-base text-ink-soft">Pilih hidangan dari menu dahulu, kemudian kembali ke sini untuk menghantar pesanan.</p>
                        <Link
                            href="/"
                            className="mt-6 inline-flex h-12 items-center gap-2 rounded-(--radius-control) bg-ink px-5 font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-ink-soft active:scale-[0.97]"
                        >
                            <ArrowLeftIcon size={18} weight="bold" aria-hidden />
                            Lihat menu
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={submit} noValidate className="mt-8 grid gap-10">
                        {!canOrder && (
                            <p role="alert" className="on-module flex gap-2 rounded-(--radius-panel) bg-ink p-4 text-[15px] font-semibold text-white">
                                <WarningCircleIcon size={22} weight="bold" className="shrink-0 text-amber" aria-hidden />
                                Kedai tidak menerima pesanan sekarang. Troli anda disimpan untuk nanti.
                            </p>
                        )}

                        <fieldset aria-describedby={form.errors.type ? 'medan-type-error' : undefined}>
                            <legend className="text-2xl font-extrabold text-ink">Makan di sini atau bungkus?</legend>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                {typeOptions.map(({ value, label, hint, Icon, enabled }) => {
                                    const checked = form.data.type === value;

                                    return (
                                        <label
                                            key={value}
                                            className={cn(
                                                'relative flex min-h-32 flex-col gap-3 rounded-(--radius-panel) border-2 p-4 transition-[transform,background-color,border-color,color] duration-150 ease-out',
                                                'has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink',
                                                checked ? 'border-ink bg-ink text-white' : 'border-rule-strong bg-panel text-ink hover:border-ink-muted',
                                                enabled ? 'cursor-pointer active:scale-[0.98]' : 'cursor-not-allowed opacity-50',
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="type"
                                                value={value}
                                                checked={checked}
                                                disabled={!enabled}
                                                onChange={() => {
                                                    form.setData('type', value);
                                                    form.clearErrors('type');
                                                }}
                                                className="sr-only"
                                            />
                                            <Icon size={30} weight="bold" aria-hidden className={checked ? 'text-amber' : 'text-ink-muted'} />
                                            <span>
                                                <span className="block text-lg font-bold">{label}</span>
                                                <span className={cn('mt-1 block text-sm', checked ? 'text-white/90' : 'text-ink-muted')}>
                                                    {enabled ? hint : 'Tidak tersedia sekarang'}
                                                </span>
                                            </span>
                                            {checked && <CheckIcon size={20} weight="bold" className="absolute top-4 right-4 text-amber" aria-hidden />}
                                        </label>
                                    );
                                })}
                            </div>
                            {form.errors.type && (
                                <p id="medan-type-error" className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-alert">
                                    <WarningCircleIcon size={18} weight="bold" aria-hidden />
                                    {form.errors.type}
                                </p>
                            )}

                            <AnimatePresence initial={false}>
                                {form.data.type === 'dine_in' && (
                                    <motion.div
                                        key="meja"
                                        initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-6px)' }}
                                        animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0px)' }}
                                        exit={{ opacity: 0, transition: { duration: 0.12 } }}
                                        transition={{ duration: duration.fast, ease: ease.out }}
                                        className="mt-5 max-w-48"
                                    >
                                        {availableTables.length === 0 ? (
                                            <p className="flex items-start gap-1.5 text-sm font-semibold text-alert">
                                                <WarningCircleIcon size={18} weight="bold" className="mt-px shrink-0" aria-hidden />
                                                Semua meja sedang digunakan buat masa ini. Sila cuba lagi sebentar, atau pilih Bungkus.
                                            </p>
                                        ) : (
                                            <Field id="medan-table_number" label="Nombor meja" error={form.errors.table_number} hint="Hanya meja yang tiada pesanan aktif dipaparkan">
                                                {(control) => (
                                                    <select
                                                        {...control}
                                                        value={form.data.table_number}
                                                        onChange={(event) => form.setData('table_number', event.target.value)}
                                                        onBlur={() => checkField('table_number')}
                                                        className={inputClass}
                                                    >
                                                        <option value="" disabled>
                                                            Pilih meja
                                                        </option>
                                                        {availableTables.map((tableNumber) => (
                                                            <option key={tableNumber} value={tableNumber}>
                                                                Meja {tableNumber}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </Field>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </fieldset>

                        <section aria-labelledby="maklumat-tajuk" className="grid gap-5">
                            <h2 id="maklumat-tajuk" className="text-2xl font-extrabold text-ink">
                                Maklumat anda
                            </h2>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field id="medan-customer_name" label="Nama" error={form.errors.customer_name}>
                                    {(control) => (
                                        <input
                                            {...control}
                                            type="text"
                                            autoComplete="name"
                                            maxLength={100}
                                            value={form.data.customer_name}
                                            onChange={(event) => form.setData('customer_name', event.target.value)}
                                            onBlur={() => checkField('customer_name')}
                                            className={inputClass}
                                        />
                                    )}
                                </Field>
                                <Field id="medan-customer_phone" label="Nombor telefon" error={form.errors.customer_phone} hint="Untuk kami hubungi jika perlu">
                                    {(control) => (
                                        <input
                                            {...control}
                                            type="tel"
                                            inputMode="tel"
                                            autoComplete="tel"
                                            maxLength={20}
                                            placeholder="012-345 6789"
                                            value={form.data.customer_phone}
                                            onChange={(event) => form.setData('customer_phone', event.target.value)}
                                            onBlur={() => checkField('customer_phone')}
                                            className={cn(inputClass, 'tabular')}
                                        />
                                    )}
                                </Field>
                            </div>
                            <Field id="medan-notes" label="Nota untuk dapur" optional error={form.errors.notes} hint="Contoh: kurang pedas, tanpa kacang">
                                {(control) => (
                                    <textarea
                                        {...control}
                                        rows={2}
                                        maxLength={300}
                                        value={form.data.notes}
                                        onChange={(event) => form.setData('notes', event.target.value)}
                                        className={cn(inputClass, 'resize-y')}
                                    />
                                )}
                            </Field>
                        </section>

                        <fieldset aria-describedby={form.errors.payment_method ? 'medan-payment_method-error' : undefined}>
                            <legend className="text-2xl font-extrabold text-ink">Kaedah pembayaran</legend>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                {paymentOptions.map(({ value, label, hint, Icon, enabled }) => {
                                    const checked = form.data.payment_method === value;

                                    return (
                                        <label
                                            key={value}
                                            className={cn(
                                                'relative flex min-h-32 flex-col gap-3 rounded-(--radius-panel) border-2 p-4 transition-[transform,background-color,border-color,color] duration-150 ease-out',
                                                'has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink',
                                                checked ? 'border-ink bg-ink text-white' : 'border-rule-strong bg-panel text-ink hover:border-ink-muted',
                                                enabled ? 'cursor-pointer active:scale-[0.98]' : 'cursor-not-allowed opacity-50',
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value={value}
                                                checked={checked}
                                                disabled={!enabled}
                                                onChange={() => {
                                                    form.setData('payment_method', value);
                                                    form.clearErrors('payment_method');

                                                    if (value !== 'qr') {
                                                        form.setData('payment_proof', null);
                                                        form.clearErrors('payment_proof');
                                                    }
                                                }}
                                                className="sr-only"
                                            />
                                            <Icon size={30} weight="bold" aria-hidden className={checked ? 'text-amber' : 'text-ink-muted'} />
                                            <span>
                                                <span className="block text-lg font-bold">{label}</span>
                                                <span className={cn('mt-1 block text-sm', checked ? 'text-white/90' : 'text-ink-muted')}>
                                                    {enabled ? hint : 'Tidak tersedia sekarang'}
                                                </span>
                                            </span>
                                            {checked && <CheckIcon size={20} weight="bold" className="absolute top-4 right-4 text-amber" aria-hidden />}
                                        </label>
                                    );
                                })}
                            </div>
                            {form.errors.payment_method && (
                                <p id="medan-payment_method-error" className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-alert">
                                    <WarningCircleIcon size={18} weight="bold" aria-hidden />
                                    {form.errors.payment_method}
                                </p>
                            )}

                            <AnimatePresence initial={false}>
                                {form.data.payment_method === 'qr' && restaurant.qrCodeUrl && (
                                    <motion.div
                                        key="qr"
                                        initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-6px)' }}
                                        animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0px)' }}
                                        exit={{ opacity: 0, transition: { duration: 0.12 } }}
                                        transition={{ duration: duration.fast, ease: ease.out }}
                                        className="mt-5 flex flex-col items-center gap-4 rounded-(--radius-panel) border-2 border-rule-strong bg-amber-tint/40 p-5 text-center sm:flex-row sm:items-start sm:gap-5 sm:text-left"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setQrLightboxOpen(true)}
                                            className="group relative size-44 shrink-0 overflow-hidden rounded-(--radius-control) border-2 border-rule-strong bg-panel active:scale-[0.98]"
                                        >
                                            <img src={restaurant.qrCodeUrl} alt="Kod QR pembayaran — ketik untuk perbesar" className="size-full object-contain p-2" />
                                            <span className="absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2 py-1 text-[11px] font-semibold text-white transition-colors duration-150 group-hover:bg-ink">
                                                <ArrowsOutIcon size={12} weight="bold" aria-hidden />
                                                Perbesar
                                            </span>
                                        </button>
                                        <div className="grid w-full content-start gap-4 text-left">
                                            {restaurant.paymentInstructions && <p className="text-[15px] text-ink-soft">{restaurant.paymentInstructions}</p>}
                                            <Field id="medan-payment_proof" label="Muat naik bukti bayaran" error={form.errors.payment_proof}>
                                                {(control) => (
                                                    <label
                                                        htmlFor={control.id}
                                                        className={cn(
                                                            inputClass,
                                                            'flex cursor-pointer items-center justify-center gap-2 text-center font-semibold',
                                                        )}
                                                    >
                                                        <UploadSimpleIcon size={20} weight="bold" aria-hidden />
                                                        {form.data.payment_proof ? form.data.payment_proof.name : 'Pilih gambar resit / skrin bayaran'}
                                                        <input
                                                            {...control}
                                                            ref={proofInputRef}
                                                            type="file"
                                                            accept="image/jpeg,image/png,image/webp"
                                                            className="sr-only"
                                                            onChange={(event) => {
                                                                form.setData('payment_proof', event.target.files?.[0] ?? null);
                                                                form.clearErrors('payment_proof');
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </Field>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </fieldset>

                        {restaurant.qrCodeUrl && (
                            <QrCodeLightbox open={qrLightboxOpen} onClose={() => setQrLightboxOpen(false)} qrCodeUrl={restaurant.qrCodeUrl} />
                        )}

                        <section aria-labelledby="ringkasan-tajuk">
                            <div className="flex items-end justify-between gap-4 border-b-2 border-amber pb-2">
                                <h2 id="ringkasan-tajuk" className="text-2xl font-extrabold text-ink">
                                    Pesanan anda
                                </h2>
                                <Link href="/" className="pb-1 text-[15px] font-semibold text-ink underline decoration-rule-strong hover:decoration-ink">
                                    Tambah hidangan
                                </Link>
                            </div>
                            <CartLines />
                            <dl className="flex items-baseline justify-between border-t-2 border-ink pt-4">
                                <dt className="text-lg font-semibold">Jumlah</dt>
                                <dd>
                                    <DigitDisplay value={priceDigits(cart.subtotal)} size="lg" />
                                </dd>
                            </dl>
                        </section>

                        {orderError && (
                            <p id="ralat-pesanan" tabIndex={-1} role="alert" className="flex gap-2 rounded-(--radius-panel) border-2 border-alert bg-alert-tint p-4 text-[15px] font-semibold text-alert">
                                <WarningCircleIcon size={22} weight="bold" className="shrink-0" aria-hidden />
                                {orderError}
                            </p>
                        )}

                        <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-rule bg-panel pb-safe lg:static lg:border-0 lg:bg-transparent lg:pb-0">
                            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 pt-3 sm:px-8 lg:px-0 lg:pt-0">
                                <p className="lg:hidden">
                                    <span className="block text-sm text-ink-muted">Jumlah</span>
                                    <DigitDisplay value={priceDigits(cart.subtotal)} chip={false} size="lg" />
                                </p>
                                <Button type="submit" size="lg" loading={form.processing} disabled={!canOrder} className="flex-1 sm:flex-none sm:px-10 lg:ml-auto">
                                    {form.processing ? 'Menghantar...' : 'Hantar pesanan'}
                                </Button>
                            </div>
                        </div>
                    </form>
                )}
            </main>
        </>
    );
}
