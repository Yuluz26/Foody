import { useEffect, useMemo, useState } from 'react';

/**
 * Tracks a Set of selected row ids for bulk actions, pruning stale picks when the visible
 * page of rows changes (poll, filter, pagination) — a bulk action never silently re-targets
 * a row that's scrolled out of view.
 */
export function useRowSelection(rows: Array<{ id: number }>) {
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const pageIds = useMemo(() => rows.map((row) => row.id), [rows]);

    useEffect(() => {
        setSelected((current) => {
            const next = new Set([...current].filter((id) => pageIds.includes(id)));
            return next.size === current.size ? current : next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows]);

    const toggleSelect = (id: number) =>
        setSelected((current) => {
            const next = new Set(current);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });

    const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
    const toggleSelectAll = () => setSelected(allSelected ? new Set() : new Set(pageIds));
    const clear = () => setSelected(new Set());

    return { selected, pageIds, toggleSelect, allSelected, toggleSelectAll, clear };
}
