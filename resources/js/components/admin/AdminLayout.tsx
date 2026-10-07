import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowSquareOutIcon,
    BellIcon,
    BasketIcon,
    BellSlashIcon,
    BowlFoodIcon,
    CashRegisterIcon,
    ChartLineUpIcon,
    GearSixIcon,
    HouseIcon,
    IdentificationBadgeIcon,
    PackageIcon,
    ReceiptIcon,
    SignOutIcon,
    SpeakerHighIcon,
    SpeakerXIcon,
    SquaresFourIcon,
    UserCircleGearIcon,
    UsersIcon,
    WarningCircleIcon,
    type Icon,
} from '@phosphor-icons/react';
import { useEffect, useState, type ReactNode } from 'react';
import { DigitDisplay } from '@/components/DigitDisplay';
import { ToastProvider, useToast } from '@/components/Toaster';
import { buttonClass } from '@/components/ui/Button';
import { cn } from '@/lib/format';
import { useNewOrderAlert } from './useNewOrderAlert';

type NavItem = { href: string; label: string; Icon: Icon; exact?: boolean; countKey?: 'activeOrders' | 'lowStock' | 'lowIngredients'; adminOnly?: boolean };

const STOCK_LABELS: Record<string, string> = { lowStock: 'hidangan hampir habis', lowIngredients: 'bahan hampir habis' };

const NAV: NavItem[] = [
    { href: '/admin', label: 'Ringkasan', Icon: HouseIcon, exact: true },
    { href: '/admin/pos', label: 'Kaunter', Icon: CashRegisterIcon },
    { href: '/admin/orders', label: 'Pesanan', Icon: ReceiptIcon, countKey: 'activeOrders' },
    { href: '/admin/stock', label: 'Stok makanan', Icon: PackageIcon, countKey: 'lowStock' },
    { href: '/admin/ingredients', label: 'Stok bahan', Icon: BasketIcon, countKey: 'lowIngredients' },
    { href: '/admin/reports', label: 'Laporan', Icon: ChartLineUpIcon },
    { href: '/admin/products', label: 'Produk', Icon: BowlFoodIcon, adminOnly: true },
    { href: '/admin/categories', label: 'Kategori', Icon: SquaresFourIcon, adminOnly: true },
    { href: '/admin/customers', label: 'Pelanggan', Icon: UsersIcon, adminOnly: true },
    { href: '/admin/staff', label: 'Kakitangan', Icon: IdentificationBadgeIcon, adminOnly: true },
    { href: '/admin/settings', label: 'Tetapan', Icon: GearSixIcon, adminOnly: true },
];

type AdminLayoutProps = {
    title: string;
    actions?: ReactNode;
    /** The counter screen wants the whole width; everything else reads better in a column. */
    wide?: boolean;
    children: ReactNode;
};

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 420;
const SIDEBAR_DEFAULT = 240;
const SIDEBAR_STEP = 16;
const SIDEBAR_WIDTH_KEY = 'foody.admin.sidebarWidth';

function clampSidebarWidth(value: number): number {
    return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, value));
}

function readSidebarWidth(): number {
    try {
        const saved = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY));

        return Number.isFinite(saved) && saved > 0 ? clampSidebarWidth(saved) : SIDEBAR_DEFAULT;
    } catch {
        return SIDEBAR_DEFAULT;
    }
}

function writeSidebarWidth(value: number): void {
    try {
        window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(value));
    } catch {
        // The resize still works for the rest of this visit; it just won't be remembered.
    }
}

export function AdminLayout(props: AdminLayoutProps) {
    return (
        <ToastProvider>
            <AdminShell {...props} />
        </ToastProvider>
    );
}

function isActive(item: NavItem, url: string): boolean {
    const path = url.split('?')[0];

    return item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);
}

type AlertToggleProps = {
    active: boolean;
    onClick: () => void;
    onLabel: string;
    offLabel: string;
    OnIcon: Icon;
    OffIcon: Icon;
};

function ToggleKnob({ active, onClick, onLabel, offLabel, OnIcon, OffIcon }: AlertToggleProps) {
    const ActiveIcon = active ? OnIcon : OffIcon;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            title={active ? onLabel : offLabel}
            className={cn(
                'group grid size-9 shrink-0 place-items-center rounded-full transition-[background-color,box-shadow,color] duration-200',
                active ? 'bg-amber text-ink shadow-(--shadow-raised-2xs)' : 'text-ink-muted hover:text-ink',
            )}
        >
            <ActiveIcon size={18} weight="bold" aria-hidden className="transition-transform duration-300 ease-spring group-hover:scale-110 group-active:scale-90 motion-reduce:transform-none" />
            <span className="sr-only">{active ? onLabel : offLabel}</span>
        </button>
    );
}

