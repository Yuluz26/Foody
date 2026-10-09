import { Link } from '@inertiajs/react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { buttonClass } from '@/components/ui/Button';
import type { Paginated } from '@/types';

const pageButton = buttonClass({ variant: 'soft', size: 'md' });

export function Pagination({ page }: { page: Paginated<unknown> }) {
    if (page.last_page <= 1) {
        return null;
    }

    return (
        <nav aria-label="Halaman" className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="tabular text-sm text-ink-muted">
                {page.from} hingga {page.to} daripada {page.total}
            </p>
            <div className="flex gap-3">
                {page.prev_page_url ? (
                    <Link href={page.prev_page_url} preserveScroll className={pageButton}>
                        <CaretLeftIcon size={16} weight="bold" aria-hidden />
                        Sebelum
                    </Link>
                ) : (
                    <span aria-disabled="true" className={pageButton}>
                        <CaretLeftIcon size={16} weight="bold" aria-hidden />
                        Sebelum
                    </span>
                )}
                {page.next_page_url ? (
                    <Link href={page.next_page_url} preserveScroll className={pageButton}>
                        Seterusnya
                        <CaretRightIcon size={16} weight="bold" aria-hidden />
                    </Link>
                ) : (
                    <span aria-disabled="true" className={pageButton}>
                        Seterusnya
                        <CaretRightIcon size={16} weight="bold" aria-hidden />
                    </span>
                )}
            </div>
        </nav>
    );
}
