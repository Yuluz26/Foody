import { Head, useForm, usePage } from '@inertiajs/react';
import { BellRingingIcon, ChartLineUpIcon, CheckCircleIcon, ReceiptIcon, WarningCircleIcon } from '@phosphor-icons/react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { imageSrc, imageSrcSet } from '@/lib/format';

const CONSOLE_IMAGE = 'https://images.pexels.com/photos/37594407/pexels-photo-37594407/free-photo-of-efficient-counter-service-in-a-modern-restaurant.jpeg';

/**
 * A different concept from the customer/guest auth pages on purpose: a bright, daylit counter-
 * service photo (not the customer pages' moody night-market shots) under a light cream scrim, with
 * a few floating "dashboard fragment" cards standing in for the console staff are about to open.
 * The form panel is plain white — a genuinely light page, not the old dark module.
 */
function ConsolePanel({ brandName }: { brandName: string }) {
    return (
        <div className="relative h-[38vh] min-h-72 overflow-hidden bg-amber-tint lg:h-auto lg:min-h-dvh">
            <img
                src={imageSrc(CONSOLE_IMAGE, 1440)}
                srcSet={imageSrcSet(CONSOLE_IMAGE)}
                sizes="(min-width: 1024px) 50vw, 100vw"
                alt="Kakitangan kaunter melayan pelanggan menggunakan sistem POS di sebuah restoran"
                fetchPriority="high"
                className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/55 to-white/10" aria-hidden />
            <div className="absolute inset-0 bg-amber-deep/10" aria-hidden />

            <p className="relative z-10 inline-block rounded-full bg-white/85 px-3.5 py-1.5 text-lg font-extrabold text-ink shadow-sm backdrop-blur-sm mx-6 mt-[max(1.25rem,env(safe-area-inset-top))] lg:mx-10 lg:mt-8 lg:text-xl">
                {brandName}
            </p>

            <div className="relative mx-auto h-full max-w-md px-6 lg:px-10">
                <div className="absolute top-[12%] left-0 w-44 -rotate-6 rounded-2xl bg-white p-4 shadow-xl shadow-amber-deep/10 sm:w-48">
                    <div className="flex items-center gap-2.5">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-tint text-amber-deep">
                            <ReceiptIcon size={18} weight="bold" aria-hidden />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs text-ink-muted">Pesanan baru</p>
                            <p className="truncate font-bold text-ink">FD0042</p>
                        </div>
                    </div>
                </div>

                <div className="absolute top-[38%] right-0 hidden w-44 rotate-3 rounded-2xl bg-white p-4 shadow-xl shadow-amber-deep/10 lg:block">
                    <div className="flex items-center gap-2">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-leaf-tint text-leaf">
                            <CheckCircleIcon size={18} weight="bold" aria-hidden />
                        </span>
                        <p className="text-sm font-semibold text-ink">Disahkan</p>
                    </div>
                    <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100">
                        <div className="h-1.5 w-3/4 rounded-full bg-leaf" />
                    </div>
                </div>

                <div className="absolute bottom-[30%] left-[12%] hidden w-40 -rotate-3 rounded-2xl bg-white p-3.5 shadow-xl shadow-amber-deep/10 lg:block">
                    <div className="flex items-center gap-2.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-tint text-amber-deep">
                            <ChartLineUpIcon size={16} weight="bold" aria-hidden />
                        </span>
                        <div>
                            <p className="text-[11px] text-ink-muted">Jualan hari ini</p>
                            <p className="text-sm font-bold text-ink">RM 241.60</p>
                        </div>
                    </div>
                </div>

                <div className="absolute right-[6%] bottom-[8%] hidden w-36 rotate-6 rounded-2xl bg-white p-3.5 shadow-xl shadow-amber-deep/10 lg:block">
                    <div className="flex items-center gap-2">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-tint text-amber-deep">
                            <BellRingingIcon size={16} weight="bold" aria-hidden />
                        </span>
                        <p className="text-sm font-semibold text-ink">Siap!</p>
                    </div>
                </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent px-6 pt-10 pb-6 lg:from-transparent lg:via-transparent lg:pt-0 lg:pb-12 lg:px-10">
                <p className="font-heading max-w-xs text-xl leading-tight font-extrabold text-ink sm:text-2xl lg:max-w-sm lg:text-4xl">Kawal kedai anda, bila-bila masa.</p>
                <p className="mt-2 max-w-xs text-[15px] text-ink-soft lg:max-w-sm">Panel kedai untuk pesanan, menu dan tetapan — dalam satu tempat.</p>
            </div>
        </div>
    );
}

export default function Login() {
    const { restaurantName, flash } = usePage().props;
    const form = useForm({ email: '', password: '', remember: false });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/admin/login', { onFinish: () => form.reset('password') });
    };

    return (
        <>
            <Head title={`Log masuk | Panel ${restaurantName}`} />
            <main id="kandungan" className="grid min-h-dvh bg-white lg:grid-cols-2">
                <ConsolePanel brandName={restaurantName} />

                <div className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
                    <div className="w-full max-w-sm">
                        <h1 className="text-2xl font-extrabold text-ink">Log masuk panel kedai</h1>
                        <p className="mt-1 text-[15px] text-ink-muted">Untuk kakitangan sahaja.</p>
                        {flash.error && (
                            <p role="alert" className="mt-5 flex gap-2 rounded-(--radius-panel) border-2 border-alert bg-alert-tint p-4 text-[15px] font-semibold text-alert">
                                <WarningCircleIcon size={22} weight="bold" className="shrink-0" aria-hidden />
                                {flash.error}
                            </p>
                        )}
                        <form onSubmit={submit} className="mt-6 grid gap-5" noValidate>
                            <Field id="email" label="Emel" error={form.errors.email}>
                                {(control) => (
                                    <input
                                        {...control}
                                        type="email"
                                        autoComplete="username"
                                        inputMode="email"
                                        autoFocus
                                        value={form.data.email}
                                        onChange={(event) => form.setData('email', event.target.value)}
                                        className={inputClass}
                                    />
                                )}
                            </Field>
                            <Field id="password" label="Kata laluan" error={form.errors.password}>
                                {(control) => (
                                    <PasswordInput
                                        control={control}
                                        autoComplete="current-password"
                                        value={form.data.password}
                                        onChange={(value) => form.setData('password', value)}
                                    />
                                )}
                            </Field>
                            <label className="-my-2 flex min-h-11 cursor-pointer items-center gap-3 py-2 text-[15px] font-medium text-ink">
                                <input
                                    type="checkbox"
                                    checked={form.data.remember}
                                    onChange={(event) => form.setData('remember', event.target.checked)}
                                    className="size-5 accent-ink"
                                />
                                Kekal log masuk pada peranti ini
                            </label>
                            <Button type="submit" variant="amber" size="lg" loading={form.processing} className="w-full">
                                {form.processing ? 'Menyemak...' : 'Log masuk'}
                            </Button>
                        </form>
                    </div>
                </div>
            </main>
        </>
    );
}
