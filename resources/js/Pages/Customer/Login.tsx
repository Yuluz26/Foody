import { Head, useForm, usePage } from '@inertiajs/react';
import { EnvelopeSimpleIcon, LockSimpleIcon } from '@phosphor-icons/react';
import type { FormEvent } from 'react';
import { CustomerAuthLayout } from '@/components/auth/CustomerAuthLayout';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { IconInput } from '@/components/ui/IconInput';
import { PasswordInput } from '@/components/ui/PasswordInput';

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
            <h1 className="text-2xl font-extrabold text-ink">Selamat kembali</h1>
            <p className="mt-1 text-[15px] text-ink-muted">Log masuk untuk lihat sejarah pesanan. Tak wajib untuk memesan.</p>

            <form onSubmit={submit} className="mt-5 grid gap-4 sm:mt-6 sm:gap-5" noValidate>
                <Field id="email" label="Emel" error={form.errors.email}>
                    {(control) => (
                        <IconInput
                            icon={EnvelopeSimpleIcon}
                            control={control}
                            type="email"
                            autoComplete="username"
                            inputMode="email"
                            placeholder="nama@contoh.com"
                            value={form.data.email}
                            onChange={(event) => form.setData('email', event.target.value)}
                        />
                    )}
                </Field>
                <Field id="password" label="Kata laluan" error={form.errors.password}>
                    {(control) => (
                        <PasswordInput
                            control={control}
                            icon={LockSimpleIcon}
                            autoComplete="current-password"
                            value={form.data.password}
                            onChange={(value) => form.setData('password', value)}
                        />
                    )}
                </Field>
                <label className="-my-2 flex min-h-11 cursor-pointer items-center gap-3 py-2 text-[15px] font-medium text-ink">
                    <input type="checkbox" checked={form.data.remember} onChange={(event) => form.setData('remember', event.target.checked)} />
                    Kekal log masuk pada peranti ini
                </label>
                <Button type="submit" variant="amber" size="lg" loading={form.processing} className="w-full">
                    {form.processing ? 'Menyemak...' : 'Log masuk'}
                </Button>
            </form>
        </>
    );
}

Login.layout = CustomerAuthLayout;
