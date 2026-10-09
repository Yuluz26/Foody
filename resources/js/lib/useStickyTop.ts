import { useEffect, type RefObject } from 'react';

/**
 * Publishes `--sticky-top` on a `position: sticky` element: the distance from the viewport's top edge to where the element currently starts. Until it sticks that is the top of the
 * box it rests in; once stuck it is the element's own `top` offset. CSS can then end the element a gutter above the viewport's bottom, `calc(100dvh - var(--sticky-top) - 1.5rem)`,
 * so it fills the viewport while stuck and still fits on screen at scroll 0, without guessing how far down the page it starts.
 *
 * @param rest The element's non-sticky container: its top edge is where the element sits before it sticks.
 */
export function useStickyTop(rest: RefObject<HTMLElement | null>, element: RefObject<HTMLElement | null>, enabled: boolean): void {
    useEffect(() => {
        const container = rest.current;
        const target = element.current;

        if (!enabled || !container || !target) {
            return;
        }

        const stuckAt = Number.parseFloat(getComputedStyle(target).top) || 0;
        let frame = 0;

        const update = () => {
            frame = 0;
            target.style.setProperty('--sticky-top', `${Math.max(stuckAt, container.getBoundingClientRect().top)}px`);
        };

        const schedule = () => {
            if (frame === 0) {
                frame = requestAnimationFrame(update);
            }
        };

        update();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
        };
    }, [rest, element, enabled]);
}
