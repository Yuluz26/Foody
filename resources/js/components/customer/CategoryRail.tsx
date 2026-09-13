import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import type { MenuCategory } from '@/types';

type CategoryRailProps = {
    categories: MenuCategory[];
    activeId: number | null;
    onSelect: (category: MenuCategory) => void;
};

/** Sticky numbered tabs. The amber underline slides to the section in view. */
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
        <nav aria-label="Kategori menu" className="sticky top-0 z-30 border-b-2 border-rule bg-panel/95 backdrop-blur-sm">
            <div ref={railRef} className="no-scrollbar mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 sm:px-8">
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
                                'relative flex h-14 shrink-0 items-center px-3 font-semibold whitespace-nowrap transition-colors duration-150',
                                active ? 'text-ink' : 'text-ink-muted hover:text-ink-soft',
                            )}
                        >
                            {category.name}
                            {active && (
                                <motion.span
                                    layoutId="rail-underline"
                                    className="absolute inset-x-2 -bottom-0.5 h-1 rounded-full bg-amber"
                                    transition={reduce ? { duration: 0 } : { duration: duration.base, ease: ease.inOut }}
                                />
                            )}
                        </a>
                    );
                })}
            </div>
        </nav>
    );
}
