/**
 * A short, cheerful three-note bell arpeggio for "a new order just arrived", synthesised
 * with the Web Audio API so the feature needs no external sound file to ship or license.
 */

let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!Ctor) {
        return null;
    }

    sharedContext ??= new Ctor();

    return sharedContext;
}

function playNote(context: AudioContext, frequency: number, startAt: number, duration: number, peakGain: number): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;

    // A fast attack then an exponential decay is what reads as a "bell" rather than a buzz;
    // gain can't ramp to exactly 0 exponentially, so the tail is cut with a linear step to silence.
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    gain.gain.linearRampToValueAtTime(0, startAt + duration + 0.02);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.03);
}

/** Best-effort: browsers that block audio without a prior user gesture simply stay silent. */
export function playNewOrderChime(): void {
    try {
        const context = getContext();

        if (!context) {
            return;
        }

        if (context.state === 'suspended') {
            void context.resume();
        }

        const now = context.currentTime;
        // A bright major arpeggio (C6, E6, G6, high C7) — cheerful, quick, easy to tell apart from errors.
        // Loud on purpose: this has to cut through a noisy kitchen/counter, not just a quiet office.
        const notes: Array<[frequency: number, offset: number, duration: number, gain: number]> = [
            [1046.5, 0, 0.16, 0.38],
            [1318.5, 0.09, 0.16, 0.38],
            [1568.0, 0.18, 0.22, 0.42],
            [2093.0, 0.3, 0.28, 0.34],
        ];

        for (const [frequency, offset, duration, gain] of notes) {
            playNote(context, frequency, now + offset, duration, gain);
        }
    } catch {
        // Audio is a nice-to-have; a blocked or unsupported context must never break the page.
    }
}

/**
 * A firmer, descending two-note knock for "a customer cancelled their own order" — deliberately
 * lower and falling (rather than the new-order chime's bright rising run) so staff can tell the
 * two apart by ear without looking at the screen. Just as loud, for the same noisy-counter reason.
 */
export function playOrderCancelledChime(): void {
    try {
        const context = getContext();

        if (!context) {
            return;
        }

        if (context.state === 'suspended') {
            void context.resume();
        }

        const now = context.currentTime;
        const notes: Array<[frequency: number, offset: number, duration: number, gain: number]> = [
            [880.0, 0, 0.2, 0.42],
            [659.25, 0.16, 0.32, 0.44],
        ];

        for (const [frequency, offset, duration, gain] of notes) {
            playNote(context, frequency, now + offset, duration, gain);
        }
    } catch {
        // Audio is a nice-to-have; a blocked or unsupported context must never break the page.
    }
}
