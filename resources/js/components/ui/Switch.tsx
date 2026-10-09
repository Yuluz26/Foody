import { cn } from '@/lib/format';

type SwitchProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
    disabled?: boolean;
};

/** A pressed-in track with a raised knob that squishes when pressed. State is also written out, never colour alone. */
export function Switch({ checked, onChange, label, description, disabled = false }: SwitchProps) {
    return (
        <label className={cn('flex items-start justify-between gap-4', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
            <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-ink">{label}</span>
                {description && <span className="mt-0.5 block text-sm text-ink-muted">{description}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-2">
                <span className={cn('w-12 text-right text-sm font-semibold', checked ? 'text-leaf-deep' : 'text-ink-muted')} aria-hidden>
                    {checked ? 'Ya' : 'Tidak'}
                </span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    disabled={disabled}
                    onClick={() => onChange(!checked)}
                    className={cn(
                        'group relative h-8 w-14 rounded-full shadow-(--shadow-inset-sm) transition-colors duration-200 ease-out',
                        checked ? 'bg-leaf-tint' : 'bg-ground-deep',
                    )}
                >
                    <span className="sr-only">{label}</span>
                    <span
                        className={cn(
                            'absolute top-1 left-1 size-6 rounded-full shadow-(--shadow-raised-xs) transition-[transform,background-color,scale] duration-300 ease-spring motion-reduce:transition-colors',
                            'group-active:scale-x-125 group-active:scale-y-90 motion-reduce:group-active:scale-100',
                            checked ? 'translate-x-6 bg-leaf' : 'translate-x-0 bg-panel',
                        )}
                        aria-hidden
                    />
                </button>
            </span>
        </label>
    );
}
