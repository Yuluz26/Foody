import { Head, useForm, usePage } from '@inertiajs/react';
import { EnvelopeSimpleIcon, LockSimpleIcon, PhoneIcon, ShieldCheckIcon, UserIcon } from '@phosphor-icons/react';
import type { FormEvent } from 'react';
import { CustomerAuthLayout } from '@/components/auth/CustomerAuthLayout';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { IconInput } from '@/components/ui/IconInput';
import { PasswordInput } from '@/components/ui/PasswordInput';

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
            <h1 className="text-2xl font-extrabold text-ink">Cipta akaun</h1>
            <p className="mt-1 text-[15px] text-ink-muted">Percuma. Simpan sejarah pesanan dan resit anda di satu tempat.</p>

            <form onSubmit={submit} className="mt-5 grid gap-4 sm:mt-6 sm:gap-5" noValidate>
                <Field id="name" label="Nama" error={form.errors.name}>
                    {(control) => (
                        <IconInput
                            icon={UserIcon}
                            control={control}
                            type="text"
                            autoComplete="name"
                            maxLength={100}
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                        />
                    )}
                </Field>
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
                <Field id="phone" label="Nombor telefon" error={form.errors.phone} hint="Untuk kami hubungi jika perlu">
                    {(control) => (
                        <IconInput
                            icon={PhoneIcon}
                            control={control}
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            maxLength={20}
                            placeholder="012-345 6789"
                            value={form.data.phone}
                            onChange={(event) => form.setData('phone', event.target.value)}
                            className="tabular"
                        />
                    )}
                </Field>
                <Field id="password" label="Kata laluan" error={form.errors.password}>
                    {(control) => (
                        <PasswordInput
                            control={control}
                            icon={LockSimpleIcon}
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
                            icon={ShieldCheckIcon}
                            autoComplete="new-password"
                            value={form.data.password_confirmation}
                            onChange={(value) => form.setData('password_confirmation', value)}
                        />
                    )}
                </Field>
                <Button type="submit" variant="amber" size="lg" loading={form.processing} className="w-full">
                    {form.processing ? 'Mendaftar...' : 'Daftar akaun'}
                </Button>
            </form>
        </>
    );
}

Register.layout = CustomerAuthLayout;
