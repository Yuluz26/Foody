import { Link } from '@inertiajs/react';
import { Button, buttonClass } from '@/components/ui/Button';

/** Save and cancel, pinned to the bottom of long forms on small screens. */
export function FormFooter({ cancelHref, processing, isDirty, saveLabel = 'Simpan' }: { cancelHref?: string; processing: boolean; isDirty: boolean; saveLabel?: string }) {
    return (
        <div className="sticky bottom-0 z-20 -mx-4 mt-8 flex items-center justify-end gap-3 rounded-t-(--radius-panel) bg-ground/95 px-4 py-3 pb-safe shadow-[0_-12px_18px_-14px_var(--neu-dark)] backdrop-blur-sm sm:mx-0 sm:px-0 lg:static lg:rounded-none lg:bg-transparent lg:pb-3 lg:shadow-none lg:backdrop-blur-none">
            {isDirty && !processing && <p className="mr-auto text-sm font-semibold text-ink-muted">Ada perubahan belum disimpan</p>}
            {cancelHref && (
                <Link href={cancelHref} className={buttonClass({ variant: 'quiet' })}>
                    Batal
                </Link>
            )}
            <Button type="submit" loading={processing} className="min-w-32">
                {processing ? 'Menyimpan...' : saveLabel}
            </Button>
        </div>
    );
}
