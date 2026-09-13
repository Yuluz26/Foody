import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

/**
 * Keeps list filters in the URL. Text search waits for a pause in typing;
 * select and date changes apply immediately.
 */
export function useFilters<T extends Record<string, string>>(url: string, initial: T) {
    const [filters, setFilters] = useState<T>(initial);
    const first = useRef(true);

    useEffect(() => {
        if (first.current) {
            first.current = false;

            return;
        }

        const timer = window.setTimeout(() => {
            const query = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
            router.get(url, query, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);

        return () => window.clearTimeout(timer);
    }, [filters, url]);

    const set = <K extends keyof T>(key: K, value: T[K]) => setFilters((current) => ({ ...current, [key]: value }));

    return { filters, set, reset: (next: T) => setFilters(next) };
}
