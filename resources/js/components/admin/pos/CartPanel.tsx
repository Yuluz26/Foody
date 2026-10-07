import { ArrowsClockwiseIcon, ForkKnifeIcon, ShoppingBagOpenIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { DigitDisplay } from '@/components/DigitDisplay';
import { FoodImage } from '@/components/FoodImage';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, inputClass } from '@/components/ui/Field';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Switch } from '@/components/ui/Switch';
import { cn, formatPrice, priceDigits } from '@/lib/format';
import { lineTotal, type PosLine } from './usePosCart';

export type OrderDraft = {
    type: 'takeaway' | 'dine_in';
    table: string;
    name: string;
    phone: string;
    notes: string;
    payment: 'cashier' | 'qr';
    paid: boolean;
    /** What the customer handed over, in ringgit as typed. */
    tendered: string;
};

type CartPanelProps = {
    lines: PosLine[];
    total: number;
    draft: OrderDraft;
    onDraft: (patch: Partial<OrderDraft>) => void;
    onQuantity: (id: string, quantity: number) => void;
    onClear: () => void;
    onSubmit: () => void;
    processing: boolean;
    tables: { all: string[]; available: string[] };
    errors: Record<string, string | undefined>;
    /** True in the side column, where the lines scroll and the total stays put; false inside a phone sheet, which scrolls as a whole. */
    fill?: boolean;
};

const TYPE_TABS = [
    { value: 'takeaway', label: 'Bungkus' },
    { value: 'dine_in', label: 'Makan sini' },
];

const PAYMENT_TABS = [
    { value: 'cashier', label: 'Tunai' },
    { value: 'qr', label: 'QR / e-wallet' },
];

const QUICK_NOTES = [10, 20, 50, 100];

