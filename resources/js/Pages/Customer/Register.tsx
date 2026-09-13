import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AuthSplitScreen } from '@/components/auth/AuthSplitScreen';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { cn } from '@/lib/format';

const HERO_IMAGE = 'https://images.pexels.com/photos/32541943/pexels-photo-32541943/free-photo-of-street-vendor-grilling-satay-in-urban-setting.jpeg';

export default function Register() {
    const { restaurantName } = usePage().props;
    const form = useForm({ name: '', email: '', phone: '', password: '', password_confirmation: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/daftar', { onFinish: () => form.reset('password', 'password_confirmation') });
    };

    return (
        <>
            <Head title={`Daftar akaun | ${restaurantName}`} />
            <main id="kandungan">
                <AuthSplitScreen
                    homeHref="/"
                    imageUrl={HERO_IMAGE}
                    imageAlt="Penjaja satay memanggang di gerai jalanan, gaya hawker Malaysia"
                    brandName={restaurantName}
                    heroTitle="Sertai kami, nikmati setiap hidangan."
                    heroSubtitle="Daftar akaun percuma untuk mula memesan dan menjejak pesanan anda."
                >
                    <h1 className="text-2xl font-extrabold text-ink">Daftar akaun</h1>
                    <p className="mt-1 text-[15px] text-ink-muted">Untuk mula memesan dan menjejak pesanan.</p>
                    <form onSubmit={submit} className="mt-6 grid gap-5" noValidate>
                        <Field id="name" label="Nama" error={form.errors.name}>
                            {(control) => (
                                <input
                                    {...control}
                                    type="text"
                                    autoComplete="name"
                                    autoFocus
                                    maxLength={100}
                                    value={form.data.name}
                                    onChange={(event) => form.setData('name', event.target.value)}
                                    className={inputClass}
                                />
                            )}
                        </Field>
                        <Field id="email" label="Emel" error={form.errors.email}>
                            {(control) => (
                                <input
                                    {...control}
                                    type="email"
                                    autoComplete="username"
                                    inputMode="email"
                                    value={form.data.email}
                                    onChange={(event) => form.setData('email', event.target.value)}
                                    className={inputClass}
                                />
                            )}
                        </Field>
                        <Field id="phone" label="Nombor telefon" error={form.errors.phone} hint="Untuk kami hubungi jika perlu">
                            {(control) => (
                                <input
                                    {...control}
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    maxLength={20}
                                    placeholder="012-345 6789"
                                    value={form.data.phone}
                                    onChange={(event) => form.setData('phone', event.target.value)}
                                    className={cn(inputClass, 'tabular')}
                                />
                            )}
                        </Field>
                        <Field id="password" label="Kata laluan" error={form.errors.password}>
                            {(control) => (
                                <PasswordInput
                                    control={control}
                                    autoComplete="new-password"
                                    value={form.data.password}
                                    onChange={(value) => form.setData('password', value)}
                                />
                            )}
                        </Field>
                        <Field id="password_confirmation" label="Sahkan kata laluan" error={form.errors.password_confirmation}>
                            {(control) => (
                                <PasswordInput
                                    control={control}
                                    autoComplete="new-password"
                                    value={form.data.password_confirmation}
                                    onChange={(value) => form.setData('password_confirmation', value)}
                                />
                            )}
                        </Field>
                        <Button type="submit" variant="amber" size="lg" loading={form.processing} className="w-full">
                            {form.processing ? 'Mendaftar...' : 'Daftar akaun'}
                        </Button>
                        <p className="text-center text-[15px] text-ink-muted">
                            Sudah ada akaun?{' '}
                            <Link href="/log-masuk" className="font-semibold text-ink underline decoration-rule-strong hover:decoration-ink">
                                Log masuk
                            </Link>
                        </p>
                    </form>
                </AuthSplitScreen>
            </main>
        </>
    );
}
