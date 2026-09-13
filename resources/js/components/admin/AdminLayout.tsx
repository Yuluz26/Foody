import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowSquareOutIcon,
    BellIcon,
    BellSlashIcon,
    BowlFoodIcon,
    GearSixIcon,
    HouseIcon,
    IdentificationBadgeIcon,
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
import { useEffect, type ReactNode } from 'react';
import { DigitDisplay } from '@/components/DigitDisplay';
import { ToastProvider, useToast } from '@/components/Toaster';
import { cn } from '@/lib/format';
import { useNewOrderAlert } from './useNewOrderAlert';

type NavItem = { href: string; label: string; Icon: Icon; exact?: boolean; countKey?: 'activeOrders' };

const NAV: NavItem[] = [
    { href: '/admin', label: 'Ringkasan', Icon: HouseIcon, exact: true },
    { href: '/admin/orders', label: 'Pesanan', Icon: ReceiptIcon, countKey: 'activeOrders' },
    { href: '/admin/products', label: 'Produk', Icon: BowlFoodIcon },
    { href: '/admin/categories', label: 'Kategori', Icon: SquaresFourIcon },
    { href: '/admin/customers', label: 'Pelanggan', Icon: UsersIcon },
    { href: '/admin/staff', label: 'Kakitangan', Icon: IdentificationBadgeIcon },
    { href: '/admin/settings', label: 'Tetapan', Icon: GearSixIcon },
];

type AdminLayoutProps = {
    title: string;
    actions?: ReactNode;
    children: ReactNode;
};

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

type AlertToggleGroupProps = {
    sound: { active: boolean; onClick: () => void };
    notify: { active: boolean; onClick: () => void };
    tone: 'light' | 'dark';
};

function toggleSegmentClass(active: boolean, tone: 'light' | 'dark'): string {
    if (tone === 'dark') {
        return active ? 'bg-white/15 text-amber' : 'text-white/60 hover:bg-white/10 hover:text-white';
    }

    return active ? 'bg-amber text-ink' : 'text-ink-muted hover:bg-rule/60 hover:text-ink';
}

function ToggleSegment({ active, onClick, onLabel, offLabel, OnIcon, OffIcon, tone }: AlertToggleProps & { tone: 'light' | 'dark' }) {
    const ActiveIcon = active ? OnIcon : OffIcon;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            title={active ? onLabel : offLabel}
            className={cn('group grid size-11 shrink-0 place-items-center transition-colors duration-150', toggleSegmentClass(active, tone))}
        >
            <ActiveIcon size={18} weight="bold" aria-hidden className="transition-transform duration-150 ease-out group-hover:scale-110 group-active:scale-90" />
            <span className="sr-only">{active ? onLabel : offLabel}</span>
        </button>
    );
}

/**
 * The two alert preferences read as one control, not two unrelated icons: a single bordered
 * housing with a divider, the way QuantityStepper groups its own pair of buttons elsewhere
 * in this panel. Active state is carried by the icon (filled vs. slashed) and a solid fill,
 * not by one segment growing a box the other lacks.
 */
function AlertToggleGroup({ sound, notify, tone }: AlertToggleGroupProps) {
    return (
        <div className={cn('inline-flex shrink-0 overflow-hidden rounded-(--radius-control) border-2', tone === 'dark' ? 'border-white/25' : 'border-rule-strong')}>
            <ToggleSegment
                {...sound}
                onLabel="Bunyi pesanan baru: hidup"
                offLabel="Bunyi pesanan baru: senyap"
                OnIcon={SpeakerHighIcon}
                OffIcon={SpeakerXIcon}
                tone={tone}
            />
            <span className={cn('w-px', tone === 'dark' ? 'bg-white/25' : 'bg-rule-strong')} aria-hidden />
            <ToggleSegment
                {...notify}
                onLabel="Pemberitahuan pelayar: hidup"
                offLabel="Pemberitahuan pelayar: mati"
                OnIcon={BellIcon}
                OffIcon={BellSlashIcon}
                tone={tone}
            />
        </div>
    );
}

