import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { mockCustomers, mockAccounts, mockTransactions } from '@/lib/mock-data';
import { formatCurrency, formatPhoneNumber } from '@/lib/utils';

export default async function CustomerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const t = await getTranslations('customers');
    const tTx = await getTranslations('transactions');

    const customer = mockCustomers.find((c) => c.id === id);

    if (!customer) {
        notFound();
    }

    const customerAccounts = mockAccounts.filter((a) => a.customerId === id);
    const recentTransactions = mockTransactions.slice(0, 5);

    return (
        <div>
            <h1 className="heading-2 mb-6">{customer.name}</h1>

            {/* Customer Info */}
            <div className="grid grid-2 mb-6">
                <DashboardCard title={t('details')}>
                    <div className="grid" style={{ gap: 'var(--spacing-3)' }}>
                        <div>
                            <div className="text-sm text-muted">{t('email')}</div>
                            <div className="font-medium">{customer.email}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted">{t('phone')}</div>
                            <div className="font-medium">{formatPhoneNumber(customer.phone)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted">{t('accountNumber')}</div>
                            <div className="font-medium">{customer.accountNumber}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted">{t('status')}</div>
                            <span className={`badge ${customer.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                {customer.status === 'active' ? t('active') : t('inactive')}
                            </span>
                        </div>
                    </div>
                </DashboardCard>

                <DashboardCard title={t('balance')}>
                    <div className="metric-value">{formatCurrency(customer.balance)}</div>
                    <div className="metric-label">Total balance across all accounts</div>
                </DashboardCard>
            </div>

            {/* Accounts */}
            <div className="mb-6">
                <DashboardCard title="Accounts">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Account Number</th>
                                    <th>Type</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customerAccounts.map((account) => (
                                    <tr key={account.id}>
                                        <td className="font-medium">{account.accountNumber}</td>
                                        <td className="text-sm">{account.type}</td>
                                        <td className="font-semibold">{formatCurrency(account.balance)}</td>
                                        <td>
                                            <span className="badge badge-success">{account.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DashboardCard>
            </div>

            {/* Recent Transactions */}
            <DashboardCard title={tTx('title')}>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{tTx('date')}</th>
                                <th>{tTx('type')}</th>
                                <th>{tTx('description')}</th>
                                <th>{tTx('amount')}</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTransactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td className="text-sm">{tx.date.toLocaleDateString()}</td>
                                    <td className="text-sm capitalize">{tx.type}</td>
                                    <td className="text-sm">{tx.description}</td>
                                    <td className="font-semibold">{formatCurrency(tx.amount)}</td>
                                    <td>
                                        <span className="badge badge-success">{tx.status}</span>
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
