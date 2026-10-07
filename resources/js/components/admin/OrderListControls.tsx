import { TrayIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { inputClass } from '@/components/ui/Field';
import { SearchField } from '@/components/ui/SearchField';

type FilterValues = { q: string; type: string; date_from: string; date_to: string };

type OrderFilterBarProps = {
    filters: FilterValues;
    onChange: <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => void;
};

/** Search + type + date-range filters shared by the admin Orders and Reports pages. */
export function OrderFilterBar({ filters, onChange }: OrderFilterBarProps) {
    return (
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_9.5rem_9.5rem]">
            <SearchField label="Cari nombor pesanan, nama atau telefon" value={filters.q} onChange={(value) => onChange('q', value)} placeholder="Cari WR0012, nama atau telefon" />
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

/** The "nothing here" panel shared by the admin Orders and Reports list pages. */
export function EmptyOrdersState({ title, description, showReset, onReset }: EmptyOrdersStateProps) {
    return (
        <EmptyState Icon={TrayIcon} title={title} description={description} className="mt-8">
            {showReset && (
                <Button variant="soft" size="sm" onClick={onReset}>
                    Kosongkan tapisan
                </Button>
            )}
        </EmptyState>
    );
}

type SelectionToolbarProps = {
    /** What is being selected, for the count ("3 pesanan dipilih"). */
    noun?: string;
    selectAllLabel?: string;
    count: number;
    allSelected: boolean;
    bulkPending: boolean;
    onToggleAll: () => void;
    onClear: () => void;
    children: ReactNode;
};

/** The "N dipilih" bar shared by the admin list pages; each page supplies its own bulk-action buttons. */
export function SelectionToolbar({ noun = 'pesanan', selectAllLabel = 'Pilih semua di halaman ini', count, allSelected, bulkPending, onToggleAll, onClear, children }: SelectionToolbarProps) {
    return (
        <div className="neu-well-sm mt-6 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
            <label className="flex items-center gap-2.5 text-[15px] font-semibold text-ink-soft">
                <input type="checkbox" checked={allSelected} onChange={onToggleAll} />
                {count > 0 ? `${count} ${noun} dipilih` : selectAllLabel}
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
