import { Link, router, usePage } from '@inertiajs/react';
import { ClockIcon, MapPinIcon, PhoneIcon, ReceiptIcon, SignOutIcon, StorefrontIcon } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { buttonClass } from '@/components/ui/Button';
import { cn, formatClock, imageSrc } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import type { MenuCategory, Restaurant } from '@/types';

type CustomerSidebarProps = {
    restaurant: Restaurant;
    categories: MenuCategory[];
    activeId: number | null;
    onSelect: (category: MenuCategory) => void;
};

/** The desktop-only standing rail: who this shop is, its categories, how to reach it, and the signed-in diner's own account links. */
export function CustomerSidebar({ restaurant, categories, activeId, onSelect }: CustomerSidebarProps) {
    const { customerAuth } = usePage().props;
    const reduce = useReducedMotion();
    const taking = restaurant.acceptingOrders;
    const label = taking ? 'Buka' : restaurant.isOpen ? 'Tutup pesanan' : 'Tutup';
    const opens = formatClock(restaurant.opensAt);
    const closes = formatClock(restaurant.closesAt);

    return (
        <aside aria-label="Maklumat kedai dan kategori" className="hidden shrink-0 lg:block lg:w-64">
            {/* Padded and pulled back so the soft shadows are not clipped by the scrolling container. */}
            <div className="no-scrollbar sticky top-3 -m-5 grid max-h-[calc(100dvh-1.5rem)] gap-5 overflow-y-auto p-5">
                <div className="neu-card p-5">
                    <div className="flex items-center gap-3">
                        {restaurant.logoUrl ? (
                            <img src={restaurant.logoUrl} alt="" className="size-12 shrink-0 rounded-(--radius-control) object-cover shadow-(--shadow-raised-xs)" />
                        ) : (
                            <div className="on-module grid size-12 shrink-0 place-items-center rounded-(--radius-module) bg-module shadow-(--shadow-module)">
                                <StorefrontIcon size={22} weight="bold" className="text-amber" aria-hidden />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-lg leading-tight font-extrabold text-balance text-ink">{restaurant.name}</p>
                            <p className={cn('mt-1 flex items-center gap-1.5 text-sm font-semibold', taking ? 'text-leaf-deep' : 'text-ink-muted')}>
                                <span className={cn('size-2 shrink-0 rounded-full', taking ? 'bg-leaf shadow-[0_0_0_3px_theme(colors.leaf/25%)]' : 'bg-ink-muted/40')} aria-hidden />
                                {label}
                            </p>
                        </div>
                    </div>
                </div>

                <nav aria-label="Kategori menu" className="neu-well grid gap-1 p-2">
                    {categories.map((category) => {
                        const active = category.id === activeId;

                        return (
                            <a
                                key={category.id}
                                href={`#kategori-${category.slug}`}
                                aria-current={active ? 'true' : undefined}
                                onClick={(event) => {
                                    event.preventDefault();
                                    onSelect(category);
                                }}
                                className={cn(
                                    'relative flex items-center gap-2.5 rounded-(--radius-control) py-1.5 pr-3.5 font-semibold transition-colors duration-150',
                                    category.imageUrl ? 'pl-1.5' : 'pl-3.5',
                                    active ? 'text-ink' : 'text-ink-soft hover:text-ink',
                                )}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="sidebar-thumb"
                                        className="absolute inset-0 rounded-(--radius-control) bg-panel shadow-(--shadow-raised-xs)"
                                        transition={reduce ? { duration: 0 } : { duration: duration.base, ease: ease.inOut }}
                                    />
                                )}
                                {category.imageUrl && (
                                    <img src={imageSrc(category.imageUrl, 72)} alt="" className="relative z-10 size-9 shrink-0 rounded-[11px] object-cover" />
                                )}
                                <span className="relative z-10 min-w-0 truncate">{category.name}</span>
                            </a>
                        );
                    })}
                </nav>

                {(restaurant.address || restaurant.phone || (opens && closes)) && (
                    <dl className="neu-tile grid gap-3 p-4 text-[15px] text-ink-muted [--neu-radius:var(--radius-panel)]">
                        {opens && closes && (
                            <div className="flex items-start gap-2.5">
                                <dt>
                                    <ClockIcon size={18} weight="bold" className="mt-0.5" aria-hidden />
                                    <span className="sr-only">Waktu operasi</span>
                                </dt>
                                <dd>
                                    {opens} hingga {closes}
                                </dd>
                            </div>
                        )}
                        {restaurant.address && (
                            <div className="flex items-start gap-2.5">
                                <dt>
                                    <MapPinIcon size={18} weight="bold" className="mt-0.5" aria-hidden />
                                    <span className="sr-only">Alamat</span>
                                </dt>
                                <dd>{restaurant.address}</dd>
                            </div>
                        )}
                        {restaurant.phone && (
                            <div className="flex items-start gap-2.5">
                                <dt>
                                    <PhoneIcon size={18} weight="bold" className="mt-0.5" aria-hidden />
                                    <span className="sr-only">Telefon</span>
                                </dt>
                                <dd>
                                    <a href={`tel:${restaurant.phone.replace(/[^\d+]/g, '')}`} className="underline decoration-rule-strong hover:decoration-ink">
                                        {restaurant.phone}
                                    </a>
                                </dd>
                            </div>
                        )}
                    </dl>
                )}

                {customerAuth.user && (
                    <div className="neu-tile grid gap-1 p-2 [--neu-radius:var(--radius-panel)]">
                        <p className="truncate px-2 pt-1 text-sm text-ink-muted">
                            Log masuk sebagai <span className="font-semibold text-ink">{customerAuth.user.name}</span>
                        </p>
                        <Link href="/pesanan-saya" className={buttonClass({ variant: 'quiet', className: 'justify-start' })}>
                            <ReceiptIcon size={18} weight="bold" aria-hidden />
                            Pesanan saya
                        </Link>
                        <button type="button" onClick={() => router.post('/log-keluar')} className={buttonClass({ variant: 'quiet', className: 'justify-start' })}>
                            <SignOutIcon size={18} weight="bold" aria-hidden />
                            Log keluar
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
