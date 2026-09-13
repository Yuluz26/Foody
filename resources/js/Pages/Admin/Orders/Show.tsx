import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeftIcon, ArrowSquareOutIcon, PencilSimpleIcon, PhoneIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmButton } from '@/components/ConfirmButton';
import { OrderActions } from '@/components/admin/OrderQueue';
import { PaymentBadge } from '@/components/admin/PaymentBadge';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DigitDisplay } from '@/components/DigitDisplay';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { formatDateTime, formatPhone, formatPrice, priceDigits } from '@/lib/format';
import type { AdminOrderRow, OrderLine } from '@/types';

type OrderDetail = AdminOrderRow & {
    items: OrderLine[];
    notes: string | null;
    subtotal: number;
    timeline: Array<{ status: string; label: string; at: string }>;
    paymentProofUrl: string | null;
};

type EditItem = { id: number; quantity: number };

type EditFields = {
    customer_name: string;
    customer_phone: string;
    table_number: string;
    notes: string;
    items: EditItem[];
};

function EditOrderForm({ order, onDone }: { order: OrderDetail; onDone: () => void }) {
    const form = useForm<EditFields>({
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        table_number: order.tableNumber ?? '',
        notes: order.notes ?? '',
        items: order.items.map((item) => ({ id: item.id, quantity: item.quantity })),
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.patch(`/admin/orders/${order.id}`, { preserveScroll: true, onSuccess: onDone });
    };

    const setQuantity = (index: number, quantity: number) => {
        form.setData(
            'items',
            form.data.items.map((line, lineIndex) => (lineIndex === index ? { ...line, quantity } : line)),
        );
    };

    const total = order.items.reduce((sum, item, index) => {
        const quantity = form.data.items[index]?.quantity ?? item.quantity;

        return sum + item.unitPrice * quantity + item.addOnsTotal;
    }, 0);

    return (
        <form onSubmit={submit} className="grid gap-4 rounded-(--radius-panel) border-2 border-amber bg-amber-tint/40 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <Field id="customer_name" label="Nama pelanggan" error={form.errors.customer_name}>
                    {(control) => (
                        <input
                            {...control}
                            className={inputClass}
                            value={form.data.customer_name}
                            onChange={(event) => form.setData('customer_name', event.target.value)}
                        />
                    )}
                </Field>
                <Field id="customer_phone" label="Telefon" error={form.errors.customer_phone}>
                    {(control) => (
                        <input
                            {...control}
                            type="tel"
                            className={inputClass}
                            value={form.data.customer_phone}
                            onChange={(event) => form.setData('customer_phone', event.target.value)}
                        />
                    )}
                </Field>
                {order.type === 'dine_in' && (
                    <Field id="table_number" label="Nombor meja" error={form.errors.table_number}>
                        {(control) => (
                            <input
                                {...control}
                                className={inputClass}
                                value={form.data.table_number}
                                onChange={(event) => form.setData('table_number', event.target.value)}
                            />
                        )}
                    </Field>
                )}
                <Field id="notes" label="Nota" optional error={form.errors.notes} className="sm:col-span-2">
                    {(control) => (
                        <textarea
                            {...control}
                            rows={2}
                            className={inputClass}
                            value={form.data.notes}
                            onChange={(event) => form.setData('notes', event.target.value)}
                        />
                    )}
                </Field>
            </div>

            <div className="grid gap-2 border-t-2 border-amber/60 pt-4">
                <p className="text-[15px] font-semibold text-ink">Kuantiti item</p>
                <ul className="divide-y divide-rule">
                    {order.items.map((item, index) => {
                        const quantity = form.data.items[index]?.quantity ?? item.quantity;
                        const error = form.errors[`items.${index}.quantity` as keyof typeof form.errors];
                        const inputId = `item-${item.id}-quantity`;

                        return (
                            <li key={item.id} className="grid gap-1.5 py-2.5">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                    <span className="min-w-0 flex-1 basis-40 text-base font-semibold">{item.name}</span>
                                    <span className="shrink-0 whitespace-nowrap text-sm text-ink-muted">{formatPrice(item.unitPrice)} seunit</span>
                                    <label htmlFor={inputId} className="sr-only">
                                        Kuantiti {item.name}
                                    </label>
                                    <div className="w-20 shrink-0">
                                        <input
                                            id={inputId}
                                            type="number"
                                            inputMode="numeric"
                                            min={1}
                                            max={50}
                                            className={`${inputClass} text-center`}
                                            aria-invalid={error ? true : undefined}
                                            value={quantity}
                                            onChange={(event) => setQuantity(index, Math.max(1, Math.min(50, Number(event.target.value) || 1)))}
                                        />
                                    </div>
                                    <span className="w-24 shrink-0 whitespace-nowrap text-right font-semibold tabular-nums">
                                        {formatPrice(item.unitPrice * quantity + item.addOnsTotal)}
                                    </span>
                                </div>
                                {error && (
                                    <p className="flex items-start gap-1.5 text-sm font-semibold text-alert">
                                        <WarningCircleIcon size={18} weight="bold" className="mt-px shrink-0" aria-hidden />
                                        {error}
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ul>
                <dl className="flex items-baseline justify-between border-t-2 border-ink pt-3">
                    <dt className="text-lg font-semibold">Jumlah</dt>
                    <dd className="text-lg font-semibold tabular-nums">{formatPrice(total)}</dd>
                </dl>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={onDone}>
                    Batal
                </Button>
                <Button type="submit" variant="amber" loading={form.processing}>
                    Simpan
                </Button>
            </div>
        </form>
    );
}

export default function OrderShow({ order }: { order: OrderDetail }) {
    const [editing, setEditing] = useState(false);
    const isAdmin = usePage().props.auth.user?.role === 'admin';

    return (
        <AdminLayout
            title={`Pesanan ${order.number}`}
            actions={
                <>
                    <button
                        type="button"
                        onClick={() => setEditing((value) => !value)}
                        className="group flex h-11 items-center gap-1.5 rounded-(--radius-control) px-3 font-semibold text-ink-soft transition-colors duration-150 hover:bg-rule/60 hover:text-ink"
                    >
                        {editing ? (
                            <XIcon size={18} weight="bold" aria-hidden />
                        ) : (
                            <PencilSimpleIcon size={18} weight="bold" aria-hidden className="transition-transform duration-150 ease-out group-hover:-rotate-12" />
                        )}
                        {editing ? 'Tutup edit' : 'Edit'}
                    </button>
                    {isAdmin && (
                        <ConfirmButton
                            label="Padam"
                            size="sm"
                            title={`Padam ${order.number}?`}
                            message={`Pesanan ${order.customerName} akan dipadam selama-lamanya bersama semua itemnya. Tindakan ini tidak boleh diundur.`}
                            confirmLabel="Ya, padam"
                            onConfirm={() => router.delete(`/admin/orders/${order.id}`)}
                        />
                    )}
                    <Link href="/admin/orders" className="flex h-11 items-center gap-2 rounded-(--radius-control) px-3 font-semibold text-ink-soft hover:bg-rule/60 hover:text-ink">
                        <ArrowLeftIcon size={18} weight="bold" aria-hidden />
                        Semua pesanan
                    </Link>
                </>
            }
        >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="grid content-start gap-8">
                    <section aria-labelledby="status-tajuk" className="rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-5">
                        <h2 id="status-tajuk" className="sr-only">
                            Status
                        </h2>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <StatusBadge status={order.status} className="h-9 px-3 text-sm" />
                                <p className="text-[15px] text-ink-muted">Dibuat {formatDateTime(order.createdAt)}</p>
                            </div>
                            {order.nextStatuses.length > 0 ? (
                                <OrderActions order={order} size="md" />
                            ) : (
                                <p className="text-[15px] font-semibold text-ink-muted">Pesanan ini sudah ditutup.</p>
                            )}
                        </div>
                    </section>

                    {editing ? (
                        <EditOrderForm order={order} onDone={() => setEditing(false)} />
                    ) : (
                        <section aria-labelledby="item-tajuk">
                            <h2 id="item-tajuk" className="font-heading border-b-2 border-amber pb-2 text-2xl font-extrabold text-ink">
                                Item
                            </h2>
                            <ul className="divide-y divide-rule">
                                {order.items.map((item) => (
                                    <li key={item.id} className="py-3">
                                        <div className="flex items-baseline gap-3">
                                            <span className="w-10 shrink-0 font-mono text-lg font-semibold text-ink-muted tabular-nums">{item.quantity}×</span>
                                            <span className="min-w-0 text-base font-semibold">{item.name}</span>
                                            <span className="min-w-4 flex-1 -translate-y-1 border-b-2 border-dotted border-rule-strong" aria-hidden />
                                            <span className="tabular shrink-0 text-sm text-ink-muted">{formatPrice(item.unitPrice)} seunit</span>
                                            <span className="w-24 shrink-0 text-right">
                                                <DigitDisplay value={priceDigits(item.lineTotal)} chip={false} size="sm" />
                                            </span>
                                        </div>
                                        {item.addOns.length > 0 && (
                                            <p className="mt-0.5 pl-13 text-sm text-ink-muted">
                                                + {item.addOns.map((addOn) => addOn.name).join(', ')} ({formatPrice(item.addOnsTotal)})
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <dl className="flex items-baseline justify-between border-t-2 border-ink pt-4">
                                <dt className="text-lg font-semibold">Jumlah</dt>
                                <dd>
                                    <DigitDisplay value={priceDigits(order.total)} size="lg" />
                                </dd>
                            </dl>
                            {order.notes && (
                                <div className="mt-5 rounded-(--radius-panel) border-2 border-rule-strong bg-amber-tint p-4">
                                    <p className="text-sm font-semibold text-ink-muted">Nota pelanggan</p>
                                    <p className="mt-1 text-base">{order.notes}</p>
                                </div>
                            )}
                        </section>
                    )}
                </div>

                <aside className="grid content-start gap-8">
                    <section aria-labelledby="pelanggan-tajuk">
                        <h2 id="pelanggan-tajuk" className="font-heading border-b-2 border-amber pb-2 text-xl font-extrabold text-ink">
                            Pelanggan
                        </h2>
                        <dl className="mt-3 grid gap-3 text-[15px]">
                            <div>
                                <dt className="text-sm text-ink-muted">Nama</dt>
                                <dd className="font-semibold">{order.customerName}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-ink-muted">Telefon</dt>
                                <dd>
                                    <a href={`tel:${order.customerPhone}`} className="inline-flex items-center gap-1.5 font-semibold text-ink hover:underline">
                                        <PhoneIcon size={16} weight="bold" aria-hidden />
                                        {formatPhone(order.customerPhone)}
                                    </a>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-ink-muted">Jenis</dt>
                                <dd className="flex items-center gap-2 font-semibold">
                                    {order.typeLabel}
                                    {order.tableNumber && <DigitDisplay value={order.tableNumber} size="sm" />}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section aria-labelledby="bayaran-tajuk">
                        <h2 id="bayaran-tajuk" className="font-heading border-b-2 border-amber pb-2 text-xl font-extrabold text-ink">
                            Pembayaran
                        </h2>
                        <dl className="mt-3 grid gap-3 text-[15px]">
                            <div>
                                <dt className="text-sm text-ink-muted">Kaedah</dt>
                                <dd className="font-semibold">{order.paymentMethodLabel}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-ink-muted">Status</dt>
                                <dd className="mt-1">
                                    <PaymentBadge status={order.paymentStatus} />
                                </dd>
                            </div>
                            {order.paymentMethod === 'qr' && order.paymentProofUrl && (
                                <div>
                                    <dt className="text-sm text-ink-muted">Bukti bayaran</dt>
                                    <dd className="mt-1">
                                        <a href={order.paymentProofUrl} target="_blank" rel="noopener">
                                            <img
                                                src={order.paymentProofUrl}
                                                alt={`Bukti bayaran pesanan ${order.number}`}
                                                className="h-40 w-40 rounded-(--radius-panel) border-2 border-rule-strong object-cover"
                                            />
                                        </a>
                                    </dd>
                                </div>
                            )}
                        </dl>
                        {order.paymentStatus !== 'paid' && (
                            <ConfirmButton
                                label="Sahkan pembayaran"
                                size="sm"
                                className="mt-4"
                                title={`Sahkan pembayaran ${order.number}?`}
                                message="Tindakan ini menandakan pesanan sebagai sudah dibayar."
                                confirmLabel="Ya, sahkan"
                                onConfirm={() => router.patch(`/admin/orders/${order.id}/payment`, {}, { preserveScroll: true })}
                            />
                        )}
                    </section>

                    <section aria-labelledby="sejarah-tajuk">
                        <h2 id="sejarah-tajuk" className="font-heading border-b-2 border-amber pb-2 text-xl font-extrabold text-ink">
                            Sejarah status
                        </h2>
                        <ol className="mt-3 grid gap-2 text-[15px]">
                            {order.timeline.map((step) => (
                                <li key={step.status} className="flex justify-between gap-3">
                                    <span className="font-medium">{step.label}</span>
                                    <time dateTime={step.at} className="tabular text-ink-muted">
                                        {formatDateTime(step.at)}
                                    </time>
                                </li>
                            ))}
                        </ol>
                    </section>

                    <a
                        href={`/pesanan/${order.publicId}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-2 text-[15px] font-semibold text-ink-soft underline decoration-rule-strong hover:text-ink"
                    >
                        <ArrowSquareOutIcon size={18} weight="bold" aria-hidden />
                        Halaman status pelanggan
                    </a>
                </aside>
            </div>
        </AdminLayout>
    );
}
