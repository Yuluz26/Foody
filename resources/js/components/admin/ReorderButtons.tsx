import { ArrowDownIcon, ArrowUpIcon } from '@phosphor-icons/react';
import { buttonClass } from '@/components/ui/Button';

type ReorderButtonsProps = {
    /** What is being moved, for the accessible labels ("Naikkan Nasi"). */
    name: string;
    index: number;
    count: number;
    onMove: (direction: -1 | 1) => void;
};

const moveButton = buttonClass({ variant: 'soft', size: 'sm', icon: true });

/** Up and down for ordered admin lists (categories, slides). The first can't go up, the last can't go down. */
export function ReorderButtons({ name, index, count, onMove }: ReorderButtonsProps) {
    return (
        <>
            <button type="button" className={moveButton} disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Naikkan ${name}`}>
                <ArrowUpIcon size={16} weight="bold" aria-hidden />
            </button>
            <button type="button" className={moveButton} disabled={index === count - 1} onClick={() => onMove(1)} aria-label={`Turunkan ${name}`}>
                <ArrowDownIcon size={16} weight="bold" aria-hidden />
            </button>
        </>
    );
}
