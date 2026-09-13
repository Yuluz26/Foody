/**
 * Shared motion tokens. Every animated component reads from here so the whole
 * product moves with one rhythm: fast, decelerating, no bounce outside gestures.
 */
export const ease = {
    out: [0.23, 1, 0.32, 1],
    inOut: [0.77, 0, 0.175, 1],
    drawer: [0.32, 0.72, 0, 1],
} as const;

export const duration = {
    press: 0.12,
    fast: 0.18,
    base: 0.24,
    sheet: 0.38,
    exit: 0.2,
} as const;

/** For drag release and elements that should settle with a little life. */
export const spring = { type: 'spring', duration: 0.42, bounce: 0.14 } as const;
