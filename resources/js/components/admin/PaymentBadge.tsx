import { ClockIcon, CreditCardIcon, HourglassMediumIcon, type Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/format';
import type { PaymentStatus } from '@/types';

export const ADMIN_PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string; Icon: Icon }> = {
    unpaid: { label: 'Belum bayar', className: 'bg-rule/70 text-ink-soft', Icon: ClockIcon },
    pending_verification: { label: 'Menunggu semakan', className: 'bg-amber-tint text-ink ring-1 ring-ink/20 ring-inset', Icon: HourglassMediumIcon },
    paid: { label: 'Sudah bayar', className: 'bg-leaf text-white', Icon: CreditCardIcon },
};

export function PaymentBadge({ status, className }: { status: PaymentStatus; className?: string }) {
    const { label, className: tone, Icon: StatusIcon } = ADMIN_PAYMENT_STATUS[status];

    return (
        <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-(--radius-module) px-2.5 text-xs font-bold tracking-wide whitespace-nowrap uppercase', tone, className)}>
            <StatusIcon size={14} weight="bold" aria-hidden />
            {label}
        </span>
    );
}
