import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FormFooter } from '@/components/admin/FormFooter';
import { ImageInput } from '@/components/admin/ImageInput';
import { Field, inputClass } from '@/components/ui/Field';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/format';
import type { AdminCategory } from '@/types';

type CategoryFields = {
    name: string;
    description: string;
    is_active: boolean;
    image: File | null;
    remove_image: boolean;
};

export default function CategoryForm({ category }: { category: AdminCategory | null }) {
    const form = useForm<CategoryFields>({
        name: category?.name ?? '',
        description: category?.description ?? '',
        is_active: category?.isActive ?? true,
        image: null,
        remove_image: false,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (category) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(`/admin/categories/${category.id}`, { forceFormData: true, preserveScroll: true });
        } else {
            form.post('/admin/categories', { forceFormData: true, preserveScroll: true });
        }
    };

    return (
        <AdminLayout title={category ? `Edit ${category.name}` : 'Tambah kategori'}>
            <form onSubmit={submit} noValidate className="max-w-3xl">
                <div className="grid gap-6 rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-5 sm:p-6">
                    <Field id="name" label="Nama kategori" error={form.errors.name} hint="Pendek dan jelas, contoh: Mi & Kuey Teow">
                        {(control) => <input {...control} type="text" maxLength={100} value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className={inputClass} />}
                    </Field>
                    <Field id="description" label="Penerangan" optional error={form.errors.description} hint="Dipaparkan di bawah nama kategori pada menu.">
                        {(control) => (
                            <textarea
                                {...control}
                                rows={2}
                                maxLength={500}
                                value={form.data.description}
                                onChange={(event) => form.setData('description', event.target.value)}
                                className={cn(inputClass, 'resize-y')}
                            />
                        )}
                    </Field>
                    <ImageInput
                        label="Gambar kategori"
                        currentUrl={category?.imageUrl ?? null}
                        file={form.data.image}
                        removed={form.data.remove_image}
                        onFileChange={(file) => form.setData('image', file)}
                        onRemovedChange={(removed) => form.setData('remove_image', removed)}
                        error={form.errors.image}
                    />
                    <div className="border-t border-rule pt-5">
                        <Switch
                            checked={form.data.is_active}
                            onChange={(checked) => form.setData('is_active', checked)}
                            label="Paparkan kepada pelanggan"
                            description="Kategori tersembunyi dan produknya tidak muncul di menu."
                        />
                    </div>
                </div>
                <FormFooter cancelHref="/admin/categories" processing={form.processing} isDirty={form.isDirty} saveLabel={category ? 'Simpan perubahan' : 'Tambah kategori'} />
            </form>
        </AdminLayout>
    );
}
