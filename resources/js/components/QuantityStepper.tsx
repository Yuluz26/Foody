import { MinusIcon, PlusIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { MAX_QUANTITY } from '@/cart/CartProvider';
import { DigitDisplay } from '@/components/DigitDisplay';
import { buttonClass } from '@/components/ui/Button';
import { cn } from '@/lib/format';
import { duration, ease } from '@/lib/motion';

type QuantityStepperProps = {
    value: number;
    onChange: (value: number) => void;
    label: string;
    min?: number;
    max?: number;
    size?: 'sm' | 'md';
};

/** Two raised round buttons around a pressed-in readout. The count flips up when it grows, down when it shrinks. */
export function QuantityStepper({ value, onChange, label, min = 1, max = MAX_QUANTITY, size = 'md' }: QuantityStepperProps) {
    const reduce = useReducedMotion();
    const previous = useRef(value);
    const direction = value >= previous.current ? 1 : -1;
    previous.current = value;

    const stepClass = buttonClass({ variant: 'soft', size: size === 'sm' ? 'sm' : 'md', icon: true });

    return (
        <div role="group" aria-label={label} className="neu-well-sm inline-flex items-center gap-1 p-1 [--neu-radius:9999px]">
            <button type="button" className={stepClass} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Kurangkan ${label}`}>
                <MinusIcon size={size === 'sm' ? 16 : 18} weight="bold" aria-hidden />
            </button>
            <span className={cn('relative overflow-hidden text-center', size === 'sm' ? 'h-10 w-8' : 'h-12 w-10')}>
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={value}
                        className="absolute inset-0 grid place-items-center"
                        initial={reduce ? { opacity: 0 } : { opacity: 0, transform: `translateY(${direction * 70}%)` }}
                        animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0%)' }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, transform: `translateY(${direction * -70}%)` }}
                        transition={{ duration: duration.fast, ease: ease.out }}
                    >
                        <DigitDisplay value={String(value)} chip={false} tone="ink" size={size === 'sm' ? 'sm' : 'md'} />
                    </motion.span>
                </AnimatePresence>
                <span className="sr-only" aria-live="polite">
                    Kuantiti {value}
                </span>
            </span>
            <button type="button" className={stepClass} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Tambah ${label}`}>
                <PlusIcon size={size === 'sm' ? 16 : 18} weight="bold" aria-hidden />
            </button>
        </div>
    );
}
