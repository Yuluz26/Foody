import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';

/** Save and cancel, pinned to the bottom of long forms on small screens. */
export function FormFooter({ cancelHref, processing, isDirty, saveLabel = 'Simpan' }: { cancelHref?: string; processing: boolean; isDirty: boolean; saveLabel?: string }) {
    return (
        <div className="sticky bottom-0 z-20 -mx-4 mt-8 flex items-center justify-end gap-3 border-t-2 border-ink bg-ground/95 px-4 py-3 pb-safe sm:mx-0 sm:px-0 lg:static lg:bg-transparent lg:pb-3">
            {isDirty && !processing && <p className="mr-auto text-sm font-semibold text-ink-muted">Ada perubahan belum disimpan</p>}
            {cancelHref && (
                <Link href={cancelHref} className="flex h-12 items-center rounded-(--radius-control) px-4 font-semibold text-ink-soft hover:bg-rule/60 hover:text-ink">
                    Batal
                </Link>
            )}
            <Button type="submit" loading={processing} className="min-w-32">
                {processing ? 'Menyimpan...' : saveLabel}
            </Button>
        </div>
    );
}
