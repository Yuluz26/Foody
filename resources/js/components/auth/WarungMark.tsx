import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { useEffect, useId } from 'react';

const STRIPE_WIDTH = 15.2;
const STRIPES = [0, 1, 2, 3, 4];
const STEAM_X = [50, 60, 70];

const INK = 'var(--color-ink)';
const AMBER = 'var(--color-amber)';
const CREAM = '#fff6e6';

type WarungMarkProps = {
    className?: string;
    /** Bump this number to play the little "hello" again (hover or tap on the badge). */
    play?: number;
};

/**
 * The warung mark: a striped stall awning over a bowl of nasi lemak. It builds itself once — the roof
 * and awning drop in, the posts rise, the bowl settles and the sambal pops — then only the steam keeps
 * moving. Each `play` bump sways the awning, hops the bowl, pops the sambal and puffs the steam.
 * With reduced motion it is simply drawn finished, steam and all, with nothing animating.
 */
export function WarungMark({ className, play = 0 }: WarungMarkProps) {
    const reduce = useReducedMotion();
    const clipId = useId();
    const awning = useAnimationControls();
    const bowl = useAnimationControls();
    const sambal = useAnimationControls();
    const steam = useAnimationControls();

    // The hello lives on wrapper groups of its own, so it never fights the entrance animation inside them.
    useEffect(() => {
        if (play === 0 || reduce) {
            return;
        }

        void awning.start({ rotate: [0, -6, 5, -3, 1.5, 0], transition: { duration: 0.9, ease: 'easeInOut' } });
        void bowl.start({ y: [0, -7, 0, -2.5, 0], transition: { duration: 0.6, ease: 'easeOut', delay: 0.05 } });
        void sambal.start({ scale: [1, 1.45, 0.9, 1.08, 1], transition: { duration: 0.55, ease: 'easeOut', delay: 0.18 } });
        void steam.start({ scaleY: [1, 1.4, 1], transition: { duration: 0.85, ease: 'easeOut' } });
    }, [play, reduce, awning, bowl, sambal, steam]);

    // Entrance props for one part, or nothing at all when motion is reduced.
    const enter = (from: Record<string, number>, delay: number, bouncy = false) =>
        reduce
            ? {}
            : {
                  initial: from,
                  animate: Object.fromEntries(Object.keys(from).map((key) => [key, key === 'opacity' || key.startsWith('scale') ? 1 : 0])),
                  transition: bouncy ? { type: 'spring' as const, duration: 0.5, bounce: 0.45, delay } : { duration: 0.42, ease: [0.23, 1, 0.32, 1] as const, delay },
              };

    return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden focusable="false">
            <defs>
                <clipPath id={clipId}>
                    <rect x="22" y="19" width="76" height="13" />
                    {STRIPES.map((stripe) => (
                        <circle key={stripe} cx={22 + STRIPE_WIDTH / 2 + STRIPE_WIDTH * stripe} cy="32" r={STRIPE_WIDTH / 2} />
                    ))}
                </clipPath>
            </defs>

            {/* Counter and the two posts that hold the awning up. */}
            <motion.rect x="14" y="92" width="92" height="7" rx="3.5" fill={INK} style={{ originX: 0.5 }} {...enter({ scaleX: 0 }, 0)} />
            <motion.rect x="24" y="34" width="3.5" height="59" rx="1.75" fill={INK} style={{ originY: 1 }} {...enter({ scaleY: 0 }, 0.12)} />
            <motion.rect x="92.5" y="34" width="3.5" height="59" rx="1.75" fill={INK} style={{ originY: 1 }} {...enter({ scaleY: 0 }, 0.12)} />

            {/* Awning and roof: stripes cut into a scalloped edge with a soft shadow under it; sways from the roof on hello. */}
            <motion.g animate={awning} style={{ originX: 0.5, originY: 0 }}>
                <motion.g style={{ originY: 0 }} {...enter({ scaleY: 0, opacity: 0 }, 0.28)}>
                    <g clipPath={`url(#${clipId})`} transform="translate(0 2.5)" opacity="0.18">
                        <rect x="22" y="19" width="76" height="22" fill={INK} />
                    </g>
                    <g clipPath={`url(#${clipId})`}>
                        {STRIPES.map((stripe) => (
                            <rect key={stripe} x={22 + STRIPE_WIDTH * stripe} y="19" width={STRIPE_WIDTH} height="22" fill={stripe % 2 === 0 ? AMBER : CREAM} />
                        ))}
                    </g>
                </motion.g>
                <motion.rect x="16" y="13" width="88" height="8" rx="4" fill={INK} style={{ originX: 0.5 }} {...enter({ scaleX: 0 }, 0.2)} />
            </motion.g>

            {/* Steam keeps rising from the bowl: the one part that never stops. It stretches up on hello. */}
            <motion.g animate={steam} style={{ originX: 0.5, originY: 1 }}>
                {STEAM_X.map((x, index) => (
                    <motion.path
                        key={x}
                        d={`M${x} 62 c-3.5 -3.5 3.5 -6.5 0 -10 c-3.5 -3.5 3.5 -6.5 0 -10`}
                        fill="none"
                        stroke="#8a7f68"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        initial={reduce ? false : { opacity: 0, y: 4 }}
                        animate={reduce ? { opacity: 0.55 } : { opacity: [0, 0.8, 0], y: [4, -2, -8] }}
                        transition={reduce ? undefined : { duration: 2.6, ease: 'easeOut', repeat: Infinity, delay: 1 + index * 0.6 }}
                    />
                ))}
            </motion.g>

            {/* The bowl of nasi lemak settles onto the counter, then the sambal pops on top. Both hop on hello. */}
            <motion.g animate={bowl}>
                <motion.g {...enter({ y: 10, opacity: 0 }, 0.5, true)}>
                    <path d="M38 78 h44 a22 15 0 0 1 -44 0 z" fill="var(--color-ink-soft)" />
                    <rect x="35.5" y="76.5" width="49" height="4" rx="2" fill="#6b624f" />
                    <path d="M43 77 a17 12.5 0 0 1 34 0 z" fill="#fffaf0" />
                    <ellipse cx="52" cy="72.5" rx="5.5" ry="4.2" fill="#ffffff" stroke="#efe2c8" strokeWidth="0.8" />
                    <circle cx="52.6" cy="72.7" r="2.4" fill="#ffb53d" />
                </motion.g>
                <motion.g animate={sambal} style={{ originX: 0.5, originY: 0.5 }}>
                    <motion.circle cx="67.5" cy="71.5" r="4.6" fill="var(--color-alert)" style={{ originX: 0.5, originY: 0.5 }} {...enter({ scale: 0 }, 0.85, true)} />
                </motion.g>
            </motion.g>
        </svg>
    );
}
