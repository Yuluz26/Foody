import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/format';

type Variant = 'ink' | 'amber' | 'leaf' | 'outline' | 'quiet' | 'alert';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
    ink: 'bg-ink text-white hover:bg-ink-soft',
    amber: 'bg-amber text-ink hover:bg-amber-deep',
    leaf: 'bg-leaf text-white hover:bg-leaf-deep',
    outline: 'border-2 border-ink bg-transparent text-ink hover:bg-ink hover:text-white',
    quiet: 'bg-transparent text-ink hover:bg-rule/70',
    alert: 'bg-alert text-white hover:bg-alert/85',
};

// A de-emphasised text action (quiet) stays flat; every real action gets a little lift to reach for.
const LIFTS: Record<Variant, boolean> = { ink: true, amber: true, leaf: true, outline: true, quiet: false, alert: true };

const sizes: Record<Size, string> = {
    sm: 'h-10 px-3 text-sm',
    md: 'h-12 px-4 text-[15px]',
    lg: 'h-14 px-5 text-base',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = 'ink', size = 'md', loading = false, className, disabled, type = 'button', children, ...props },
    ref,
) {
    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={cn(
                'inline-flex touch-manipulation items-center justify-center gap-2 rounded-(--radius-control) font-semibold whitespace-nowrap select-none',
                'transition-[transform,background-color,color,box-shadow] duration-150 ease-out active:scale-[0.97]',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:scale-100',
                LIFTS[variant] && 'hover:-translate-y-0.5 hover:shadow-(--shadow-lift)',
                variants[variant],
                sizes[size],
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
});
