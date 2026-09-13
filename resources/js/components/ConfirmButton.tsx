import { useState } from 'react';
import { Sheet } from '@/components/Sheet';
import { Button, type ButtonProps } from '@/components/ui/Button';

type ConfirmButtonProps = {
    label: string;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
    disabled?: boolean;
    className?: string;
};

/** For destructive actions: a second, explicit step with a safe way out. */
export function ConfirmButton({ label, title, message, confirmLabel, onConfirm, variant = 'quiet', size = 'sm', disabled, className }: ConfirmButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant={variant} size={size} disabled={disabled} className={className} onClick={() => setOpen(true)}>
                {label}
            </Button>
            <Sheet open={open} onClose={() => setOpen(false)} title={title}>
                <div className="px-5 pb-6 md:px-6">
                    <p className="max-w-[52ch] text-base text-ink-soft">{message}</p>
                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Tidak
                        </Button>
                        <Button
                            variant="alert"
                            onClick={() => {
                                setOpen(false);
                                onConfirm();
                            }}
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </div>
            </Sheet>
        </>
    );
}
