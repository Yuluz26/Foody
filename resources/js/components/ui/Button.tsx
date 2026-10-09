import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/format';

export type ButtonVariant = 'ink' | 'amber' | 'leaf' | 'soft' | 'quiet' | 'alert';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonStyle = {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Round, label-less button (close, row action). Pair with an aria-label. */
    icon?: boolean;
    className?: string;
};

/** The look of a button, for anything that navigates (<Link>, <a>) but should read as one. The surface itself lives in app.css (.btn). */
export function buttonClass({ variant = 'ink', size = 'md', icon = false, className }: ButtonStyle = {}): string {
    return cn('btn', `btn-${variant}`, `btn-${size}`, icon && 'btn-icon', className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
    ButtonStyle & {
        loading?: boolean;
    };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant, size, icon, loading = false, className, disabled, type = 'button', children, ...props },
    ref,
) {
    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={buttonClass({ variant, size, icon, className })}
            {...props}
        >
            {loading && (
                <span className="btn-dots" aria-hidden>
                    <i />
                    <i />
                    <i />
                </span>
            )}
            {children}
        </button>
    );
});
