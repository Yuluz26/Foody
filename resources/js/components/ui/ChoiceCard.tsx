import { CheckIcon, type Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/format';

type ChoiceCardProps = {
    name: string;
    value: string;
    checked: boolean;
    disabled?: boolean;
    label: string;
    hint: string;
    Icon: Icon;
    onChange: () => void;
};

/** A radio you press: raised until chosen, then pressed in with a lit icon and a tick. */
export function ChoiceCard({ name, value, checked, disabled = false, label, hint, Icon: ChoiceIcon, onChange }: ChoiceCardProps) {
    return (
        <label
            data-selected={checked}
            className={cn(
                'neu-press relative flex min-h-32 flex-col gap-3 p-4 [--neu-radius:var(--radius-panel)]',
                'has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-ink',
                disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer',
            )}
        >
            <input type="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={onChange} className="sr-only" />
            <span
                className={cn(
                    'grid size-11 place-items-center rounded-full transition-colors duration-200',
                    checked ? 'bg-amber text-ink shadow-(--shadow-raised-2xs)' : 'bg-ground-deep text-ink-muted shadow-(--shadow-inset-sm)',
                )}
            >
                <ChoiceIcon size={24} weight="bold" aria-hidden />
            </span>
            <span>
                <span className="block text-lg font-bold text-ink">{label}</span>
                <span className="mt-1 block text-sm text-ink-muted">{disabled ? 'Tidak tersedia sekarang' : hint}</span>
            </span>
            {checked && <CheckIcon size={20} weight="bold" className="absolute top-4 right-4 text-ink" aria-hidden />}
        </label>
    );
}