/** The two alert preferences read as one control: a pressed-in track with a raised, lit knob for whatever is on. */
function AlertToggleGroup({ sound, notify }: { sound: { active: boolean; onClick: () => void }; notify: { active: boolean; onClick: () => void } }) {
    return (
        <div className="neu-well-sm inline-flex shrink-0 gap-1 p-1 [--neu-radius:9999px]">
            <ToggleKnob {...sound} onLabel="Bunyi pesanan baru: hidup" offLabel="Bunyi pesanan baru: senyap" OnIcon={SpeakerHighIcon} OffIcon={SpeakerXIcon} />
            <ToggleKnob {...notify} onLabel="Pemberitahuan pelayar: hidup" offLabel="Pemberitahuan pelayar: mati" OnIcon={BellIcon} OffIcon={BellSlashIcon} />
        </div>
    );
}

function AdminShell({ title, actions, wide = false, children }: AdminLayoutProps) {
    const { props, url } = usePage();
    const toast = useToast();
    const { flash, restaurantName, auth, adminCounts } = props;
    const alert = useNewOrderAlert();
    const nav = NAV.filter((item) => !item.adminOnly || auth.user?.role === 'admin');
    const [sidebarWidth, setSidebarWidth] = useState(readSidebarWidth);

    // Every server response carries a fresh flash object, so repeated messages still show.
    useEffect(() => {
        if (flash.success) {
            toast(flash.success);
        }
    }, [flash, toast]);

    const logout = () => router.post('/admin/logout');

    const navLink = (item: NavItem, compact: boolean) => {
        const active = isActive(item, url);
        const count = item.countKey ? adminCounts?.[item.countKey] ?? 0 : 0;

        return (
            <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                    'group flex items-center gap-3 rounded-(--radius-control) px-3 font-semibold whitespace-nowrap transition-[background-color,box-shadow,color] duration-200',
                    compact ? 'h-10' : 'h-11',
                    active
                        ? cn('text-ink', compact ? 'bg-panel shadow-(--shadow-raised-2xs)' : 'bg-ground-deep shadow-(--shadow-inset-sm)')
                        : 'text-ink-soft hover:text-ink hover:shadow-(--shadow-raised-2xs)',
                )}
            >
                <item.Icon
                    size={20}
                    weight="bold"
                    aria-hidden
                    className={cn('transition-transform duration-300 ease-spring group-hover:scale-110 group-hover:-rotate-6 motion-reduce:transform-none', active && 'text-amber-deep')}
                />
                {item.label}
                {count > 0 && (
                    <span className="ml-auto">
                        <DigitDisplay value={String(count)} size="xs" label={`${count} ${STOCK_LABELS[item.countKey ?? ''] ?? 'pesanan aktif'}`} />
                    </span>
                )}
            </Link>
        );
    };

    /** Pointer capture covers mouse and touch alike, so the drag keeps tracking even past the handle's own thin hit zone. */
    const startSidebarDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 && event.pointerType === 'mouse') {
            return;
        }

        event.preventDefault();
        const handle = event.currentTarget;
        handle.setPointerCapture(event.pointerId);

        const startX = event.clientX;
        const startWidth = sidebarWidth;
        let latestWidth = startWidth;

        const onMove = (moveEvent: PointerEvent) => {
            latestWidth = clampSidebarWidth(startWidth + (moveEvent.clientX - startX));
            setSidebarWidth(latestWidth);
        };

        const stopDragging = () => {
            handle.removeEventListener('pointermove', onMove);
            handle.removeEventListener('pointerup', stopDragging);
            handle.removeEventListener('pointercancel', stopDragging);
            writeSidebarWidth(latestWidth);
        };

        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', stopDragging);
        handle.addEventListener('pointercancel', stopDragging);
    };

    /** WCAG 2.2 requires a non-drag way to do anything a drag does — arrow keys step the same width the pointer drags. */
    const onSidebarHandleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const next =
            event.key === 'ArrowLeft'
                ? clampSidebarWidth(sidebarWidth - SIDEBAR_STEP)
                : event.key === 'ArrowRight'
                  ? clampSidebarWidth(sidebarWidth + SIDEBAR_STEP)
                  : event.key === 'Home'
                    ? SIDEBAR_MIN
                    : event.key === 'End'
                      ? SIDEBAR_MAX
                      : null;

        if (next === null) {
            return;
        }

        event.preventDefault();
        setSidebarWidth(next);
        writeSidebarWidth(next);
    };

    const resetSidebarWidth = () => {
        setSidebarWidth(SIDEBAR_DEFAULT);
        writeSidebarWidth(SIDEBAR_DEFAULT);
    };

    return (
        <>
            <Head title={`${title} | Panel ${restaurantName}`} />
            <a href="#kandungan" className="sr-only z-60 rounded-(--radius-control) bg-ink px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
                Langkau ke kandungan
            </a>

            <div className="min-h-dvh bg-ground lg:grid" style={{ gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)` }}>
                <aside className="relative hidden lg:block">
                    <div className="neu-card sticky top-4 m-4 flex h-[calc(100dvh-2rem)] flex-col">
                        <div className="px-5 pt-6 pb-3">
                            <Link href="/admin" className="font-heading line-clamp-2 block text-2xl leading-tight font-extrabold text-balance break-words text-ink">
                                {restaurantName}
                            </Link>
                            <p className="mt-0.5 text-sm font-medium text-ink-muted">Panel kedai</p>
                        </div>
                        <nav aria-label="Navigasi admin" className="flex-1 overflow-y-auto px-3 py-3">
                            <ul className="grid gap-1.5">
                                {nav.map((item) => (
                                    <li key={item.href}>{navLink(item, false)}</li>
                                ))}
                            </ul>
                        </nav>
                        <div className="grid gap-1 px-3 pt-2 pb-4">
                            <div className="flex items-center gap-3 px-1 pb-2">
                                <AlertToggleGroup
                                    sound={{ active: alert.soundEnabled, onClick: alert.toggleSound }}
                                    notify={{ active: alert.notifyEnabled, onClick: alert.toggleNotify }}
                                />
                                <p className="min-w-0 text-xs leading-tight text-ink-muted">
                                    Amaran
                                    <br />
                                    pesanan baru
                                </p>
                            </div>
                            <a href="/" target="_blank" rel="noopener" className={buttonClass({ variant: 'quiet', className: 'justify-start' })}>
                                <ArrowSquareOutIcon size={20} weight="bold" aria-hidden />
                                Lihat menu
                            </a>
                            <div className="flex items-center justify-between gap-1">
                                <Link href="/admin/profile" className={buttonClass({ variant: 'quiet', size: 'sm', className: 'min-w-0 flex-1 justify-start' })}>
                                    <UserCircleGearIcon size={18} weight="bold" aria-hidden />
                                    <span className="min-w-0 truncate">{auth.user?.name}</span>
                                </Link>
                                <button type="button" onClick={logout} aria-label="Log keluar" title="Log keluar" className={buttonClass({ variant: 'quiet', size: 'sm', icon: true, className: 'hover:text-alert' })}>
                                    <SignOutIcon size={18} weight="bold" aria-hidden />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Laraskan lebar bar sisi"
                        aria-valuenow={sidebarWidth}
                        aria-valuemin={SIDEBAR_MIN}
                        aria-valuemax={SIDEBAR_MAX}
                        tabIndex={0}
                        onPointerDown={startSidebarDrag}
                        onKeyDown={onSidebarHandleKeyDown}
                        onDoubleClick={resetSidebarWidth}
                        className="group absolute inset-y-0 right-0 z-10 hidden w-3 translate-x-1/2 touch-none items-center justify-center outline-none lg:flex"
                        style={{ cursor: 'col-resize' }}
                    >
                        <span className="h-full w-0.5 rounded-full bg-rule-strong transition-[background-color,width] duration-150 group-hover:w-1 group-hover:bg-amber-deep group-focus-visible:w-1 group-focus-visible:bg-amber-deep group-active:w-1 group-active:bg-amber-deep" />
                    </div>
                </aside>

                <div className="min-w-0">
                    <header className="lg:hidden">
                        <div className="flex h-16 items-center justify-between gap-3 px-4">
                            <Link href="/admin" className="font-heading truncate text-xl font-extrabold text-ink">
                                {restaurantName}
                            </Link>
                            <div className="flex shrink-0 items-center gap-2">
                                <AlertToggleGroup
                                    sound={{ active: alert.soundEnabled, onClick: alert.toggleSound }}
                                    notify={{ active: alert.notifyEnabled, onClick: alert.toggleNotify }}
                                />
                                <button type="button" onClick={logout} aria-label="Log keluar" className={buttonClass({ variant: 'soft', icon: true, size: 'sm' })}>
                                    <SignOutIcon size={18} weight="bold" aria-hidden />
                                </button>
                            </div>
                        </div>
                        <div className="px-3 pb-1">
                            <nav aria-label="Navigasi admin" className="neu-well-sm">
                                <div className="no-scrollbar flex gap-1 overflow-x-auto p-2">
                                    {nav.map((item) => (
                                        <span key={item.href} className="shrink-0">
                                            {navLink(item, true)}
                                        </span>
                                    ))}
                                </div>
                            </nav>
                        </div>
                    </header>

                    <main id="kandungan" className={cn('mx-auto px-4 pt-6 pb-16 sm:px-8 lg:pt-10', wide ? 'max-w-[110rem]' : 'max-w-6xl')}>
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <h1 className="font-heading text-3xl font-extrabold text-ink sm:text-4xl">{title}</h1>
                            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                        </div>
                        {flash.error && (
                            <p role="alert" className="neu-well-sm mt-5 flex gap-2 [--neu-bg:var(--color-alert-tint)] p-4 text-[15px] font-semibold text-alert">
                                <WarningCircleIcon size={22} weight="bold" className="shrink-0" aria-hidden />
                                {flash.error}
                            </p>
                        )}
                        <div className="mt-6">{children}</div>
                    </main>
                </div>
            </div>
        </>
    );
}
