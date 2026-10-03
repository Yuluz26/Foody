import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowSquareOutIcon,
    BellIcon,
    BellSlashIcon,
    BowlFoodIcon,
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
import { useEffect, type ReactNode } from 'react';
import { DigitDisplay } from '@/components/DigitDisplay';
import { ToastProvider, useToast } from '@/components/Toaster';
import { buttonClass } from '@/components/ui/Button';
import { cn } from '@/lib/format';
import { useNewOrderAlert } from './useNewOrderAlert';

type NavItem = { href: string; label: string; Icon: Icon; exact?: boolean; countKey?: 'activeOrders' | 'lowStock'; adminOnly?: boolean };

const NAV: NavItem[] = [
    { href: '/admin', label: 'Ringkasan', Icon: HouseIcon, exact: true },
    { href: '/admin/orders', label: 'Pesanan', Icon: ReceiptIcon, countKey: 'activeOrders' },
    { href: '/admin/stock', label: 'Stok', Icon: PackageIcon, countKey: 'lowStock' },
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

function AdminShell({ title, actions, children }: AdminLayoutProps) {
    const { props, url } = usePage();
    const toast = useToast();
    const { flash, restaurantName, auth, adminCounts } = props;
    const alert = useNewOrderAlert();
    const nav = NAV.filter((item) => !item.adminOnly || auth.user?.role === 'admin');

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
                        <DigitDisplay value={String(count)} size="xs" label={item.countKey === 'lowStock' ? `${count} produk hampir habis` : `${count} pesanan aktif`} />
                    </span>
                )}
            </Link>
        );
    };

    return (
        <>
            <Head title={`${title} | Panel ${restaurantName}`} />
            <a href="#kandungan" className="sr-only z-60 rounded-(--radius-control) bg-ink px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
                Langkau ke kandungan
            </a>

            <div className="min-h-dvh bg-ground lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
                <aside className="hidden lg:block">
                    <div className="neu-card sticky top-4 m-4 flex h-[calc(100dvh-2rem)] flex-col">
                        <div className="px-5 pt-6 pb-3">
                            <Link href="/admin" className="font-heading block text-2xl leading-tight font-extrabold text-balance text-ink">
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

                    <main id="kandungan" className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-8 lg:pt-10">
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
