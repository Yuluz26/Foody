import { usePage, usePoll } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { playNewOrderChime, playOrderCancelledChime } from '@/lib/chime';
import { useToast } from '@/components/Toaster';
import type { StockAlert } from '@/types';

const SOUND_KEY = 'foody.admin.sound';
const NOTIFY_KEY = 'foody.admin.notify';
const STOCK_SEEN_KEY = 'foody.admin.stock.seen';

function readFlag(key: string, fallback: boolean): boolean {
    try {
        const saved = window.localStorage.getItem(key);

        return saved === null ? fallback : saved === '1';
    } catch {
        return fallback;
    }
}

function writeFlag(key: string, value: boolean): void {
    try {
        window.localStorage.setItem(key, value ? '1' : '0');
    } catch {
        // The toggle still works for the rest of this visit; it just won't be remembered.
    }
}

function readSeenStock(): Set<string> {
    try {
        const saved = window.localStorage.getItem(STOCK_SEEN_KEY);

        return new Set(saved ? (JSON.parse(saved) as string[]) : []);
    } catch {
        return new Set();
    }
}

function writeSeenStock(keys: Set<string>): void {
    try {
        window.localStorage.setItem(STOCK_SEEN_KEY, JSON.stringify([...keys]));
    } catch {
        // Worst case the same warning shows again on the next visit.
    }
}

function stockMessage(alerts: StockAlert[]): string {
    if (alerts.length > 1) {
        return `${alerts.length} stok perlu perhatian: ${alerts.slice(0, 3).map((alert) => alert.name).join(', ')}${alerts.length > 3 ? '...' : ''}`;
    }

    const [alert] = alerts;
    const left = `${alert.quantity}${alert.unit ? ` ${alert.unit}` : ''}`;

    return alert.state === 'out' ? `${alert.name} sudah habis.` : `${alert.name} hampir habis, tinggal ${left}.`;
}

function orderNumber(id: number): string {
    return `FD${String(id).padStart(4, '0')}`;
}

/**
 * Polls for new orders and customer-initiated cancellations from anywhere in the admin panel
 * (not just the Dashboard or Orders list) and raises a chime, a toast, a background-tab title
 * badge, and an optional native browser notification the moment one arrives. Detection is by
 * rising order id, not by the active-orders count, so a staff member closing one order while a
 * new one lands never cancels out into "nothing changed". Staff-initiated cancellations don't
 * alert — the staff member doing it already knows.
 */
