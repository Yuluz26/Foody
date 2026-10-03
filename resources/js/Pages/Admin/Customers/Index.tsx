import { UsersThreeIcon } from '@phosphor-icons/react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Pagination } from '@/components/Pagination';
import { useFilters } from '@/components/admin/useFilters';
import { DigitDisplay } from '@/components/DigitDisplay';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchField } from '@/components/ui/SearchField';
import { formatDateTime, formatPhone } from '@/lib/format';
import type { Paginated } from '@/types';

type CustomerRow = {
    id: number;
    name: string;
    phone: string;
    ordersCount: number;
    lastOrderAt: string | null;
    createdAt: string;
};

export default function CustomersIndex({ customers, filters: initial }: { customers: Paginated<CustomerRow>; filters: { q: string } }) {
    const { filters, set } = useFilters('/admin/customers', initial);

    return (
        <AdminLayout title="Pelanggan">
            <SearchField className="max-w-md" label="Cari nama atau telefon" value={filters.q} onChange={(value) => set('q', value)} placeholder="Cari nama atau telefon" />

            {customers.data.length === 0 ? (
                <EmptyState
                    Icon={UsersThreeIcon}
                    className="mt-8"
                    title={filters.q ? 'Tiada pelanggan sepadan' : 'Belum ada pelanggan'}
                    description={filters.q ? 'Semak ejaan nama atau cuba beberapa digit nombor telefon.' : 'Pelanggan direkod secara automatik apabila mereka membuat pesanan pertama.'}
                />
            ) : (
                <div className="neu-card mt-6 p-3">
                  <div className="overflow-x-auto">
                    <table className="data-table w-full min-w-[640px] text-left text-[15px]">
                        <thead>
                            <tr className="text-sm text-ink-muted">
                                <th scope="col" className="px-4 py-3 font-semibold">Nama</th>
                                <th scope="col" className="px-4 py-3 font-semibold">Telefon</th>
                                <th scope="col" className="px-4 py-3 text-right font-semibold">Pesanan</th>
                                <th scope="col" className="px-4 py-3 font-semibold">Pesanan terakhir</th>
                                <th scope="col" className="px-4 py-3 font-semibold">Pelanggan sejak</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.data.map((customer) => (
                                <tr key={customer.id}>
                                    <td className="px-4 py-3 font-semibold">{customer.name}</td>
                                    <td className="tabular px-4 py-3">
                                        <a href={`tel:${customer.phone}`} className="hover:text-ink-soft hover:underline">
                                            {formatPhone(customer.phone)}
                                        </a>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <DigitDisplay value={String(customer.ordersCount)} chip={false} size="md" />
                                    </td>
                                    <td className="px-4 py-3 text-ink-soft">{customer.lastOrderAt ? formatDateTime(customer.lastOrderAt) : 'Tiada'}</td>
                                    <td className="px-4 py-3 text-ink-soft">{formatDateTime(customer.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                </div>
            )}

            <Pagination page={customers} />
        </AdminLayout>
    );
}
