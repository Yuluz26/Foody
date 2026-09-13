import { WarningCircleIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

export const inputClass = cn(
    'block w-full rounded-(--radius-control) border-2 border-rule-strong bg-panel px-3.5 py-3 text-base text-ink',
    'placeholder:text-ink-muted transition-colors duration-150 hover:border-ink-muted focus:border-ink',
    'aria-invalid:border-alert aria-invalid:bg-alert-tint/40 disabled:cursor-not-allowed disabled:opacity-60',
);

type ControlProps = {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: true;
};

type FieldProps = {
    id: string;
    label: string;
    hint?: string;
    error?: string;
    optional?: boolean;
    className?: string;
    /** 'dark' for a field sitting on a dark (on-module) surface, e.g. the admin login panel. */
    tone?: 'light' | 'dark';
    children: (control: ControlProps) => ReactNode;
};

/** Label above, control, then either the hint or the error, wired with aria-describedby. */
export function Field({ id, label, hint, error, optional = false, className, tone = 'light', children }: FieldProps) {
    const hintId = hint && !error ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const dark = tone === 'dark';

    return (
        <div className={cn('grid content-start gap-1.5', className)}>
            <label htmlFor={id} className={cn('text-[15px] font-semibold', dark ? 'text-white' : 'text-ink')}>
                {label}
                {optional && <span className={cn('font-normal', dark ? 'text-white/60' : 'text-ink-muted')}> (pilihan)</span>}
            </label>
            {children({
                id,
                'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
                'aria-invalid': error ? true : undefined,
            })}
            {hintId && (
                <p id={hintId} className={cn('text-sm', dark ? 'text-white/60' : 'text-ink-muted')}>
                    {hint}
                </p>
            )}
            {errorId && (
                <p id={errorId} className="flex items-start gap-1.5 text-sm font-semibold text-alert">
                    <WarningCircleIcon size={18} weight="bold" className="mt-px shrink-0" aria-hidden />
                    {error}
                </p>
            )}
        </div>
    );
}
