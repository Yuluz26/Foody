import { Link } from '@inertiajs/react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/format';
import type { Paginated } from '@/types';

const linkClass = 'flex h-11 items-center gap-1.5 rounded-(--radius-control) border-2 px-3 font-semibold transition-[transform,background-color,color] duration-150 hover:-translate-y-0.5 active:translate-y-0';

export function Pagination({ page }: { page: Paginated<unknown> }) {
    if (page.last_page <= 1) {
        return null;
    }

    return (
        <nav aria-label="Halaman" className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="tabular text-sm text-ink-muted">
                {page.from} hingga {page.to} daripada {page.total}
            </p>
            <div className="flex gap-2">
                {page.prev_page_url ? (
                    <Link href={page.prev_page_url} preserveScroll className={cn(linkClass, 'border-ink hover:bg-ink hover:text-white')}>
                        <CaretLeftIcon size={16} weight="bold" aria-hidden />
                        Sebelum
                    </Link>
                ) : (
                    <span aria-disabled="true" className={cn(linkClass, 'border-rule text-ink-muted')}>
                        <CaretLeftIcon size={16} weight="bold" aria-hidden />
                        Sebelum
                    </span>
                )}
                {page.next_page_url ? (
                    <Link href={page.next_page_url} preserveScroll className={cn(linkClass, 'border-ink hover:bg-ink hover:text-white')}>
                        Seterusnya
                        <CaretRightIcon size={16} weight="bold" aria-hidden />
                    </Link>
                ) : (
                    <span aria-disabled="true" className={cn(linkClass, 'border-rule text-ink-muted')}>
                        Seterusnya
                        <CaretRightIcon size={16} weight="bold" aria-hidden />
                    </span>
                )}
            </div>
        </nav>
    );
}
