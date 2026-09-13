import { cn } from '@/lib/format';

type SwitchProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
    disabled?: boolean;
};

/** A painted toggle with its label and state written out, not colour alone. */
export function Switch({ checked, onChange, label, description, disabled = false }: SwitchProps) {
    return (
        <label className={cn('flex items-start justify-between gap-4', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
            <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-ink">{label}</span>
                {description && <span className="mt-0.5 block text-sm text-ink-muted">{description}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-2">
                <span className={cn('w-12 text-right text-sm font-semibold', checked ? 'text-leaf' : 'text-ink-muted')} aria-hidden>
                    {checked ? 'Ya' : 'Tidak'}
                </span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    disabled={disabled}
                    onClick={() => onChange(!checked)}
                    className={cn(
                        'relative h-8 w-14 rounded-full border-2 transition-[background-color,border-color,transform] duration-150 hover:scale-105 active:scale-95',
                        checked ? 'border-leaf bg-leaf' : 'border-rule-strong bg-panel',
                    )}
                >
                    <span className="sr-only">{label}</span>
                    <span
                        className={cn(
                            'absolute top-1 left-1 size-5 rounded-full shadow-(--shadow-lift) transition-transform duration-200 ease-out',
                            checked ? 'translate-x-6 bg-white' : 'translate-x-0 bg-ink',
                        )}
                        aria-hidden
                    />
                </button>
            </span>
        </label>
    );
}