/** Everything between "what they want" and "sent to the kitchen", in the order a cashier does it. */
export function CartPanel({ lines, total, draft, onDraft, onQuantity, onClear, onSubmit, processing, tables, errors, fill = false }: CartPanelProps) {
    const tenderedSen = Math.round((Number.parseFloat(draft.tendered) || 0) * 100);
    const showCash = draft.payment === 'cashier' && draft.paid && total > 0;
    const change = tenderedSen - total;
    const tableMissing = draft.type === 'dine_in' && draft.table === '';
    const blocked = lines.length === 0 || tableMissing;

    return (
        <div className={cn('flex min-h-0 flex-col', fill && 'h-full')}>
            <div className={cn('grid content-start gap-5', fill && 'min-h-0 flex-1 overflow-y-auto pr-1 pb-4')}>
                <div className="flex items-center justify-between gap-3">
                    <h2 className={cn('text-lg font-bold text-ink', !fill && 'sr-only')}>Pesanan baharu</h2>
                    {lines.length > 0 && (
                        <Button variant="quiet" size="sm" onClick={onClear}>
                            <ArrowsClockwiseIcon size={15} weight="bold" aria-hidden />
                            Kosongkan
                        </Button>
                    )}
                </div>

                {lines.length === 0 ? (
                    <EmptyState Icon={ShoppingBagOpenIcon} centered title="Troli kosong" description="Ketik gambar hidangan untuk menambah." className="p-5" />
                ) : (
                    <ul className="grid grid-cols-[minmax(0,1fr)] gap-2.5" aria-label="Item dalam troli">
                        {lines.map((line) => (
                            <li key={line.id} className="neu-well-sm flex items-center gap-3 p-2">
                                <FoodImage url={line.imageUrl} alt="" sizes="56px" className="size-14 shrink-0 rounded-(--radius-control)" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[15px] font-semibold text-ink">{line.name}</p>
                                    {line.addOns.length > 0 && <p className="truncate text-xs text-ink-muted">+ {line.addOns.map((addOn) => addOn.name).join(', ')}</p>}
                                    <p className="font-mono text-sm font-semibold text-ink tabular-nums">{formatPrice(lineTotal(line))}</p>
                                </div>
                                <QuantityStepper value={line.quantity} onChange={(value) => onQuantity(line.id, value)} label={line.name} min={0} size="sm" />
                            </li>
                        ))}
                    </ul>
                )}

                {errors.items && <p className="text-sm font-semibold text-alert">{errors.items}</p>}

                <div className="grid gap-4 border-t border-ink/10 pt-5">
                    <div className="grid gap-1.5">
                        <p className="text-[15px] font-semibold text-ink">Jenis pesanan</p>
                        <SegmentedTabs
                            label="Jenis pesanan"
                            tabs={TYPE_TABS}
                            value={draft.type}
                            onChange={(value) =>
                                onDraft({
                                    type: value as OrderDraft['type'],
                                    table: '',
                                })
                            }
                        />
                    </div>

                    {draft.type === 'dine_in' && (
                        <fieldset className="grid min-w-0 gap-2">
                            <legend className="mb-1 flex items-center gap-1.5 text-[15px] font-semibold text-ink">
                                <ForkKnifeIcon size={16} weight="bold" aria-hidden />
                                Meja
                            </legend>
                            {tables.all.length === 0 ? (
                                <p className="text-sm text-ink-muted">Bilangan meja belum ditetapkan di Tetapan.</p>
                            ) : (
                                <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 xl:grid-cols-5">
                                    {tables.all.map((table) => {
                                        const free = tables.available.includes(table);
                                        const selected = draft.table === table;

                                        return (
                                            <button
                                                key={table}
                                                type="button"
                                                disabled={!free}
                                                aria-pressed={selected}
                                                aria-label={free ? `Meja ${table}` : `Meja ${table}, sedang digunakan`}
                                                onClick={() => onDraft({ table })}
                                                className={cn(
                                                    'h-11 rounded-(--radius-control) font-mono text-base font-semibold tabular-nums transition-[background-color,box-shadow,color] duration-200',
                                                    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink',
                                                    selected
                                                        ? 'bg-amber text-ink shadow-(--shadow-inset-sm)'
                                                        : free
                                                          ? 'bg-panel text-ink shadow-(--shadow-raised-2xs) hover:shadow-(--shadow-raised-xs)'
                                                          : 'cursor-not-allowed text-ink-muted/60 line-through shadow-(--shadow-inset-sm)',
                                                )}
                                            >
                                                {table}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {(errors.table_number || (tableMissing && lines.length > 0)) && <p className="text-sm font-semibold text-alert">{errors.table_number ?? 'Pilih nombor meja.'}</p>}
                        </fieldset>
                    )}

                    <details className="group">
                        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                            Nama, telefon dan nota
                            <span className="text-sm font-normal text-ink-muted group-open:hidden">pilihan</span>
                        </summary>
                        <div className="mt-3 grid gap-3">
                            <Field id="pos-name" label="Nama pelanggan" optional error={errors.customer_name}>
                                {(control) => (
                                    <input
                                        {...control}
                                        type="text"
                                        maxLength={100}
                                        autoComplete="off"
                                        value={draft.name}
                                        onChange={(event) =>
                                            onDraft({
                                                name: event.target.value,
                                            })
                                        }
                                        className={inputClass}
                                    />
                                )}
                            </Field>
                            <Field id="pos-phone" label="Telefon" optional error={errors.customer_phone}>
                                {(control) => (
                                    <input
                                        {...control}
                                        type="tel"
                                        maxLength={20}
                                        autoComplete="off"
                                        value={draft.phone}
                                        onChange={(event) =>
                                            onDraft({
                                                phone: event.target.value,
                                            })
                                        }
                                        className={inputClass}
                                    />
                                )}
                            </Field>
                            <Field id="pos-notes" label="Nota untuk dapur" optional error={errors.notes}>
                                {(control) => (
                                    <input
                                        {...control}
                                        type="text"
                                        maxLength={300}
                                        value={draft.notes}
                                        onChange={(event) =>
                                            onDraft({
                                                notes: event.target.value,
                                            })
                                        }
                                        className={inputClass}
                                        placeholder="Contoh: kurang pedas"
                                    />
                                )}
                            </Field>
                        </div>
                    </details>

                    <div className="grid gap-1.5">
                        <p className="text-[15px] font-semibold text-ink">Bayaran</p>
                        <SegmentedTabs
                            label="Cara bayaran"
                            tabs={PAYMENT_TABS}
                            value={draft.payment}
                            onChange={(value) =>
                                onDraft({
                                    payment: value as OrderDraft['payment'],
                                })
                            }
                        />
                    </div>
                    <Switch
                        checked={draft.paid}
                        onChange={(paid) => onDraft({ paid })}
                        label="Sudah dibayar"
                        description={draft.paid ? 'Ditanda lunas sekarang.' : 'Biar belum bayar, contohnya pelanggan bayar selepas makan.'}
                    />

                    {showCash && (
                        <div className="neu-well-sm grid gap-3 p-3.5">
                            <Field id="pos-tendered" label="Wang diterima (RM)" optional>
                                {(control) => (
                                    <input
                                        {...control}
                                        type="text"
                                        inputMode="decimal"
                                        value={draft.tendered}
                                        onChange={(event) =>
                                            onDraft({
                                                tendered: event.target.value.replace(',', '.'),
                                            })
                                        }
                                        className={cn(inputClass, 'tabular')}
                                        placeholder="0.00"
                                    />
                                )}
                            </Field>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="soft"
                                    size="sm"
                                    onClick={() =>
                                        onDraft({
                                            tendered: (total / 100).toFixed(2),
                                        })
                                    }
                                >
                                    Tepat
                                </Button>
                                {QUICK_NOTES.map((note) => (
                                    <Button key={note} variant="soft" size="sm" onClick={() => onDraft({ tendered: String(note) })}>
                                        RM {note}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {errors.order && (
                    <p role="alert" className="neu-well-sm flex gap-2 [--neu-bg:var(--color-alert-tint)] p-3.5 text-[15px] font-semibold text-alert">
                        <WarningCircleIcon size={22} weight="bold" className="shrink-0" aria-hidden />
                        {errors.order}
                    </p>
                )}
            </div>

            <div className={cn('grid gap-3 border-t border-ink/10 bg-panel pt-4', fill ? 'shrink-0' : 'sticky bottom-0 -mx-5 px-5 pb-1 md:-mx-6 md:px-6')}>
                {showCash && tenderedSen > 0 && (
                    <p className={cn('flex items-center justify-between gap-3 text-[15px] font-semibold', change < 0 ? 'text-alert' : 'text-leaf-deep')} aria-live="polite">
                        {change < 0 ? 'Kurang' : 'Baki untuk pelanggan'}
                        <span className="font-mono text-xl tabular-nums">{formatPrice(Math.abs(change))}</span>
                    </p>
                )}
                <div className="flex items-center justify-between gap-3">
                    <span className="text-[15px] font-semibold text-ink-soft">Jumlah</span>
                    <DigitDisplay value={priceDigits(total)} size="lg" label={`Jumlah ${formatPrice(total)}`} />
                </div>
                <Button variant="amber" size="lg" className="w-full" disabled={blocked || processing} loading={processing} onClick={onSubmit}>
                    Hantar ke dapur
                </Button>
            </div>
        </div>
    );
}
