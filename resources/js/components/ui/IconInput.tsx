import type { Icon } from '@phosphor-icons/react';
import type { InputHTMLAttributes } from 'react';
import { inputClass } from '@/components/ui/Field';
import { cn } from '@/lib/format';

type ControlProps = {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: true;
};

/**
 * A small raised tile sitting inside a pressed-in field, carrying the field's icon. It lights up amber
 * while the field has focus. Put it in a `group relative` wrapper and give the input `pl-14`.
 */
export function FieldIcon({ icon: Glyph }: { icon: Icon }) {
    return (
        <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-[12px] bg-panel text-amber-deep shadow-(--shadow-raised-2xs) transition-colors duration-150 group-focus-within:bg-amber group-focus-within:text-ink"
        >
            <Glyph size={18} weight="bold" />
        </span>
    );
}

type IconInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
    icon: Icon;
    control: ControlProps;
};

/** A text field led by an icon tile. The visible label still comes from the surrounding <Field>. */
export function IconInput({ icon, control, className, ...props }: IconInputProps) {
    return (
        <div className="group relative">
            <FieldIcon icon={icon} />
            <input {...control} {...props} className={cn(inputClass, 'pl-14', className)} />
        </div>
    );
}
