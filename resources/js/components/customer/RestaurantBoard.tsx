import { Link, router, usePage } from '@inertiajs/react';
import { ClockIcon, MapPinIcon, PhoneIcon, ReceiptIcon, SignOutIcon } from '@phosphor-icons/react';
import { cn, formatClock } from '@/lib/format';
import type { Restaurant } from '@/types';

/** The shopfront header: name, what the shop serves, and a status lamp for whether it is taking orders now. */
export function RestaurantBoard({ restaurant }: { restaurant: Restaurant }) {
    const { customerAuth } = usePage().props;
    const opens = formatClock(restaurant.opensAt);
    const closes = formatClock(restaurant.closesAt);

    // When open, the lamp already says "Buka hingga <closes>" — repeating the same range
    // below would be noise. The full range only earns its own row once the lamp can't say it
    // (closed, or ordering off), so a diner still learns when the kitchen is next open.
    const lampCoversHours = restaurant.acceptingOrders && closes;

    return (
        <header className="border-b-2 border-rule bg-gradient-to-b from-ground to-ground-deep">
            <div className="mx-auto max-w-6xl px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 sm:px-10 sm:pt-9 sm:pb-7 lg:pt-8 lg:pb-6">
                {customerAuth.user && (
                    <div className="-mt-1 mb-3 flex items-center justify-end gap-4 text-sm font-semibold text-ink-soft">
                        <Link href="/pesanan-saya" className="flex items-center gap-1.5 hover:text-ink">
                            <ReceiptIcon size={16} weight="bold" aria-hidden />
                            Pesanan saya
                        </Link>
                        <button type="button" onClick={() => router.post('/log-keluar')} className="flex items-center gap-1.5 hover:text-ink">
                            <SignOutIcon size={16} weight="bold" aria-hidden />
                            Log keluar
                        </button>
                    </div>
                )}
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        {restaurant.logoUrl && (
                            <img
                                src={restaurant.logoUrl}
                                alt=""
                                className="mb-3 size-12 rounded-(--radius-module) border-2 border-rule-strong object-cover"
                                width={48}
                                height={48}
                            />
                        )}
                        <h1 className="text-[clamp(2.5rem,9vw,4rem)] leading-[0.98] font-extrabold break-words text-ink">{restaurant.name}</h1>
                        {restaurant.description && (
                            <p className="mt-2 max-w-[42ch] text-base leading-snug text-ink-soft sm:text-lg">{restaurant.description}</p>
                        )}
                    </div>
                    <StatusLamp restaurant={restaurant} closes={closes} />
                </div>

                <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-ink-muted">
                    {opens && closes && !lampCoversHours && (
                        <div className="flex items-center gap-2">
                            <dt>
                                <ClockIcon size={18} weight="bold" aria-hidden />
                                <span className="sr-only">Waktu operasi</span>
                            </dt>
                            <dd>
                                {opens} hingga {closes}
                            </dd>
                        </div>
                    )}
                    {restaurant.address && (
                        <div className="flex items-center gap-2">
                            <dt>
                                <MapPinIcon size={18} weight="bold" aria-hidden />
                                <span className="sr-only">Alamat</span>
                            </dt>
                            <dd>{restaurant.address}</dd>
                        </div>
                    )}
                    {restaurant.phone && (
                        <div className="flex items-center gap-2">
                            <dt>
                                <PhoneIcon size={18} weight="bold" aria-hidden />
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
            </div>
        </header>
    );
}

/** The instrument module the FIRST VIEWPORT promises: a dark housing whose indicator lamp and label glow only when lit. */
function StatusLamp({ restaurant, closes }: { restaurant: Restaurant; closes: string | null }) {
    const taking = restaurant.acceptingOrders;
    const label = taking ? 'Buka' : restaurant.isOpen ? 'Tutup pesanan' : 'Tutup';

    return (
        <p className="on-module flex shrink-0 items-center gap-2 rounded-(--radius-module) bg-module px-3 py-2 shadow-(--shadow-module)">
            <span className={cn('size-2.5 rounded-full', taking ? 'bg-leaf shadow-[0_0_0_4px_theme(colors.leaf/25%)]' : 'bg-white/25')} aria-hidden />
            <span className="text-right">
                <span className={cn('block text-sm leading-none font-bold', taking ? 'text-leaf [text-shadow:0_0_6px_currentColor]' : 'text-white/70')}>{label}</span>
                {taking && closes && <span className="block text-xs leading-tight whitespace-nowrap text-white/70">hingga {closes}</span>}
            </span>
        </p>
    );
}
