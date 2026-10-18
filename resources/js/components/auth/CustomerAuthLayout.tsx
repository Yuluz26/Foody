import { Link, usePage } from '@inertiajs/react';
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon, ForkKnifeIcon, ReceiptIcon, WarningCircleIcon, type Icon } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { WarungMark } from '@/components/auth/WarungMark';
import { buttonClass } from '@/components/ui/Button';
import { cn } from '@/lib/format';
import { duration, ease, spring } from '@/lib/motion';

const TABS = [
    { component: 'Customer/Login', href: '/log-masuk', label: 'Log masuk' },
    { component: 'Customer/Register', href: '/daftar', label: 'Daftar' },
];

const PERKS: Array<{ Icon: Icon; label: string }> = [
    { Icon: ForkKnifeIcon, label: 'Pesan tanpa akaun' },
    { Icon: ClockIcon, label: 'Status pesanan langsung' },
    { Icon: ReceiptIcon, label: 'Sejarah dan resit tersimpan' },
];

/**
 * Shared frame for the diner's login and register pages, used as a persistent Inertia layout: switching
 * between the two only swaps the form, so the header, the animated mark and the tab thumb stay put.
 * On phones the amber header sits on top and ends in a wave; on desktop it becomes the left column.
 */
export function CustomerAuthLayout({ children }: { children: ReactNode }) {
    const { component, props } = usePage();
    const { restaurantName, flash } = props;
    const reduce = useReducedMotion();
    const [hello, setHello] = useState(0);

    return (
        <div className="min-h-dvh bg-ground lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <header
                className={cn(
                    'relative overflow-hidden px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-14 sm:pt-6 sm:pb-24',
                    // On desktop it is pinned to the viewport, so a long form scrolls past while the brand stays in view.
                    'lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-center lg:self-start lg:py-10 lg:pr-28 lg:pl-14 xl:pl-20',
                    'bg-[linear-gradient(165deg,#ffc27c_0%,var(--color-amber)_48%,var(--color-amber-deep)_100%)]',
                    // Raised parts on the amber read their highlight and shade from the amber, not the clay.
                    '[--neu-dark:rgb(150_68_0/0.42)] [--neu-light:rgb(255_221_170/0.85)]',
                )}
            >
                <span className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/25 blur-3xl" aria-hidden />
                <span className="pointer-events-none absolute -bottom-20 -left-24 size-80 rounded-full bg-[#ffd9a3]/50 blur-3xl" aria-hidden />

                <Link href="/" className={buttonClass({ variant: 'soft', size: 'sm', className: 'absolute top-[max(0.75rem,env(safe-area-inset-top))] left-4 z-10 sm:top-6 sm:left-6 lg:top-8 lg:left-14 xl:left-20' })}>
                    <ArrowLeftIcon size={18} weight="bold" aria-hidden />
                    Menu
                </Link>

                <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                    {/* Decorative: hovering (or tapping, on a phone) says hello — the badge lifts and the mark plays. */}
                    <motion.div
                        className="grid size-28 place-items-center rounded-full bg-panel shadow-(--shadow-raised) sm:size-36 lg:size-48 max-sm:[@media(max-height:700px)]:size-24"
                        initial={reduce ? false : { scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={reduce ? undefined : { y: -4, rotate: -2 }}
                        whileTap={reduce ? undefined : { scale: 0.96 }}
                        onHoverStart={() => setHello((count) => count + 1)}
                        onTapStart={(event) => {
                            // A mouse click already played on hover; touch has no hover, so the tap plays it.
                            if ((event as PointerEvent).pointerType !== 'mouse') {
                                setHello((count) => count + 1);
                            }
                        }}
                        transition={spring}
                    >
                        <div className="grid size-[86%] place-items-center rounded-full bg-ground-deep shadow-[inset_4px_4px_9px_rgb(158_133_88/0.42),inset_-4px_-4px_9px_rgb(255_253_246/0.95)]">
                            <WarungMark className="size-[94%]" play={hello} />
                        </div>
                    </motion.div>

                    <p className="font-heading mt-3 text-[1.75rem] leading-tight font-extrabold text-balance text-ink sm:mt-4 sm:text-4xl lg:mt-8 lg:text-5xl">{restaurantName}</p>
                    {/* Dropped on short phones so the form, not the greeting, gets the screen. */}
                    <p className="mt-1 max-w-[36ch] text-[15px] font-medium text-ink/85 sm:mt-1.5 sm:text-base lg:mt-3 lg:max-w-[34ch] lg:text-xl max-sm:[@media(max-height:700px)]:hidden">
                        Rasa gerai kegemaran anda, sedia menanti.
                    </p>

                    <ul className="mt-8 hidden gap-3 lg:grid">
                        {PERKS.map(({ Icon: PerkIcon, label }) => (
                            <li key={label} className="flex items-center gap-3 text-base font-semibold text-ink">
                                <span className="grid size-10 place-items-center rounded-full bg-panel text-amber-deep shadow-(--shadow-raised-xs)" aria-hidden>
                                    <PerkIcon size={18} weight="bold" />
                                </span>
                                {label}
                            </li>
                        ))}
                    </ul>
                </div>

                <Wave />
            </header>

            <main id="kandungan" className="relative z-10 -mt-3 px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:-mt-14 lg:mt-0 lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-12 lg:py-6">
                {/* On phones the form sits on the clay under the wave, like a sheet; from tablet up it becomes a raised card. */}
                <div className="mx-auto w-full max-w-md sm:neu-card sm:p-7">
                    <nav aria-label="Akaun" className="neu-well-sm relative grid grid-cols-2 gap-1 p-1.5">
                        {TABS.map((tab) => {
                            const current = tab.component === component;

                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    aria-current={current ? 'page' : undefined}
                                    preserveScroll
                                    // Fetched as soon as the page opens, so switching tabs is instant even on a slow connection.
                                    prefetch="mount"
                                    className={cn(
                                        'relative grid h-11 place-items-center rounded-(--radius-control) text-[15px] font-bold transition-colors duration-150',
                                        current ? 'text-ink' : 'text-ink-soft hover:text-ink',
                                    )}
                                >
                                    {current && (
                                        <motion.span
                                            layoutId="auth-tab-thumb"
                                            className="absolute inset-0 rounded-(--radius-control) bg-panel shadow-(--shadow-raised-xs)"
                                            transition={reduce ? { duration: 0 } : { duration: duration.base, ease: ease.inOut }}
                                            aria-hidden
                                        />
                                    )}
                                    <span className="relative">{tab.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {flash.error && (
                        <p role="alert" className="neu-well-sm mt-5 flex gap-2 [--neu-bg:var(--color-alert-tint)] p-4 text-[15px] font-semibold text-alert">
                            <WarningCircleIcon size={22} weight="bold" className="shrink-0" aria-hidden />
                            {flash.error}
                        </p>
                    )}

                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={component}
                            className="mt-5 sm:mt-6"
                            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: { duration: duration.exit * 0.6 } }}
                            transition={{ duration: duration.base, ease: ease.out }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <Link href="/" className={buttonClass({ variant: 'soft', size: 'lg', className: 'mx-auto mt-6 w-full max-w-md' })}>
                    Teruskan tanpa akaun
                    <ArrowRightIcon size={18} weight="bold" aria-hidden />
                </Link>
            </main>
        </div>
    );
}

/** The header's soft wave: along the bottom on phones, down the right edge on desktop. Two layers give it depth. */
function Wave() {
    return (
        <>
            <svg viewBox="0 0 1440 140" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-16 w-full sm:h-20 lg:hidden" aria-hidden>
                <path d="M0 58 C 220 118 430 6 720 44 C 1010 82 1220 14 1440 50 V140 H0 Z" fill="var(--color-ground)" opacity="0.5" />
                <path d="M0 86 C 250 138 470 34 760 74 C 1040 112 1240 52 1440 84 V140 H0 Z" fill="var(--color-ground)" />
            </svg>
            <svg viewBox="0 0 140 1440" preserveAspectRatio="none" className="absolute inset-y-0 -right-px hidden h-full w-28 lg:block" aria-hidden>
                <path d="M58 0 C 118 220 6 430 44 720 C 82 1010 14 1220 50 1440 H140 V0 Z" fill="var(--color-ground)" opacity="0.5" />
                <path d="M86 0 C 138 250 34 470 74 760 C 112 1040 52 1240 84 1440 H140 V0 Z" fill="var(--color-ground)" />
            </svg>
        </>
    );
}
