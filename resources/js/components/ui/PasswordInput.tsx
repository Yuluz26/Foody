import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import { useId, useState } from 'react';
import { inputClass } from '@/components/ui/Field';
import { cn } from '@/lib/format';

type ControlProps = {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: true;
};

type PasswordInputProps = {
    control: ControlProps;
    value: string;
    onChange: (value: string) => void;
    autoComplete: 'current-password' | 'new-password';
};

/** A password field with a show/hide toggle — expected in every modern login/register form. */
export function PasswordInput({ control, value, onChange, autoComplete }: PasswordInputProps) {
    const [revealed, setRevealed] = useState(false);
    const toggleId = useId();

    return (
        <div className="relative">
            <input
                {...control}
                type={revealed ? 'text' : 'password'}
                autoComplete={autoComplete}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={cn(inputClass, 'pr-12')}
            />
            <button
                type="button"
                onClick={() => setRevealed((current) => !current)}
                aria-pressed={revealed}
                aria-label={revealed ? 'Sembunyikan kata laluan' : 'Tunjukkan kata laluan'}
                aria-describedby={toggleId}
                className="absolute inset-y-0 right-0 grid w-12 place-items-center text-ink-muted transition-colors duration-150 hover:text-ink"
            >
                {revealed ? <EyeSlashIcon size={20} weight="bold" aria-hidden /> : <EyeIcon size={20} weight="bold" aria-hidden />}
            </button>
            <span id={toggleId} className="sr-only">
                {revealed ? 'Kata laluan ditunjukkan' : 'Kata laluan disembunyikan'}
            </span>
        </div>
    );
}
