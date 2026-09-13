import { ImageSquareIcon, TrashIcon, UploadSimpleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useEffect, useId, useRef, useState } from 'react';
import { FoodImage } from '@/components/FoodImage';
import { cn } from '@/lib/format';

type ImageInputProps = {
    label: string;
    currentUrl: string | null;
    file: File | null;
    removed: boolean;
    onFileChange: (file: File | null) => void;
    onRemovedChange: (removed: boolean) => void;
    error?: string;
    maxMb?: number;
    aspect?: 'square' | 'photo';
};

const ACCEPT = 'image/jpeg,image/png,image/webp';

export function ImageInput({ label, currentUrl, file, removed, onFileChange, onRemovedChange, error, maxMb = 3, aspect = 'photo' }: ImageInputProps) {
    const id = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setPreview(null);

            return;
        }

        const url = URL.createObjectURL(file);
        setPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [file]);

    const shownUrl = preview ?? (removed ? null : currentUrl);
    const message = localError ?? error;

    return (
        <div className="grid gap-2">
            <span id={`${id}-label`} className="text-[15px] font-semibold text-ink">
                {label}
            </span>
            <div className="flex flex-wrap items-start gap-4">
                <div className={cn('shrink-0 overflow-hidden rounded-(--radius-panel) border-2 border-rule-strong', aspect === 'square' ? 'size-28' : 'aspect-[4/3] w-44')}>
                    {shownUrl ? (
                        preview ? (
                            <img src={preview} alt="Pratonton gambar baru" className="size-full object-cover" />
                        ) : (
                            <FoodImage url={shownUrl} alt="Gambar semasa" sizes="176px" className="size-full" />
                        )
                    ) : (
                        <div className="grid size-full place-items-center bg-ground text-rule-strong">
                            <ImageSquareIcon size={32} weight="bold" aria-hidden />
                        </div>
                    )}
                </div>
                <div className="grid gap-2">
                    <input
                        ref={inputRef}
                        id={id}
                        type="file"
                        accept={ACCEPT}
                        aria-labelledby={`${id}-label`}
                        aria-describedby={`${id}-hint${message ? ` ${id}-error` : ''}`}
                        className="sr-only"
                        onChange={(event) => {
                            const chosen = event.target.files?.[0] ?? null;

                            if (chosen && chosen.size > maxMb * 1024 * 1024) {
                                setLocalError(`Saiz gambar maksimum ${maxMb} MB. Pilih fail yang lebih kecil.`);
                                event.target.value = '';

                                return;
                            }

                            setLocalError(null);
                            onFileChange(chosen);
                            onRemovedChange(false);
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex h-11 items-center gap-2 rounded-(--radius-control) border-2 border-rule-strong px-3 font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-white hover:shadow-(--shadow-lift) active:translate-y-0"
                    >
                        <UploadSimpleIcon size={18} weight="bold" aria-hidden />
                        {shownUrl ? 'Tukar gambar' : 'Pilih gambar'}
                    </button>
                    {shownUrl && (
                        <button
                            type="button"
                            onClick={() => {
                                onFileChange(null);
                                onRemovedChange(Boolean(currentUrl));

                                if (inputRef.current) {
                                    inputRef.current.value = '';
                                }
                            }}
                            className="group flex h-10 items-center gap-2 rounded-(--radius-control) px-3 text-sm font-semibold text-ink-soft transition-colors duration-150 hover:bg-alert-tint hover:text-alert"
                        >
                            <TrashIcon size={16} weight="bold" aria-hidden className="transition-transform duration-150 ease-out group-hover:-rotate-12" />
                            Buang gambar
                        </button>
                    )}
                    <p id={`${id}-hint`} className="text-sm text-ink-muted">
                        JPG, PNG atau WebP, maksimum {maxMb} MB.
                    </p>
                </div>
            </div>
            {message && (
                <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm font-semibold text-alert">
                    <WarningCircleIcon size={18} weight="bold" aria-hidden />
                    {message}
                </p>
            )}
        </div>
    );
}
