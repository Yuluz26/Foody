import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FormFooter } from '@/components/admin/FormFooter';
import { Field, inputClass } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import type { AdminStaff } from '@/types';

type StaffFields = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function StaffForm({ staff }: { staff: AdminStaff | null }) {
    const form = useForm<StaffFields>({
        name: staff?.name ?? '',
        email: staff?.email ?? '',
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
                        id="password"
                        label="Kata laluan"
                        optional={Boolean(staff)}
                        error={form.errors.password}
                        hint={staff ? 'Biarkan kosong untuk kekalkan kata laluan sedia ada.' : undefined}
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
                    {!staff && <p className="text-sm text-ink-muted">Akaun baharu akan menunggu kelulusan sebelum boleh log masuk ke panel ini.</p>}
                </div>
                <FormFooter cancelHref="/admin/staff" processing={form.processing} isDirty={form.isDirty} saveLabel={staff ? 'Simpan perubahan' : 'Tambah kakitangan'} />
            </form>
        </AdminLayout>
    );
}
