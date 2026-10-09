import { CaretLeftIcon, CaretRightIcon, PauseIcon, PlayIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { cn } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import type { MenuBanner } from '@/types';

const INTERVAL = 5500;
const arrowClass = (side: 'left-3' | 'right-3') =>
    buttonClass({
        variant: 'soft',
        size: 'sm',
        icon: true,
        className: cn('absolute top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/slider:opacity-100 group-focus-within/slider:opacity-100 focus-visible:opacity-100', side),
    });

/** A rotating photo strip above the menu: the food's own moment before the list begins. */
export function MenuSlider({ banners }: { banners: MenuBanner[] }) {
    const [index, setIndex] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [hovering, setHovering] = useState(false);
    const reduce = useReducedMotion();
    const advancing = playing && !hovering && !reduce && banners.length > 1;

    useEffect(() => {
        if (!advancing) {
            return;
        }

        const timer = window.setInterval(() => setIndex((current) => (current + 1) % banners.length), INTERVAL);

        return () => window.clearInterval(timer);
    }, [advancing, banners.length]);

    if (banners.length === 0) {
        return null;
    }

    const go = (next: number) => setIndex(((next % banners.length) + banners.length) % banners.length);

    return (
        <div
            className="mb-7"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onFocus={() => setHovering(true)}
            onBlur={() => setHovering(false)}
        >
            <div className="neu-card p-2">
                <div
                    role="group"
                    aria-roledescription="carousel"
                    aria-label="Gambar promosi"
                    className="group/slider relative aspect-[16/7] overflow-hidden rounded-[calc(var(--radius-panel)-8px)] bg-ground-deep"
                >
                    <AnimatePresence initial={false} mode="popLayout">
                        <motion.img
                            key={banners[index].id}
                            src={banners[index].imageUrl}
                            alt=""
                            className="absolute inset-0 size-full object-cover"
                            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(1.03)' }}
                            animate={{ opacity: 1, transform: 'scale(1)' }}
                            exit={{ opacity: 0, transition: { duration: duration.exit } }}
                            transition={{ duration: duration.sheet, ease: ease.out }}
                        />
                    </AnimatePresence>

                    {banners.length > 1 && (
                        <>
                            <button type="button" onClick={() => go(index - 1)} aria-label="Slaid sebelumnya" className={arrowClass('left-3')}>
                                <CaretLeftIcon size={18} weight="bold" aria-hidden />
                            </button>
                            <button type="button" onClick={() => go(index + 1)} aria-label="Slaid seterusnya" className={arrowClass('right-3')}>
                                <CaretRightIcon size={18} weight="bold" aria-hidden />
                            </button>

                            <div className="absolute inset-x-0 bottom-3 flex justify-center">
                                <div className="flex items-center rounded-full bg-panel/85 px-1.5 shadow-(--shadow-raised-2xs) backdrop-blur-sm">
                                    {banners.map((banner, dotIndex) => (
                                        <button
                                            key={banner.id}
                                            type="button"
                                            onClick={() => go(dotIndex)}
                                            aria-label={`Pergi ke slaid ${dotIndex + 1}`}
                                            aria-current={dotIndex === index}
                                            className="grid size-6 place-items-center"
                                        >
                                            <span className={cn('h-1.5 rounded-full transition-all duration-200', dotIndex === index ? 'w-5 bg-amber-deep' : 'w-1.5 bg-ink/35')} />
                                        </button>
                                    ))}
                                    {!reduce && (
                                        <button
                                            type="button"
                                            onClick={() => setPlaying((value) => !value)}
                                            aria-label={playing ? 'Jeda slaid' : 'Mainkan slaid'}
                                            className="grid size-6 place-items-center text-ink-soft hover:text-ink"
                                        >
                                            {playing ? <PauseIcon size={12} weight="bold" aria-hidden /> : <PlayIcon size={12} weight="bold" aria-hidden />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