export function useNewOrderAlert() {
    const { props } = usePage();
    const toast = useToast();
    const [soundEnabled, setSoundEnabled] = useState(() => readFlag(SOUND_KEY, true));
    const [notifyEnabled, setNotifyEnabled] = useState(
        () => readFlag(NOTIFY_KEY, false) && typeof Notification !== 'undefined' && Notification.permission === 'granted',
    );
    const knownLatestId = useRef<number | null | undefined>(undefined);
    const knownLatestCancelledId = useRef<number | null | undefined>(undefined);
    const unseenCount = useRef(0);
    const seenStock = useRef<Set<string> | null>(null);

    usePoll(10_000, { only: ['adminCounts'] });

    const restoreTitle = useCallback(() => {
        unseenCount.current = 0;
        document.title = document.title.replace(/^\(\d+\)\s*/, '');
    }, []);

    useEffect(() => {
        const onVisibilityChange = () => {
            if (!document.hidden) {
                restoreTitle();
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, [restoreTitle]);

    useEffect(() => {
        const latestId = props.adminCounts?.latestOrderId ?? null;

        // First observation just establishes the baseline; nothing "new" has happened yet.
        if (knownLatestId.current === undefined) {
            knownLatestId.current = latestId;

            return;
        }

        const previous = knownLatestId.current;
        knownLatestId.current = latestId;

        if (latestId === null || previous === null || latestId <= previous) {
            return;
        }

        const newCount = latestId - previous;

        toast(newCount === 1 ? `Pesanan baru diterima: ${orderNumber(latestId)}` : `${newCount} pesanan baru diterima`);

        if (soundEnabled) {
            playNewOrderChime();
        }

        if (document.hidden) {
            unseenCount.current += newCount;
            document.title = `(${unseenCount.current}) ${document.title.replace(/^\(\d+\)\s*/, '')}`;
        }

        if (notifyEnabled && document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const notification = new Notification('Pesanan baru di Foody', {
                body: newCount === 1 ? `Pesanan ${orderNumber(latestId)} baru masuk.` : `${newCount} pesanan baru masuk.`,
                tag: 'foody-new-order',
            });
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.adminCounts?.latestOrderId]);

    useEffect(() => {
        const latestCancelledId = props.adminCounts?.latestCustomerCancelledOrderId ?? null;

        // First observation just establishes the baseline; nothing "new" has happened yet.
        if (knownLatestCancelledId.current === undefined) {
            knownLatestCancelledId.current = latestCancelledId;

            return;
        }

        const previous = knownLatestCancelledId.current;
        knownLatestCancelledId.current = latestCancelledId;

        if (latestCancelledId === null || previous === null || latestCancelledId <= previous) {
            return;
        }

        toast(`Pesanan ${orderNumber(latestCancelledId)} dibatalkan oleh pelanggan.`);

        if (soundEnabled) {
            playOrderCancelledChime();
        }

        if (document.hidden) {
            unseenCount.current += 1;
            document.title = `(${unseenCount.current}) ${document.title.replace(/^\(\d+\)\s*/, '')}`;
        }

        if (notifyEnabled && document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const notification = new Notification('Pesanan dibatalkan di Foody', {
                body: `Pesanan ${orderNumber(latestCancelledId)} dibatalkan oleh pelanggan.`,
                tag: 'foody-order-cancelled',
            });
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.adminCounts?.latestCustomerCancelledOrderId]);

    // A dish or ingredient running low or out alerts once per condition. What was already announced is remembered
    // in this browser, so a refresh stays quiet but a new login after something ran out while nobody was looking does not.
    useEffect(() => {
        const alerts = props.adminCounts?.stockAlerts;

        if (!alerts) {
            return;
        }

        seenStock.current ??= readSeenStock();
        const fresh = alerts.filter((alert) => !seenStock.current?.has(alert.key));
        seenStock.current = new Set(alerts.map((alert) => alert.key));
        writeSeenStock(seenStock.current);

        if (fresh.length === 0) {
            return;
        }

        const message = stockMessage(fresh);
        toast(message);

        if (soundEnabled) {
            playOrderCancelledChime();
        }

        if (document.hidden) {
            unseenCount.current += 1;
            document.title = `(${unseenCount.current}) ${document.title.replace(/^\(\d+\)\s*/, '')}`;
        }

        if (notifyEnabled && document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const notification = new Notification('Stok perlu perhatian di Foody', { body: message, tag: 'foody-stock' });
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.adminCounts?.stockAlerts]);

    const toggleSound = useCallback(() => {
        setSoundEnabled((current) => {
            const next = !current;
            writeFlag(SOUND_KEY, next);

            // A short confirmation chime so turning it on is its own proof that it works.
            if (next) {
                playNewOrderChime();
            }

            return next;
        });
    }, []);

    const toggleNotify = useCallback(() => {
        if (notifyEnabled) {
            setNotifyEnabled(false);
            writeFlag(NOTIFY_KEY, false);

            return;
        }

        if (typeof Notification === 'undefined') {
            toast('Pelayar ini tidak menyokong pemberitahuan.');

            return;
        }

        if (Notification.permission === 'granted') {
            setNotifyEnabled(true);
            writeFlag(NOTIFY_KEY, true);

            return;
        }

        if (Notification.permission === 'denied') {
            toast('Pemberitahuan disekat. Benarkan dalam tetapan pelayar untuk kedai ini.');

            return;
        }

        // Must run inside the click that triggered this, which it does: toggleNotify is only ever a button's onClick.
        void Notification.requestPermission().then((permission) => {
            const granted = permission === 'granted';
            setNotifyEnabled(granted);
            writeFlag(NOTIFY_KEY, granted);

            if (!granted) {
                toast('Kebenaran pemberitahuan tidak diberikan.');
            }
        });
    }, [notifyEnabled, toast]);

    return { soundEnabled, toggleSound, notifyEnabled, toggleNotify };
}
