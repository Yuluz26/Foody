import { Link } from '@inertiajs/react';
import { BasketIcon, PlusIcon, TrashIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Button, buttonClass } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/Field';
import { cn, formatPrice } from '@/lib/format';
import type { IngredientOption } from '@/types';

export type RecipeField = {
    /** Client-only, a stable React key before the row is saved. */
    key: string;
    ingredientId: string;
    quantity: string;
};

type RecipeEditorProps = {
    rows: RecipeField[];
    ingredients: IngredientOption[];
    /** Selling price in sen, to show what is left after ingredients. */
    priceInSen: number;
    errors: Record<string, string | undefined>;
    onChange: (rows: RecipeField[]) => void;
};

export function newRecipeKey(): string {
    return typeof window !== 'undefined' && window.crypto?.randomUUID ? window.crypto.randomUUID() : `new-${Math.random().toString(36).slice(2)}`;
}

/** The recipe for one portion. Selling the dish takes these amounts from the ingredient stock. */
export function RecipeEditor({ rows, ingredients, priceInSen, errors, onChange }: RecipeEditorProps) {
    const byId = new Map(ingredients.map((ingredient) => [String(ingredient.id), ingredient]));
    const chosen = new Set(rows.map((row) => row.ingredientId).filter(Boolean));
    const update = (key: string, patch: Partial<RecipeField>) => onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

    const cost = rows.reduce((sum, row) => {
        const ingredient = byId.get(row.ingredientId);
        const quantity = Number.parseFloat(row.quantity);

        return ingredient && Number.isFinite(quantity) ? sum + quantity * ingredient.unitCost : sum;
    }, 0);
    const profit = priceInSen - cost;
    const showCost = rows.length > 0 && cost > 0;

    return (
        <div className="neu-card grid content-start gap-4 p-5 sm:p-6 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-ink">Resipi</h2>
                    <p className="mt-0.5 max-w-[60ch] text-sm text-ink-muted">Berapa banyak bahan untuk satu hidangan. Bila hidangan dijual, bahan ditolak sendiri daripada Stok bahan, dan dipulangkan bila pesanan dibatalkan.</p>
                </div>
                {ingredients.length > 0 && (
                    <Button type="button" variant="soft" size="sm" disabled={chosen.size >= ingredients.length} onClick={() => onChange([...rows, { key: newRecipeKey(), ingredientId: '', quantity: '' }])}>
                        <PlusIcon size={16} weight="bold" aria-hidden />
                        Tambah bahan
                    </Button>
                )}
            </div>

            {ingredients.length === 0 ? (
                <div className="neu-well-sm flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-sm text-ink-muted">
                    <span className="flex items-center gap-3">
                        <BasketIcon size={22} weight="bold" aria-hidden />
                        Belum ada bahan. Tambah bahan di Stok bahan dahulu.
                    </span>
                    <Link href="/admin/ingredients" className={buttonClass({ variant: 'soft', size: 'sm' })}>
                        Ke Stok bahan
                    </Link>
                </div>
            ) : rows.length === 0 ? (
                <p className="neu-well-sm px-4 py-3.5 text-sm text-ink-muted">Tiada resipi. Hidangan ini dijual tanpa menolak apa-apa bahan.</p>
            ) : (
                <ul className="grid gap-3">
                    {rows.map((row, index) => {
                        const ingredient = byId.get(row.ingredientId);
                        const idError = errors[`recipe.${index}.ingredient_id`];
                        const quantityError = errors[`recipe.${index}.quantity`];

                        return (
                            <li key={row.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_11rem_auto]">
                                <div className="col-span-2 sm:col-span-1">
                                    <label htmlFor={`recipe-ing-${row.key}`} className="sr-only">
                                        Bahan {index + 1}
                                    </label>
                                    <select id={`recipe-ing-${row.key}`} value={row.ingredientId} onChange={(event) => update(row.key, { ingredientId: event.target.value })} aria-invalid={idError ? true : undefined} className={inputClass}>
                                        <option value="">Pilih bahan</option>
                                        {ingredients.map((option) => (
                                            <option key={option.id} value={option.id} disabled={chosen.has(String(option.id)) && String(option.id) !== row.ingredientId}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </select>
                                    {idError && <p className="mt-1 text-sm font-semibold text-alert">{idError}</p>}
                                </div>
                                <div>
                                    <label htmlFor={`recipe-qty-${row.key}`} className="sr-only">
                                        Kuantiti seportion {index + 1}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id={`recipe-qty-${row.key}`}
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="0.15"
                                            value={row.quantity}
                                            onChange={(event) => update(row.key, { quantity: event.target.value.replace(',', '.') })}
                                            aria-invalid={quantityError ? true : undefined}
                                            className={cn(inputClass, 'tabular pr-16')}
                                        />
                                        <span className="pointer-events-none absolute top-1/2 right-3 max-w-14 -translate-y-1/2 truncate text-sm font-semibold text-ink-muted" aria-hidden>
                                            {ingredient?.unit ?? ''}
                                        </span>
                                    </div>
                                    {quantityError && (
                                        <p className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-alert">
                                            <WarningCircleIcon size={16} weight="bold" className="mt-px shrink-0" aria-hidden />
                                            {quantityError}
                                        </p>
                                    )}
                                </div>
                                <Button type="button" variant="quiet" size="sm" icon aria-label={`Buang bahan ${index + 1}`} onClick={() => onChange(rows.filter((item) => item.key !== row.key))}>
                                    <TrashIcon size={18} weight="bold" aria-hidden />
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {showCost && (
                <dl className="neu-well-sm grid grid-cols-3 gap-3 px-4 py-3.5 text-sm">
                    <div>
                        <dt className="text-ink-muted">Kos bahan seportion</dt>
                        <dd className="mt-0.5 font-mono text-base font-semibold text-ink tabular-nums">{formatPrice(Math.round(cost))}</dd>
                    </div>
                    <div>
                        <dt className="text-ink-muted">Harga jual</dt>
                        <dd className="mt-0.5 font-mono text-base font-semibold text-ink tabular-nums">{priceInSen > 0 ? formatPrice(priceInSen) : '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-ink-muted">Baki selepas bahan</dt>
                        <dd className={cn('mt-0.5 font-mono text-base font-semibold tabular-nums', priceInSen > 0 && profit < 0 ? 'text-alert' : 'text-leaf-deep')}>
                            {priceInSen > 0 ? `${formatPrice(Math.round(profit))} (${Math.round((profit / priceInSen) * 100)}%)` : '-'}
                        </dd>
                    </div>
                </dl>
            )}
        </div>
    );
}
