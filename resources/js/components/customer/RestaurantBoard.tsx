import { Link, router, usePage } from '@inertiajs/react';
import { ClockIcon, MapPinIcon, PhoneIcon, ReceiptIcon, SignOutIcon } from '@phosphor-icons/react';
import { buttonClass } from '@/components/ui/Button';
import { cn, formatClock } from '@/lib/format';
import type { Restaurant } from '@/types';

/** The shopfront header on phones and tablets: name, what the shop serves, and a lamp for whether it is taking orders now. */
export function RestaurantBoard({ restaurant }: { restaurant: Restaurant }) {
    const { customerAuth } = usePage().props;
    const opens = formatClock(restaurant.opensAt);
    const closes = formatClock(restaurant.closesAt);

    // When open, the lamp already says "Buka hingga <closes>"; repeating the range below would be noise.
    // It only earns its own row once the lamp can't say it (closed, or ordering off).
    const lampCoversHours = restaurant.acceptingOrders && closes;

    return (
        <header>
            <div className="mx-auto max-w-6xl px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-5 sm:px-10 sm:pb-6">
                {customerAuth.user && (
                    <div className="mb-2 flex items-center justify-end gap-1">
                        <Link href="/pesanan-saya" className={buttonClass({ variant: 'quiet', size: 'sm' })}>
                            <ReceiptIcon size={16} weight="bold" aria-hidden />
                            Pesanan saya
                        </Link>
                        <button type="button" onClick={() => router.post('/log-keluar')} className={buttonClass({ variant: 'quiet', size: 'sm' })}>
                            <SignOutIcon size={16} weight="bold" aria-hidden />
                            Log keluar
                        </button>
                    </div>
                )}

                {restaurant.logoUrl && (
                    <img src={restaurant.logoUrl} alt="" className="mb-3 size-14 rounded-(--radius-control) object-cover shadow-(--shadow-raised-sm)" width={56} height={56} />
                )}
                <h1 className="text-[clamp(2rem,8.5vw,3.5rem)] leading-[1.02] font-extrabold text-balance text-ink">{restaurant.name}</h1>
                {restaurant.description && <p className="mt-2 max-w-[42ch] text-base leading-snug text-ink-soft sm:text-lg">{restaurant.description}</p>}

                <div className="mt-4">
                    <StatusLamp restaurant={restaurant} closes={closes} />
                </div>

                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-ink-muted">
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

/** The instrument module: a dark housing whose lamp and label glow only when the shop is taking orders. */
function StatusLamp({ restaurant, closes }: { restaurant: Restaurant; closes: string | null }) {
    const taking = restaurant.acceptingOrders;
    const label = taking ? 'Buka' : restaurant.isOpen ? 'Tutup pesanan' : 'Tutup';

    return (
        <p className="on-module inline-flex items-center gap-2.5 rounded-(--radius-module) bg-module px-3.5 py-2 shadow-(--shadow-module)">
            <span className={cn('size-2.5 shrink-0 rounded-full', taking ? 'bg-leaf shadow-[0_0_0_4px_theme(colors.leaf/25%)]' : 'bg-white/25')} aria-hidden />
            <span className={cn('text-sm font-bold', taking ? 'text-leaf [text-shadow:0_0_6px_currentColor]' : 'text-white/70')}>{label}</span>
            {taking && closes && <span className="text-sm whitespace-nowrap text-white/70">hingga {closes}</span>}
        </p>
    );
}
