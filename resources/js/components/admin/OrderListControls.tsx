import { MagnifyingGlassIcon, TrayIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/Field';
import { cn } from '@/lib/format';

type FilterValues = { q: string; type: string; date_from: string; date_to: string };

type OrderFilterBarProps = {
    filters: FilterValues;
    onChange: <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => void;
};

/** Search + type + date-range filters shared by the admin Orders and Reports pages. */
export function OrderFilterBar({ filters, onChange }: OrderFilterBarProps) {
    return (
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_9.5rem_9.5rem]">
            <label className="relative block">
                <span className="sr-only">Cari nombor pesanan, nama atau telefon</span>
                <MagnifyingGlassIcon size={20} weight="bold" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" aria-hidden />
                <input
                    type="search"
                    value={filters.q}
                    onChange={(event) => onChange('q', event.target.value)}
                    placeholder="Cari FD0012, nama atau telefon"
                    className={cn(inputClass, 'pl-10')}
                />
            </label>
            <label className="block">
                <span className="sr-only">Jenis pesanan</span>
                <select value={filters.type} onChange={(event) => onChange('type', event.target.value)} className={inputClass}>
                    <option value="">Semua jenis</option>
                    <option value="dine_in">Makan di sini</option>
                    <option value="takeaway">Bungkus</option>
                </select>
            </label>
            <label className="block">
                <span className="sr-only">Dari tarikh</span>
                <input
                    type="date"
                    value={filters.date_from}
                    max={filters.date_to || undefined}
                    onChange={(event) => onChange('date_from', event.target.value)}
                    className={inputClass}
                />
            </label>
            <label className="block">
                <span className="sr-only">Hingga tarikh</span>
                <input
                    type="date"
                    value={filters.date_to}
                    min={filters.date_from || undefined}
                    onChange={(event) => onChange('date_to', event.target.value)}
                    className={inputClass}
                />
            </label>
        </div>
    );
}

type EmptyOrdersStateProps = {
    title: string;
    description: string;
    showReset: boolean;
    onReset: () => void;
};

/** The dashed-border "nothing here" panel shared by the admin Orders and Reports list pages. */
export function EmptyOrdersState({ title, description, showReset, onReset }: EmptyOrdersStateProps) {
    return (
        <div className="mt-8 flex flex-col items-start gap-4 rounded-(--radius-panel) border-2 border-dashed border-rule-strong p-8">
            <TrayIcon size={36} weight="bold" className="text-rule-strong" aria-hidden />
            <div>
                <p className="text-lg font-semibold">{title}</p>
                <p className="text-[15px] text-ink-muted">{description}</p>
            </div>
            {showReset && (
                <Button variant="outline" size="sm" onClick={onReset}>
                    Kosongkan tapisan
                </Button>
            )}
        </div>
    );
}

type SelectionToolbarProps = {
    count: number;
    allSelected: boolean;
    bulkPending: boolean;
    onToggleAll: () => void;
    onClear: () => void;
    children: ReactNode;
};

/** The "N pesanan dipilih" bar shared by the admin Orders and Reports list pages; each page supplies its own bulk-action buttons. */
export function SelectionToolbar({ count, allSelected, bulkPending, onToggleAll, onClear, children }: SelectionToolbarProps) {
    return (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-t-(--radius-panel) border-2 border-b-0 border-rule-strong bg-ground px-4 py-2.5">
            <label className="flex items-center gap-2.5 text-[15px] font-semibold text-ink-soft">
                <input type="checkbox" checked={allSelected} onChange={onToggleAll} className="size-5 shrink-0 rounded-sm border-2 border-rule-strong accent-ink" />
                {count > 0 ? `${count} pesanan dipilih` : 'Pilih semua di halaman ini'}
            </label>
            {count > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {children}
                    <Button variant="quiet" size="sm" disabled={bulkPending} onClick={onClear}>
                        Nyahpilih
                    </Button>
                </div>
            )}
        </div>
    );
}
