import { Head, useForm, usePage } from '@inertiajs/react';
import { WarningCircleIcon } from '@phosphor-icons/react';
import type { FormEvent } from 'react';
import { DigitDisplay } from '@/components/DigitDisplay';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';

/** The staff side of the login: the same digit board the panel runs on, so the first screen already says what the console is. */
function ConsolePanel({ brandName }: { brandName: string }) {
    return (
        <div className="relative flex min-h-72 flex-col justify-between gap-10 overflow-hidden px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8 lg:min-h-dvh lg:px-12 lg:py-12">
            <p className="font-heading text-xl font-extrabold text-ink lg:text-2xl">{brandName}</p>

            <div className="neu-card mx-auto w-full max-w-sm p-6 lg:p-8">
                <p className="text-sm font-medium text-ink-soft">Pesanan baru</p>
                <div className="mt-2.5">
                    <DigitDisplay value="WR0042" size="xl" label="Contoh nombor pesanan" />
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                    <StatusBadge status="pending" />
                    <StatusBadge status="preparing" />
                    <StatusBadge status="ready" />
                </div>
            </div>

            <div>
                <p className="font-heading max-w-xs text-2xl leading-tight font-extrabold text-ink lg:max-w-sm lg:text-4xl">Kawal kedai anda, bila-bila masa.</p>
                <p className="mt-2 max-w-xs text-[15px] text-ink-soft lg:max-w-sm">Pesanan, menu dan tetapan kedai, semuanya di satu tempat.</p>
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
            <main id="kandungan" className="grid min-h-dvh bg-ground lg:grid-cols-2">
                <ConsolePanel brandName={restaurantName} />

                <div className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
                    <div className="w-full max-w-sm">
                        <h1 className="text-2xl font-extrabold text-ink">Log masuk panel kedai</h1>
                        <p className="mt-1 text-[15px] text-ink-muted">Untuk kakitangan sahaja.</p>
                        {flash.error && (
                            <p role="alert" className="neu-well-sm mt-5 flex gap-2 [--neu-bg:var(--color-alert-tint)] p-4 text-[15px] font-semibold text-alert">
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
