import { useForm } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import type { AdminStaff } from '@/types';

type AccountFields = { name: string; email: string };
type PasswordFields = { current_password: string; password: string; password_confirmation: string };

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    const id = title.toLowerCase().replace(/\s+/g, '-');

    return (
        <section aria-labelledby={id} className="grid gap-5 rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-5 sm:p-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
            <div>
                <h2 id={id} className="font-heading text-xl font-extrabold text-ink">
                    {title}
                </h2>
                {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
            </div>
            <div className="grid content-start gap-5">{children}</div>
        </section>
    );
}

export default function Profile({ profile }: { profile: AdminStaff }) {
    const accountForm = useForm<AccountFields>({ name: profile.name, email: profile.email });
    const passwordForm = useForm<PasswordFields>({ current_password: '', password: '', password_confirmation: '' });

    const submitAccount = (event: FormEvent) => {
        event.preventDefault();
        accountForm.transform((data) => ({ ...data, _method: 'put' }));
        accountForm.post('/admin/profile', { preserveScroll: true });
    };

    const submitPassword = (event: FormEvent) => {
        event.preventDefault();
        passwordForm.transform((data) => ({ ...data, _method: 'put' }));
        passwordForm.post('/admin/profile/password', {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <AdminLayout title="Profil saya">
            <div className="grid max-w-3xl gap-6">
                <form onSubmit={submitAccount} noValidate>
                    <Panel title="Maklumat akaun" description="Nama dan emel log masuk anda.">
                        <Field id="name" label="Nama" error={accountForm.errors.name}>
                            {(control) => (
                                <input
                                    {...control}
                                    type="text"
                                    autoComplete="name"
                                    maxLength={100}
                                    value={accountForm.data.name}
                                    onChange={(event) => accountForm.setData('name', event.target.value)}
                                    className={inputClass}
                                />
                            )}
                        </Field>
                        <Field id="email" label="Emel" error={accountForm.errors.email}>
                            {(control) => (
                                <input
                                    {...control}
                                    type="email"
                                    autoComplete="username"
                                    inputMode="email"
                                    value={accountForm.data.email}
                                    onChange={(event) => accountForm.setData('email', event.target.value)}
                                    className={inputClass}
                                />
                            )}
                        </Field>
                        <div className="flex items-center justify-end gap-3">
                            {accountForm.isDirty && !accountForm.processing && <p className="mr-auto text-sm font-semibold text-ink-muted">Ada perubahan belum disimpan</p>}
                            <Button type="submit" loading={accountForm.processing} className="min-w-32">
                                {accountForm.processing ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </div>
                    </Panel>
                </form>

                <form onSubmit={submitPassword} noValidate>
                    <Panel title="Tukar kata laluan" description="Sahkan kata laluan semasa untuk menukar kata laluan.">
                        <Field id="current_password" label="Kata laluan semasa" error={passwordForm.errors.current_password}>
                            {(control) => (
                                <PasswordInput
                                    control={control}
                                    autoComplete="current-password"
                                    value={passwordForm.data.current_password}
                                    onChange={(value) => passwordForm.setData('current_password', value)}
                                />
                            )}
                        </Field>
                        <Field id="password" label="Kata laluan baharu" error={passwordForm.errors.password}>
                            {(control) => (
                                <PasswordInput
                                    control={control}
                                    autoComplete="new-password"
                                    value={passwordForm.data.password}
                                    onChange={(value) => passwordForm.setData('password', value)}
                                />
                            )}
                        </Field>
                        <Field id="password_confirmation" label="Sahkan kata laluan baharu" error={passwordForm.errors.password_confirmation}>
                            {(control) => (
                                <PasswordInput
                                    control={control}
                                    autoComplete="new-password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(value) => passwordForm.setData('password_confirmation', value)}
                                />
                            )}
                        </Field>
                        <div className="flex items-center justify-end gap-3">
                            <Button type="submit" loading={passwordForm.processing} className="min-w-32">
                                {passwordForm.processing ? 'Menyimpan...' : 'Tukar kata laluan'}
                            </Button>
                        </div>
                    </Panel>
                </form>
            </div>
        </AdminLayout>
    );
}
