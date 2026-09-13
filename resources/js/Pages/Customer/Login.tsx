import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AuthSplitScreen } from '@/components/auth/AuthSplitScreen';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';

const HERO_IMAGE = 'https://images.pexels.com/photos/34117379/pexels-photo-34117379/free-photo-of-street-food-cooking-in-penang-night-market.jpeg';

export default function Login() {
    const { restaurantName } = usePage().props;
    const form = useForm({ email: '', password: '', remember: false });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/log-masuk', { onFinish: () => form.reset('password') });
    };

    return (
        <>
            <Head title={`Log masuk | ${restaurantName}`} />
            <main id="kandungan">
                <AuthSplitScreen
                    homeHref="/"
                    imageUrl={HERO_IMAGE}
                    imageAlt="Penjaja memasak di gerai malam dengan api dan bunga api, gaya hawker Malaysia"
                    brandName={restaurantName}
                    heroTitle="Rasa gerai kegemaran anda, sedia menanti."
                    heroSubtitle="Log masuk untuk terus memesan hidangan segar hari ini."
                >
                    <h1 className="text-2xl font-extrabold text-ink">Log masuk</h1>
                    <p className="mt-1 text-[15px] text-ink-muted">Untuk melihat menu dan memesan.</p>
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
                        <p className="text-center text-[15px] text-ink-muted">
                            Belum ada akaun?{' '}
                            <Link href="/daftar" className="font-semibold text-ink underline decoration-rule-strong hover:decoration-ink">
                                Daftar akaun
                            </Link>
                        </p>
                    </form>
                </AuthSplitScreen>
            </main>
        </>
    );
}
