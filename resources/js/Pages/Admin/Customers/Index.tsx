import { MagnifyingGlassIcon, UsersThreeIcon } from '@phosphor-icons/react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Pagination } from '@/components/Pagination';
import { useFilters } from '@/components/admin/useFilters';
import { DigitDisplay } from '@/components/DigitDisplay';
import { inputClass } from '@/components/ui/Field';
import { cn, formatDateTime, formatPhone } from '@/lib/format';
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
            <label className="relative block max-w-md">
                <span className="sr-only">Cari nama atau telefon</span>
                <MagnifyingGlassIcon size={20} weight="bold" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" aria-hidden />
                <input type="search" value={filters.q} onChange={(event) => set('q', event.target.value)} placeholder="Cari nama atau telefon" className={cn(inputClass, 'pl-10')} />
            </label>

            {customers.data.length === 0 ? (
                <div className="mt-8 flex items-center gap-4 rounded-(--radius-panel) border-2 border-dashed border-rule-strong p-8">
                    <UsersThreeIcon size={36} weight="bold" className="shrink-0 text-rule-strong" aria-hidden />
                    <div>
                        <p className="text-lg font-semibold">{filters.q ? 'Tiada pelanggan sepadan' : 'Belum ada pelanggan'}</p>
                        <p className="text-[15px] text-ink-muted">
                            {filters.q ? 'Semak ejaan nama atau cuba beberapa digit nombor telefon.' : 'Pelanggan direkod secara automatik apabila mereka membuat pesanan pertama.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="mt-6 overflow-x-auto border-y border-rule bg-panel">
                    <table className="w-full min-w-[640px] text-left text-[15px]">
                        <thead>
                            <tr className="border-b-2 border-rule-strong text-sm text-ink-muted">
                                <th scope="col" className="px-4 py-3 font-semibold">Nama</th>
                                <th scope="col" className="px-4 py-3 font-semibold">Telefon</th>
                                <th scope="col" className="px-4 py-3 text-right font-semibold">Pesanan</th>
                                <th scope="col" className="px-4 py-3 font-semibold">Pesanan terakhir</th>
                                <th scope="col" className="px-4 py-3 font-semibold">Pelanggan sejak</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-rule">
                            {customers.data.map((customer) => (
                                <tr key={customer.id} className="transition-colors duration-150 hover:bg-ground">
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
            )}

            <Pagination page={customers} />
        </AdminLayout>
    );
}
