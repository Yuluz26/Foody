import { CaretLeftIcon, CaretRightIcon, PauseIcon, PlayIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import type { MenuBanner } from '@/types';

const INTERVAL = 5500;

/** A rotating photo strip above the menu — the food's own moment before the list begins. */
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
            className="mb-6"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onFocus={() => setHovering(true)}
            onBlur={() => setHovering(false)}
        >
            <div
                role="group"
                aria-roledescription="carousel"
                aria-label="Gambar promosi"
                className="group/slider relative aspect-[16/7] overflow-hidden rounded-(--radius-panel) border-2 border-rule-strong bg-module"
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
                        <button
                            type="button"
                            onClick={() => go(index - 1)}
                            aria-label="Slaid sebelumnya"
                            className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-(--radius-control) bg-ink/50 text-white opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover/slider:opacity-100 group-focus-within/slider:opacity-100 hover:bg-ink/70"
                        >
                            <CaretLeftIcon size={20} weight="bold" aria-hidden />
                        </button>
                        <button
                            type="button"
                            onClick={() => go(index + 1)}
                            aria-label="Slaid seterusnya"
                            className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-(--radius-control) bg-ink/50 text-white opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover/slider:opacity-100 group-focus-within/slider:opacity-100 hover:bg-ink/70"
                        >
                            <CaretRightIcon size={20} weight="bold" aria-hidden />
                        </button>

                        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2.5">
                            <div className="flex items-center gap-1.5 rounded-(--radius-control) bg-ink/40 px-2 py-1.5 backdrop-blur-sm">
                                {banners.map((banner, dotIndex) => (
                                    <button
                                        key={banner.id}
                                        type="button"
                                        onClick={() => go(dotIndex)}
                                        aria-label={`Pergi ke slaid ${dotIndex + 1}`}
                                        aria-current={dotIndex === index}
                                        className={cn('h-1.5 rounded-full transition-all duration-200', dotIndex === index ? 'w-5 bg-amber' : 'w-1.5 bg-white/60 hover:bg-white')}
                                    />
                                ))}
                                {!reduce && (
                                    <button
                                        type="button"
                                        onClick={() => setPlaying((value) => !value)}
                                        aria-label={playing ? 'Jeda slaid' : 'Mainkan slaid'}
                                        className="ml-0.5 grid size-5 place-items-center text-white/80 hover:text-white"
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
    );
}