function AdminShell({ title, actions, children }: AdminLayoutProps) {
    const { props, url } = usePage();
    const toast = useToast();
    const { flash, restaurantName, auth, adminCounts } = props;
    const alert = useNewOrderAlert();

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
                    'group flex items-center gap-3 rounded-(--radius-control) font-semibold whitespace-nowrap transition-colors duration-150',
                    compact ? 'h-12 px-3' : 'h-11 px-3',
                    active ? 'bg-ink text-white' : 'text-ink-soft hover:bg-rule/60 hover:text-ink',
                )}
            >
                <item.Icon size={20} weight="bold" aria-hidden className="transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-6" />
                {item.label}
                {count > 0 && (
                    <span className="ml-auto">
                        <DigitDisplay value={String(count)} size="xs" label={`${count} pesanan aktif`} />
                    </span>
                )}
            </Link>
        );
    };

    return (
        <>
            <Head title={`${title} | Panel ${restaurantName}`} />
            <a href="#kandungan" className="sr-only z-60 bg-ink px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
                Langkau ke kandungan
            </a>

            <div className="min-h-dvh bg-ground lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
                <aside className="hidden border-r-2 border-rule bg-panel lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
                    <div className="on-module bg-ink px-5 pt-5 pb-4">
                        <Link href="/admin" className="font-heading block truncate text-2xl font-extrabold text-white transition-transform duration-150 ease-out hover:-translate-y-px">
                            {restaurantName}
                        </Link>
                        <p className="text-sm font-medium text-white/70">Panel kedai</p>
                    </div>
                    <nav aria-label="Navigasi admin" className="flex-1 overflow-y-auto px-3 py-4">
                        <ul className="grid gap-1">
                            {NAV.map((item) => (
                                <li key={item.href}>{navLink(item, false)}</li>
                            ))}
                        </ul>
                    </nav>
                    <div className="grid gap-1 border-t border-rule px-3 py-3">
                        <div className="flex items-center gap-2.5 px-1">
                            <AlertToggleGroup
                                sound={{ active: alert.soundEnabled, onClick: alert.toggleSound }}
                                notify={{ active: alert.notifyEnabled, onClick: alert.toggleNotify }}
                                tone="light"
                            />
                            <p className="min-w-0 text-xs leading-tight text-ink-muted">
                                Amaran
                                <br />
                                pesanan baru
                            </p>
                        </div>
                        <a href="/" target="_blank" rel="noopener" className="group flex h-11 items-center gap-3 rounded-(--radius-control) px-3 font-semibold text-ink-soft hover:bg-rule/60 hover:text-ink">
                            <ArrowSquareOutIcon size={20} weight="bold" aria-hidden className="transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-6" />
                            Lihat menu
                        </a>
                        <div className="mt-2 flex items-center justify-between gap-1 px-1">
                            <Link
                                href="/admin/profile"
                                className="group flex h-10 min-w-0 flex-1 items-center gap-2 rounded-(--radius-control) px-2 text-sm font-semibold text-ink-soft hover:bg-rule/60 hover:text-ink"
                            >
                                <UserCircleGearIcon size={18} weight="bold" aria-hidden className="shrink-0 transition-transform duration-150 ease-out group-hover:rotate-12" />
                                <span className="min-w-0 truncate">{auth.user?.name}</span>
                            </Link>
                            <button type="button" onClick={logout} aria-label="Log keluar" title="Log keluar" className="group grid size-10 shrink-0 place-items-center rounded-(--radius-control) text-ink-soft hover:bg-rule/60 hover:text-alert">
                                <SignOutIcon size={18} weight="bold" aria-hidden className="transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
                            </button>
                        </div>
                    </div>
                </aside>

                <div className="min-w-0">
                    <header className="lg:hidden">
                        <div className="on-module flex h-14 items-center justify-between bg-ink px-4 text-white">
                            <Link href="/admin" className="font-heading truncate text-xl font-extrabold">
                                {restaurantName}
                            </Link>
                            <div className="flex shrink-0 items-center gap-2">
                                <AlertToggleGroup
                                    sound={{ active: alert.soundEnabled, onClick: alert.toggleSound }}
                                    notify={{ active: alert.notifyEnabled, onClick: alert.toggleNotify }}
                                    tone="dark"
                                />
                                <button type="button" onClick={logout} className="flex h-11 items-center gap-2 rounded-(--radius-control) px-2 text-sm font-semibold hover:bg-white/10">
                                    <SignOutIcon size={18} weight="bold" aria-hidden />
                                    <span className="sr-only">Log keluar</span>
                                </button>
                            </div>
                        </div>
                        <nav aria-label="Navigasi admin" className="no-scrollbar flex gap-1 overflow-x-auto border-b-2 border-rule bg-panel px-2 py-1">
                            {NAV.map((item) => (
                                <span key={item.href} className="shrink-0">
                                    {navLink(item, true)}
                                </span>
                            ))}
                        </nav>
                    </header>

                    <main id="kandungan" className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-8 lg:pt-10">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <h1 className="font-heading text-3xl font-extrabold text-ink sm:text-4xl">{title}</h1>
                            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                        </div>
                        {flash.error && (
                            <p role="alert" className="mt-5 flex gap-2 rounded-(--radius-panel) border-2 border-alert bg-alert-tint p-4 text-[15px] font-semibold text-alert">
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
