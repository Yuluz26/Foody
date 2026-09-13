import { WarningCircleIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { DigitDisplay } from '@/components/DigitDisplay';
import { FoodImage } from '@/components/FoodImage';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Sheet } from '@/components/Sheet';
import { Button } from '@/components/ui/Button';
import { cn, formatPrice, priceDigits } from '@/lib/format';
import type { AddOn, MenuProduct } from '@/types';

type ProductSheetProps = {
    selection: { product: MenuProduct; code: string } | null;
    canOrder: boolean;
    closedMessage: string;
    onClose: () => void;
    onAdd: (product: MenuProduct, quantity: number, addOns: AddOn[]) => void;
};

export function ProductSheet({ selection, canOrder, closedMessage, onClose, onAdd }: ProductSheetProps) {
    return (
        <Sheet open={selection !== null} onClose={onClose} title={selection?.product.name ?? 'Hidangan'} hideTitle>
            {/* Keyed so quantity and add-on selection reset for each dish. */}
            {selection && <ProductDetail key={selection.product.id} {...selection} canOrder={canOrder} closedMessage={closedMessage} onAdd={onAdd} />}
        </Sheet>
    );
}

function AddOnPicker({ addOns, selectedIds, onToggle }: { addOns: AddOn[]; selectedIds: number[]; onToggle: (id: number) => void }) {
    return (
        <fieldset className="mt-6 border-t border-rule pt-5">
            <legend className="text-lg font-bold text-ink">Tambahan</legend>
            <p className="mt-0.5 text-sm text-ink-muted">Harga tambahan dikenakan sekali sahaja, tidak mengikut kuantiti.</p>
            <ul className="mt-3 grid gap-2">
                {addOns.map((addOn) => {
                    const checked = selectedIds.includes(addOn.id);

                    return (
                        <li key={addOn.id}>
                            <label
                                className={cn(
                                    'flex cursor-pointer items-center justify-between gap-3 rounded-(--radius-control) border-2 px-4 py-3 transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[0.98]',
                                    checked ? 'border-ink bg-amber-tint/40' : 'border-rule-strong hover:border-ink-muted',
                                )}
                            >
                                <span className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => onToggle(addOn.id)}
                                        className="size-5 shrink-0 rounded-sm border-2 border-rule-strong accent-ink"
                                    />
                                    <span className="font-semibold text-ink">{addOn.name}</span>
                                </span>
                                <span className="shrink-0 text-sm font-semibold text-ink-muted">+{formatPrice(addOn.price)}</span>
                            </label>
                        </li>
                    );
                })}
            </ul>
        </fieldset>
    );
}

function ProductDetail({
    product,
    code,
    canOrder,
    closedMessage,
    onAdd,
}: {
    product: MenuProduct;
    code: string;
    canOrder: boolean;
    closedMessage: string;
    onAdd: (product: MenuProduct, quantity: number, addOns: AddOn[]) => void;
}) {
    const [quantity, setQuantity] = useState(1);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const orderable = canOrder && product.isAvailable;
    const selectedAddOns = product.addOns.filter((addOn) => selectedIds.includes(addOn.id));
    // Add-ons are a flat charge for this line, not per unit: quantity only scales the dish price.
    const addOnsTotal = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
    const total = product.price * quantity + addOnsTotal;

    const toggleAddOn = (id: number) => {
        setSelectedIds((ids) => (ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id]));
    };

    return (
        <div>
            <FoodImage
                url={product.imageUrl}
                alt={product.name}
                sizes="(min-width: 768px) 576px, 100vw"
                priority
                className="aspect-[4/3] w-full rounded-t-(--radius-panel) md:aspect-[16/10]"
            />
            <div className="px-5 pt-5 pb-6 md:px-6">
                <p className="flex flex-wrap items-center gap-2.5 text-3xl leading-tight font-extrabold text-balance text-ink">
                    <DigitDisplay value={code} size="sm" />
                    {product.name}
                </p>
                {product.description && <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ink-soft">{product.description}</p>}
                <div className="mt-4">
                    <DigitDisplay value={priceDigits(product.price)} size="lg" />
                </div>

                {product.addOns.length > 0 && <AddOnPicker addOns={product.addOns} selectedIds={selectedIds} onToggle={toggleAddOn} />}

                <div className="mt-6 border-t border-rule pt-5">
                    {orderable ? (
                        <div className="flex items-center gap-3">
                            <QuantityStepper value={quantity} onChange={setQuantity} label={product.name} />
                            <Button size="lg" className="min-w-0 flex-1" onClick={() => onAdd(product, quantity, selectedAddOns)}>
                                Tambah
                                <DigitDisplay value={priceDigits(total)} tone="white" chip={false} size="md" />
                            </Button>
                        </div>
                    ) : (
                        <p className="flex items-start gap-2 text-base font-semibold text-ink">
                            <WarningCircleIcon size={22} weight="bold" className="mt-0.5 shrink-0 text-amber-deep" aria-hidden />
                            {product.isAvailable ? closedMessage : 'Hidangan ini habis hari ini. Cuba pilihan lain dari menu.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
