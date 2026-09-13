/** Prices travel as integer sen. */
export function formatPrice(sen: number): string {
    return `RM ${(sen / 100).toFixed(2)}`;
}

/** Category and dish numbers on the board: two-digit, sequential, no letters — "01", "02", "12". */
export function digitCode(index: number): string {
    return String(index + 1).padStart(2, '0');
}

/** Prices read through the digit face too: "13.90" without the currency prefix. */
export function priceDigits(sen: number): string {
    return (sen / 100).toFixed(2);
}

/** "23:00" becomes "11:00 malam". */
export function formatClock(time: string | null): string | null {
    if (!time) {
        return null;
    }

    const [hourText, minute] = time.split(':');
    const hour = Number(hourText);
    const period = hour < 12 ? 'pagi' : hour < 14 ? 'tengah hari' : hour < 19 ? 'petang' : 'malam';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;

    return `${displayHour}:${minute} ${period}`;
}

export function formatDateTime(iso: string): string {
    return new Intl.DateTimeFormat('ms-MY', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(iso));
}

/** Short waiting time for the order queue: "baru", "7 min", "2 jam 5 min". */
export function formatWaiting(iso: string, now: number = Date.now()): string {
    const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));

    if (minutes < 1) {
        return 'baru';
    }

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);

    return hours < 24 ? `${hours} jam ${minutes % 60} min` : formatDateTime(iso);
}

/** Stored phones are digits only; "0123456789" reads as "012-345 6789". */
export function formatPhone(digits: string): string {
    if (/^01\d{8,9}$/.test(digits)) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)} ${digits.slice(6)}`;
    }

    if (/^601\d{8,9}$/.test(digits)) {
        return `+60 ${digits.slice(2, 4)}-${digits.slice(4, 7)} ${digits.slice(7)}`;
    }

    return digits;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(' ');
}

const PEXELS_HOST = 'images.pexels.com';

/** Resized, compressed variants for CDN images; uploaded files are served as they are. */
export function imageSrc(url: string, width: number): string {
    return url.includes(PEXELS_HOST) ? `${url}?auto=compress&cs=tinysrgb&w=${width}` : url;
}

export function imageSrcSet(url: string, widths: number[] = [320, 480, 720, 960, 1280]): string | undefined {
    if (!url.includes(PEXELS_HOST)) {
        return undefined;
    }

    return widths.map((width) => `${imageSrc(url, width)} ${width}w`).join(', ');
}
