import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { cn, imageSrc } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import type { MenuCategory } from '@/types';

type CategoryRailProps = {
    categories: MenuCategory[];
    activeId: number | null;
    onSelect: (category: MenuCategory) => void;
};

/**
 * Sticky category chips, led by each category's own dish photo — the same photo-forward
 * language as the dish grid below, so the rail reads as a preview of what's in each
 * section instead of a plain text list. The active chip's ink fill slides between tabs
 * (a shared-layout tween, same tokens as every other spatial-continuity move in the app).
 */
export function CategoryRail({ categories, activeId, onSelect }: CategoryRailProps) {
    const railRef = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();

    // Keep the active tab centred in the horizontally scrolling rail.
    useEffect(() => {
        const rail = railRef.current;
        const tab = rail?.querySelector<HTMLElement>(`[data-category="${activeId}"]`);

        if (rail && tab) {
            rail.scrollTo({
                left: tab.offsetLeft - rail.clientWidth / 2 + tab.clientWidth / 2,
                behavior: reduce ? 'auto' : 'smooth',
            });
        }
    }, [activeId, reduce]);

    return (
        <nav aria-label="Kategori menu" className="sticky top-0 z-30 border-b-2 border-rule bg-panel/95 py-2.5 backdrop-blur-sm">
            <div ref={railRef} className="no-scrollbar mx-auto flex max-w-6xl gap-2 overflow-x-auto px-3 sm:px-8">
                {categories.map((category) => {
                    const active = category.id === activeId;

                    return (
                        <a
                            key={category.id}
                            href={`#kategori-${category.slug}`}
                            data-category={category.id}
                            aria-current={active ? 'true' : undefined}
                            onClick={(event) => {
                                event.preventDefault();
                                onSelect(category);
                            }}
                            className={cn(
                                'group relative flex h-11 shrink-0 items-center gap-2 rounded-(--radius-control) border-2 py-1 pr-4 font-semibold whitespace-nowrap transition-colors duration-150',
                                category.imageUrl ? 'pl-1' : 'pl-4',
                                active ? 'border-ink text-white' : 'border-rule-strong text-ink-soft hover:border-ink-muted hover:text-ink',
                            )}
                        >
                            {active && (
                                <motion.span
                                    layoutId="rail-fill"
                                    className="absolute inset-0 rounded-(--radius-control) bg-ink"
                                    transition={reduce ? { duration: 0 } : { duration: duration.base, ease: ease.inOut }}
                                />
                            )}
                            {category.imageUrl && (
                                <img
                                    src={imageSrc(category.imageUrl, 72)}
                                    alt=""
                                    className={cn(
                                        'relative z-10 size-9 shrink-0 rounded-(--radius-module) border-2 object-cover transition-colors duration-150',
                                        active ? 'border-white/25' : 'border-rule-strong group-hover:border-ink/30',
                                    )}
                                />
                            )}
                            <span className="relative z-10">{category.name}</span>
                        </a>
                    );
                })}
            </div>
        </nav>
    );
}
