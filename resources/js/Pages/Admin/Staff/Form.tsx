import { useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FormFooter } from '@/components/admin/FormFooter';
import { Field, inputClass } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import type { AdminStaff, SharedProps, StaffRole } from '@/types';

type StaffFields = {
    name: string;
    email: string;
    role: StaffRole;
    password: string;
    password_confirmation: string;
};

const ROLE_HINTS: Record<StaffRole, string> = {
    staff: 'Ringkasan dan pesanan sahaja. Tidak boleh memadam pesanan.',
    admin: 'Akses penuh: menu, slaid, pelanggan, kakitangan dan tetapan kedai.',
};

export default function StaffForm({ staff }: { staff: AdminStaff | null }) {
    const { auth } = usePage<SharedProps>().props;
    const isSelf = staff !== null && staff.id === auth.user?.id;
    const form = useForm<StaffFields>({
        name: staff?.name ?? '',
        email: staff?.email ?? '',
        role: staff?.role ?? 'staff',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (staff) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(`/admin/staff/${staff.id}`, { preserveScroll: true, onSuccess: () => form.reset('password', 'password_confirmation') });
        } else {
            form.post('/admin/staff', { preserveScroll: true });
        }
    };

    return (
        <AdminLayout title={staff ? `Edit ${staff.name}` : 'Tambah kakitangan'}>
            <form onSubmit={submit} noValidate className="max-w-3xl">
                <div className="grid gap-6 rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-5 sm:p-6">
                    <Field id="name" label="Nama" error={form.errors.name}>
                        {(control) => (
                            <input
                                {...control}
                                type="text"
                                autoComplete="name"
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
                    <Field
                        id="role"
                        label="Peranan"
                        error={form.errors.role}
                        hint={isSelf ? 'Anda tidak boleh menukar peranan akaun anda sendiri.' : ROLE_HINTS[form.data.role]}
                    >
                        {(control) => (
                            <select
                                {...control}
                                value={form.data.role}
                                disabled={isSelf}
                                onChange={(event) => form.setData('role', event.target.value as StaffRole)}
                                className={inputClass}
                            >
                                <option value="staff">Staf</option>
                                <option value="admin">Admin</option>
                            </select>
                        )}
                    </Field>
                    <Field
                        id="password"
                        label="Kata laluan"
                        optional={Boolean(staff)}
                        error={form.errors.password}
                        hint={staff ? 'Biarkan kosong untuk kekalkan kata laluan sedia ada. Menukarnya melog keluar sesi akaun ini di peranti lain.' : undefined}
                    >
                        {(control) => (
                            <PasswordInput
                                control={control}
                                autoComplete="new-password"
                                value={form.data.password}
                                onChange={(value) => form.setData('password', value)}
                            />
                        )}
                    </Field>
                    <Field id="password_confirmation" label="Sahkan kata laluan" optional={Boolean(staff)} error={form.errors.password_confirmation}>
                        {(control) => (
                            <PasswordInput
                                control={control}
                                autoComplete="new-password"
                                value={form.data.password_confirmation}
                                onChange={(value) => form.setData('password_confirmation', value)}
                            />
                        )}
                    </Field>
                    {!staff && <p className="text-sm text-ink-muted">Akaun baharu perlu diluluskan di senarai kakitangan sebelum boleh log masuk.</p>}
                </div>
                <FormFooter cancelHref="/admin/staff" processing={form.processing} isDirty={form.isDirty} saveLabel={staff ? 'Simpan perubahan' : 'Tambah kakitangan'} />
            </form>
        </AdminLayout>
    );
}
