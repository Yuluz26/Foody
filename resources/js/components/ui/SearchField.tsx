import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { buttonClass } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/Field';
import { cn } from '@/lib/format';

type SearchFieldProps = {
    /** Screen-reader label; the placeholder alone is not a label. */
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
};

/** A pressed-in search field with a magnifier and a clear button that appears once there is something to clear. */
export function SearchField({ label, value, onChange, placeholder, className }: SearchFieldProps) {
    return (
        <label className={cn('relative block', className)}>
            <span className="sr-only">{label}</span>
            <MagnifyingGlassIcon size={20} weight="bold" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className={cn(inputClass, 'pr-12 pl-11 [&::-webkit-search-cancel-button]:appearance-none')}
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    aria-label="Kosongkan carian"
                    className={buttonClass({ variant: 'quiet', size: 'sm', icon: true, className: 'absolute top-1/2 right-1.5 -translate-y-1/2' })}
                >
                    <XIcon size={18} weight="bold" aria-hidden />
                </button>
            )}
        </label>
    );
}
