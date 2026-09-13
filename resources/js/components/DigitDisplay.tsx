import { cn } from '@/lib/format';

type DigitTone = 'amber' | 'leaf' | 'dim' | 'ink' | 'white';

type DigitDisplayProps = {
    /** The characters to show: digits render lit (or dim), anything else rides along in the same face. */
    value: string;
    /** Lit colour. Defaults to amber inside a chip, ink for a plain inline numeral. */
    tone?: DigitTone;
    /** Wrap in the dark instrument housing with the unlit-segment ghost. Off for a plain inline tabular numeral, e.g. a dish row price. */
    chip?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    /** A fuller accessible name (e.g. "Nombor pesanan FD0003"). Optional: the digits are correct, selectable, copyable text on their own without it. */
    label?: string;
};

const toneText: Record<DigitTone, string> = {
    amber: 'text-amber',
    leaf: 'text-leaf',
    dim: 'text-ink-muted',
    ink: 'text-ink',
    white: 'text-white',
};

const sizes: Record<NonNullable<DigitDisplayProps['size']>, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-3xl',
    xl: 'text-5xl',
};

/**
 * The signature primitive: a real LED-style digit readout. Every number the product
 * owns — order number, table, price, counts, KPI tiles — reads through this face.
 * In "chip" mode it sits inside a dark instrument module with a soft amber backlight;
 * in inline mode it drops the housing for plain tabular numerals riding with body text.
 */
export function DigitDisplay({ value, tone, chip = true, size = 'md', className, label }: DigitDisplayProps) {
    const resolvedTone = tone ?? (chip ? 'amber' : 'ink');

    return (
        <span
            aria-label={label}
            className={cn(
                'digit-face inline-flex items-baseline',
                sizes[size],
                toneText[resolvedTone],
                // A blur wide enough to read as "backlit" reads as a garbled smear once digits sit this
                // close together in a tight monospace row — kept small enough to stay legible at every size.
                chip && 'rounded-(--radius-module) bg-module px-2 py-1 shadow-(--shadow-module) [text-shadow:0_0_1px_currentColor]',
                className,
            )}
        >
            {value}
        </span>
    );
}
