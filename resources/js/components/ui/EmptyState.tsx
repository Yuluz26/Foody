import type { Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

type EmptyStateProps = {
    Icon: Icon;
    title: string;
    description?: string;
    /** Actions (a button or link) sit after the text on wide screens and below it on phones. */
    children?: ReactNode;
    /** Centre everything, for panels that sit inside a card (a chart, a list). */
    centered?: boolean;
    className?: string;
};

/** The "nothing here yet" panel: a pressed-in field with a raised icon bubble, what is missing, and what to do about it. */
export function EmptyState({ Icon: StateIcon, title, description, children, centered = false, className }: EmptyStateProps) {
    return (
        <div className={cn('neu-well flex gap-4 p-6 sm:p-8', centered ? 'flex-col items-center text-center' : 'flex-col items-start sm:flex-row sm:items-center', className)}>
            <span className="neu-tile grid size-14 shrink-0 place-items-center [--neu-radius:9999px]">
                <StateIcon size={26} weight="bold" className="text-ink-muted" aria-hidden />
            </span>
            <div className="min-w-0">
                <p className="text-lg font-semibold text-ink">{title}</p>
                {description && <p className="mt-0.5 max-w-[60ch] text-[15px] text-ink-muted">{description}</p>}
            </div>
            {children && <div className={cn('flex flex-wrap gap-2', !centered && 'sm:ml-auto')}>{children}</div>}
        </div>
    );
}
