import { BellRingingIcon, CheckIcon, CookingPotIcon, ReceiptIcon, ThumbsUpIcon, XCircleIcon, type Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/format';
import type { OrderStatus } from '@/types';

export const ORDER_STATUS: Record<OrderStatus, { label: string; action: string; className: string; Icon: Icon }> = {
    pending: { label: 'Baru', action: 'Tanda baru', className: 'bg-amber text-ink', Icon: ReceiptIcon },
    confirmed: { label: 'Disahkan', action: 'Sahkan', className: 'bg-amber-tint text-ink ring-1 ring-ink/20 ring-inset', Icon: ThumbsUpIcon },
    preparing: { label: 'Disediakan', action: 'Mula sediakan', className: 'bg-ink text-white', Icon: CookingPotIcon },
    ready: { label: 'Siap', action: 'Tanda siap', className: 'bg-leaf text-white', Icon: BellRingingIcon },
    completed: { label: 'Selesai', action: 'Selesai', className: 'bg-ground-deep text-ink-soft', Icon: CheckIcon },
    cancelled: { label: 'Dibatalkan', action: 'Batalkan', className: 'bg-alert-tint text-alert ring-1 ring-alert/30 ring-inset', Icon: XCircleIcon },
};

/** `label` swaps the wording where a surface speaks to the diner instead of staff; colour and icon stay shared. */
export function StatusBadge({ status, label: labelOverride, className }: { status: OrderStatus; label?: string; className?: string }) {
    const { label, className: tone, Icon: StatusIcon } = ORDER_STATUS[status];

    return (
        <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-(--radius-module) px-2.5 text-xs font-bold tracking-wide whitespace-nowrap uppercase shadow-(--shadow-raised-xs)', tone, className)}>
            <StatusIcon size={14} weight="bold" aria-hidden />
            {labelOverride ?? label}
        </span>
    );
}
