import { Link, router, usePage } from '@inertiajs/react';
import { ClockIcon, MapPinIcon, PhoneIcon, ReceiptIcon, SignOutIcon, StorefrontIcon } from '@phosphor-icons/react';
import { cn, formatClock } from '@/lib/format';
import type { MenuCategory, Restaurant } from '@/types';

type CustomerSidebarProps = {
    restaurant: Restaurant;
    categories: MenuCategory[];
    activeId: number | null;
    onSelect: (category: MenuCategory) => void;
};

/** The desktop-only standing rail: who this shop is, its numbered categories, how to reach it, and the signed-in diner's own account links. */
export function CustomerSidebar({ restaurant, categories, activeId, onSelect }: CustomerSidebarProps) {
    const { customerAuth } = usePage().props;
    const taking = restaurant.acceptingOrders;
    const label = taking ? 'Buka' : restaurant.isOpen ? 'Tutup pesanan' : 'Tutup';
    const opens = formatClock(restaurant.opensAt);
    const closes = formatClock(restaurant.closesAt);

    return (
        <aside aria-label="Maklumat kedai dan kategori" className="hidden shrink-0 lg:block lg:w-64">
            <div className="no-scrollbar sticky top-8 grid max-h-[calc(100vh-4rem)] gap-5 overflow-y-auto pb-2">
                <div className="on-module rounded-(--radius-panel) bg-module p-5 shadow-(--shadow-module)">
                    <div className="flex items-center gap-3">
                        {restaurant.logoUrl ? (
                            <img src={restaurant.logoUrl} alt="" className="size-12 shrink-0 rounded-(--radius-module) border-2 border-white/15 object-cover" />
                        ) : (
                            <div className="grid size-12 shrink-0 place-items-center rounded-(--radius-module) border-2 border-white/15 bg-white/10">
                                <StorefrontIcon size={22} weight="bold" className="text-amber" aria-hidden />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-lg font-extrabold text-white">{restaurant.name}</p>
                            <p className={cn('mt-0.5 flex items-center gap-1.5 text-sm font-semibold', taking ? 'text-leaf' : 'text-white/60')}>
                                <span className={cn('size-2 shrink-0 rounded-full', taking ? 'bg-leaf shadow-[0_0_0_3px_theme(colors.leaf/25%)]' : 'bg-white/30')} aria-hidden />
                                {label}
                            </p>
                        </div>
                    </div>
                </div>

                <nav aria-label="Kategori menu" className="grid gap-1 rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-2">
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
                                    'rounded-(--radius-control) px-3.5 py-2.5 font-semibold transition-colors duration-150',
                                    active ? 'bg-ink text-white' : 'text-ink-soft hover:bg-ground hover:text-ink',
                                )}
                            >
                                {category.name}
                            </a>
                        );
                    })}
                </nav>

                {(restaurant.address || restaurant.phone || (opens && closes)) && (
                    <dl className="grid gap-3 rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-4 text-[15px] text-ink-muted">
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
                    <div className="grid gap-1 rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-2">
                        <p className="truncate px-2 pt-1 text-sm text-ink-muted">
                            Log masuk sebagai <span className="font-semibold text-ink">{customerAuth.user.name}</span>
                        </p>
                        <Link
                            href="/pesanan-saya"
                            className="flex items-center gap-2.5 rounded-(--radius-control) px-3.5 py-2.5 font-semibold text-ink-soft transition-colors duration-150 hover:bg-ground hover:text-ink"
                        >
                            <ReceiptIcon size={18} weight="bold" aria-hidden />
                            Pesanan saya
                        </Link>
                        <button
                            type="button"
                            onClick={() => router.post('/log-keluar')}
                            className="flex items-center gap-2.5 rounded-(--radius-control) px-3.5 py-2.5 text-left font-semibold text-ink-soft transition-colors duration-150 hover:bg-ground hover:text-ink"
                        >
                            <SignOutIcon size={18} weight="bold" aria-hidden />
                            Log keluar
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
