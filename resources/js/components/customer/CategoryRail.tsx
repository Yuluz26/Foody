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
 * A segmented control: the categories sit in a pressed-in track and the active one is a raised
 * thumb that slides between them (a shared-layout tween, same tokens as every other spatial move).
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
        <nav aria-label="Kategori menu" className="sticky top-0 z-30 bg-ground/90 py-2 shadow-[0_14px_16px_-18px_var(--neu-dark)] backdrop-blur-md">
            <div className="mx-auto max-w-6xl px-3 sm:px-8">
                <div className="neu-well-sm">
                    <div ref={railRef} className="no-scrollbar relative flex gap-1 overflow-x-auto p-2">
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
                                        'relative flex h-10 shrink-0 items-center gap-2 rounded-(--radius-control) py-1 pr-3.5 font-semibold whitespace-nowrap transition-colors duration-150',
                                        category.imageUrl ? 'pl-1.5' : 'pl-3.5',
                                        active ? 'text-ink' : 'text-ink-soft hover:text-ink',
                                    )}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="rail-thumb"
                                            className="absolute inset-0 rounded-(--radius-control) bg-panel shadow-(--shadow-raised-2xs)"
                                            transition={reduce ? { duration: 0 } : { duration: duration.base, ease: ease.inOut }}
                                        />
                                    )}
                                    {category.imageUrl && (
                                        <img src={imageSrc(category.imageUrl, 72)} alt="" className="relative z-10 size-8 shrink-0 rounded-[10px] object-cover" />
                                    )}
                                    <span className="relative z-10">{category.name}</span>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}
