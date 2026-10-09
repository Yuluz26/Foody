import { CheckIcon, WarningIcon, XCircleIcon, type Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/format';
import type { StockState } from '@/types';

const STATES: Record<Exclude<StockState, 'untracked'>, { label: string; className: string; Icon: Icon }> = {
    ok: { label: 'Cukup', className: 'bg-leaf text-white', Icon: CheckIcon },
    low: { label: 'Hampir habis', className: 'bg-amber text-ink', Icon: WarningIcon },
    out: { label: 'Habis', className: 'bg-alert-tint text-alert ring-1 ring-alert/30 ring-inset', Icon: XCircleIcon },
};

/** Same chip family as StatusBadge, so a shelf warning reads like an order warning. Untracked dishes show nothing. */
export function StockBadge({ state, className }: { state: StockState; className?: string }) {
    if (state === 'untracked') {
        return null;
    }

    const { label, className: tone, Icon: StateIcon } = STATES[state];

    return (
        <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-(--radius-module) px-2.5 text-xs font-bold tracking-wide whitespace-nowrap uppercase shadow-(--shadow-raised-xs)', tone, className)}>
            <StateIcon size={14} weight="bold" aria-hidden />
            {label}
        </span>
    );
}
