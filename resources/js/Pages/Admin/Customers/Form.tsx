import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FormFooter } from '@/components/admin/FormFooter';
import { Field, inputClass } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import type { AdminCustomer } from '@/types';

type CustomerFields = {
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
};

export default function CustomerForm({ customer }: { customer: AdminCustomer | null }) {
    const form = useForm<CustomerFields>({
        name: customer?.name ?? '',
        email: customer?.email ?? '',
        phone: customer?.phone ?? '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (customer) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(`/admin/customers/${customer.id}`, { preserveScroll: true, onSuccess: () => form.reset('password', 'password_confirmation') });
        } else {
            form.post('/admin/customers', { preserveScroll: true });
        }
    };

    return (
        <AdminLayout title={customer ? `Edit ${customer.name}` : 'Tambah pelanggan'}>
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
                    <Field id="phone" label="Telefon" error={form.errors.phone}>
                        {(control) => (
                            <input
                                {...control}
                                type="tel"
                                autoComplete="tel"
                                value={form.data.phone}
                                onChange={(event) => form.setData('phone', event.target.value)}
                                className={inputClass}
                            />
                        )}
                    </Field>
                    <Field id="email" label="Emel" optional error={form.errors.email} hint="Diperlukan hanya jika pelanggan mahu log masuk ke akaun sendiri.">
                        {(control) => (
                            <input
                                {...control}
                                type="email"
                                autoComplete="email"
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
                        optional
                        error={form.errors.password}
                        hint={
                            customer
                                ? 'Biarkan kosong untuk kekalkan kata laluan sedia ada. Menukarnya melog keluar sesi akaun ini di peranti lain.'
                                : 'Tetapkan hanya jika pelanggan akan log masuk sendiri. Boleh ditambah kemudian.'
                        }
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
                    <Field id="password_confirmation" label="Sahkan kata laluan" optional error={form.errors.password_confirmation}>
                        {(control) => (
                            <PasswordInput
                                control={control}
                                autoComplete="new-password"
                                value={form.data.password_confirmation}
                                onChange={(value) => form.setData('password_confirmation', value)}
                            />
                        )}
                    </Field>
                </div>
                <FormFooter cancelHref="/admin/customers" processing={form.processing} isDirty={form.isDirty} saveLabel={customer ? 'Simpan perubahan' : 'Tambah pelanggan'} />
            </form>
        </AdminLayout>
    );
}
