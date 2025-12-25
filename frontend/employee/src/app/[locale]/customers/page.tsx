import { getTranslations } from 'next-intl/server';
import DashboardCard from '@/components/dashboard/DashboardCard';
import CustomerSearchBar from '@/components/customer/CustomerSearchBar';
import { mockCustomers } from '@/lib/mock-data';
import { formatCurrency, formatPhoneNumber } from '@/lib/utils';
import { Link } from '@/i18n/routing';

export default async function CustomersPage() {
    const t = await getTranslations('customers');

    return (
        <div>
            <h1 className="heading-2 mb-6">{t('title')}</h1>

            {/* Search Bar */}
            <div className="mb-6">
                <DashboardCard>
                    <CustomerSearchBar />
                </DashboardCard>
            </div>

            {/* Customer List */}
            <DashboardCard title={t('search')}>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>{t('accountNumber')}</th>
                                <th>{t('phone')}</th>
                                <th>{t('balance')}</th>
                                <th>{t('status')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockCustomers.map((customer) => (
                                <tr key={customer.id}>
                                    <td className="font-medium">{customer.name}</td>
                                    <td className="text-muted text-sm">{customer.accountNumber}</td>
                                    <td className="text-sm">{formatPhoneNumber(customer.phone)}</td>
                                    <td className="font-semibold">{formatCurrency(customer.balance)}</td>
                                    <td>
                                        <span className={`badge ${customer.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                            {customer.status === 'active' ? t('active') : t('inactive')}
                                        </span>
                                    </td>
                                    <td>
                                        <Link href={`/customers/${customer.id}`} className="btn btn-secondary" style={{ padding: 'var(--spacing-2) var(--spacing-4)', fontSize: 'var(--font-size-sm)' }}>
                                            {t('viewDetails')}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DashboardCard>
        </div>
    );
}
