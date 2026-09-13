import { Link, router } from '@inertiajs/react';
import { MagnifyingGlassIcon, PencilSimpleIcon, PlusIcon, UsersThreeIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmButton } from '@/components/ConfirmButton';
import { SelectionToolbar } from '@/components/admin/OrderListControls';
import { useRowSelection } from '@/components/admin/useRowSelection';
import { Pagination } from '@/components/Pagination';
import { useFilters } from '@/components/admin/useFilters';
import { DigitDisplay } from '@/components/DigitDisplay';
import { inputClass } from '@/components/ui/Field';
import { cn, formatDateTime, formatPhone } from '@/lib/format';
import type { AdminCustomer, Paginated } from '@/types';

const addLinkClass =
    'flex h-12 items-center gap-2 rounded-(--radius-control) bg-ink px-4 font-semibold text-white transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:bg-ink-soft hover:shadow-(--shadow-lift) active:translate-y-0 active:scale-[0.97]';

export default function CustomersIndex({ customers, filters: initial }: { customers: Paginated<AdminCustomer>; filters: { q: string } }) {
    const { filters, set } = useFilters('/admin/customers', initial);
    const [bulkPending, setBulkPending] = useState(false);
    const { selected, toggleSelect, allSelected, toggleSelectAll, clear } = useRowSelection(customers.data);

    const bulkDelete = () => {
        setBulkPending(true);
        router.post(
            '/admin/customers/bulk',
            { ids: [...selected], action: 'delete' },
            { preserveScroll: true, onSuccess: clear, onFinish: () => setBulkPending(false) },
        );
    };

    return (
        <AdminLayout
            title="Pelanggan"
            actions={
                <Link href="/admin/customers/create" className={addLinkClass}>
                    <PlusIcon size={18} weight="bold" aria-hidden />
                    Tambah pelanggan
                </Link>
            }
        >
            <label className="relative block max-w-md">
                <span className="sr-only">Cari nama atau telefon</span>
                <MagnifyingGlassIcon size={20} weight="bold" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" aria-hidden />
                <input type="search" value={filters.q} onChange={(event) => set('q', event.target.value)} placeholder="Cari nama atau telefon" className={cn(inputClass, 'pl-10')} />
            </label>

            {customers.data.length === 0 ? (
                <div className="mt-8 flex flex-col items-start gap-4 rounded-(--radius-panel) border-2 border-dashed border-rule-strong p-8">
                    <UsersThreeIcon size={36} weight="bold" className="shrink-0 text-rule-strong" aria-hidden />
                    <div>
                        <p className="text-lg font-semibold">{filters.q ? 'Tiada pelanggan sepadan' : 'Belum ada pelanggan'}</p>
                        <p className="text-[15px] text-ink-muted">
                            {filters.q
                                ? 'Semak ejaan nama atau cuba beberapa digit nombor telefon.'
                                : 'Pelanggan direkod secara automatik apabila mereka membuat pesanan pertama, atau tambah secara manual.'}
                        </p>
                    </div>
                    {!filters.q && (
                        <Link href="/admin/customers/create" className={addLinkClass}>
                            <PlusIcon size={18} weight="bold" aria-hidden />
                            Tambah pelanggan
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <SelectionToolbar count={selected.size} allSelected={allSelected} bulkPending={bulkPending} onToggleAll={toggleSelectAll} onClear={clear} noun="pelanggan">
                        <ConfirmButton
                            label="Padam"
                            size="sm"
                            disabled={bulkPending}
                            title={`Padam ${selected.size} pelanggan?`}
                            message="Akaun yang dipilih akan dipadam selama-lamanya. Sejarah pesanan mereka kekal, tanpa dikaitkan dengan akaun."
                            confirmLabel="Ya, padam"
                            onConfirm={bulkDelete}
                        />
                    </SelectionToolbar>

                    <div className="overflow-x-auto border-y border-rule bg-panel">
                        <table className="w-full min-w-[760px] text-left text-[15px]">
                            <thead>
                                <tr className="border-b-2 border-rule-strong text-sm text-ink-muted">
                                    <th scope="col" className="w-12 py-3 pl-4">
                                        <span className="sr-only">Pilih</span>
                                    </th>
                                    <th scope="col" className="px-4 py-3 font-semibold">
                                        Nama
                                    </th>
                                    <th scope="col" className="px-4 py-3 font-semibold">
                                        Telefon
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                                        Pesanan
                                    </th>
                                    <th scope="col" className="px-4 py-3 font-semibold">
                                        Pesanan terakhir
                                    </th>
                                    <th scope="col" className="px-4 py-3 font-semibold">
                                        Pelanggan sejak
                                    </th>
                                    <th scope="col" className="px-4 py-3">
                                        <span className="sr-only">Tindakan</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-rule">
                                {customers.data.map((customer) => (
                                    <tr key={customer.id} className={cn('transition-colors duration-150 hover:bg-ground', selected.has(customer.id) && 'bg-amber-tint/40')}>
                                        <td className="py-3 pl-4">
                                            <label>
                                                <span className="sr-only">Pilih {customer.name}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(customer.id)}
                                                    onChange={() => toggleSelect(customer.id)}
                                                    className="size-5 rounded-sm border-2 border-rule-strong accent-ink"
                                                />
                                            </label>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/customers/${customer.id}/edit`} className="font-semibold hover:text-ink-soft hover:underline">
                                                {customer.name}
                                            </Link>
                                            {customer.email && <p className="truncate text-sm text-ink-muted">{customer.email}</p>}
                                        </td>
                                        <td className="tabular px-4 py-3">
                                            <a href={`tel:${customer.phone}`} className="hover:text-ink-soft hover:underline">
                                                {formatPhone(customer.phone)}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <DigitDisplay value={String(customer.ordersCount ?? 0)} chip={false} size="md" />
                                        </td>
                                        <td className="px-4 py-3 text-ink-soft">{customer.lastOrderAt ? formatDateTime(customer.lastOrderAt) : 'Tiada'}</td>
                                        <td className="px-4 py-3 text-ink-soft">{formatDateTime(customer.createdAt)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/admin/customers/${customer.id}/edit`}
                                                aria-label={`Edit ${customer.name}`}
                                                className="group inline-flex h-10 items-center gap-1.5 rounded-(--radius-control) px-3 text-sm font-semibold transition-colors duration-150 hover:bg-rule/60"
                                            >
                                                <PencilSimpleIcon size={16} weight="bold" aria-hidden className="transition-transform duration-150 ease-out group-hover:-rotate-12" />
                                                <span className="sr-only sm:not-sr-only">Edit</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <Pagination page={customers} />
        </AdminLayout>
    );
}
