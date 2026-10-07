import { Link, router } from '@inertiajs/react';
import { PencilSimpleIcon, PlusIcon, UsersThreeIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmButton } from '@/components/ConfirmButton';
import { SelectionToolbar } from '@/components/admin/OrderListControls';
import { useRowSelection } from '@/components/admin/useRowSelection';
import { Pagination } from '@/components/Pagination';
import { useFilters } from '@/components/admin/useFilters';
import { DigitDisplay } from '@/components/DigitDisplay';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchField } from '@/components/ui/SearchField';
import { cn, formatDateTime, formatPhone } from '@/lib/format';
import type { AdminCustomer, Paginated } from '@/types';

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
                <Link href="/admin/customers/create" className={buttonClass()}>
                    <PlusIcon size={18} weight="bold" aria-hidden />
                    Tambah pelanggan
                </Link>
            }
        >
            <SearchField className="max-w-md" label="Cari nama atau telefon" value={filters.q} onChange={(value) => set('q', value)} placeholder="Cari nama atau telefon" />

            {customers.data.length === 0 ? (
                <EmptyState
                    Icon={UsersThreeIcon}
                    className="mt-8"
                    title={filters.q ? 'Tiada pelanggan sepadan' : 'Belum ada pelanggan'}
                    description={filters.q ? 'Semak ejaan nama atau cuba beberapa digit nombor telefon.' : 'Pelanggan direkod secara automatik apabila mereka membuat pesanan pertama, atau tambah secara manual.'}
                >
                    {!filters.q && (
                        <Link href="/admin/customers/create" className={buttonClass()}>
                            <PlusIcon size={18} weight="bold" aria-hidden />
                            Tambah pelanggan
                        </Link>
                    )}
                </EmptyState>
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

                    <div className="neu-card mt-4 p-3">
                      <div className="relative overflow-x-auto">
                        <table className="data-table w-full min-w-[760px] text-left text-[15px]">
                            <thead>
                                <tr className="text-sm text-ink-muted">
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
                            <tbody>
                                {customers.data.map((customer) => (
                                    <tr key={customer.id} className={cn(selected.has(customer.id) && 'bg-amber-tint/40')}>
                                        <td className="py-3 pl-4">
                                            <label>
                                                <span className="sr-only">Pilih {customer.name}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(customer.id)}
                                                    onChange={() => toggleSelect(customer.id)}
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
                                                className={buttonClass({ variant: 'quiet', size: 'sm', className: 'group' })}
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
                    </div>
                </>
            )}

            <Pagination page={customers} />
        </AdminLayout>
    );
}
