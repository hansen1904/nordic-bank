import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/dashboard/MetricCard';
import DashboardCard from '@/components/dashboard/DashboardCard';
import CustomerSearchBar from '@/components/customer/CustomerSearchBar';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { mockDashboardMetrics, mockActivities, mockTopCustomers } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function DashboardPage() {
    const t = useTranslations();

    return (
        <>
            <Header employeeName="Michael" />

            {/* Metrics Grid */}
            <div className="grid grid-4 mb-6">
                <MetricCard
                    value={mockDashboardMetrics.customersServedToday}
                    label={t('dashboard.metrics.customersServed')}
                />
                <MetricCard
                    value={mockDashboardMetrics.pendingTasks}
                    label={t('dashboard.metrics.pendingTasks')}
                />
                <MetricCard
                    value={mockDashboardMetrics.activeAccounts}
                    label={t('dashboard.metrics.activeAccounts')}
                />
                <MetricCard
                    value={mockDashboardMetrics.totalTransactions}
                    label={t('dashboard.metrics.recentActivity')}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-2 mb-6">
                {/* Customer Search */}
                <DashboardCard title={t('dashboard.customerSearch.title')}>
                    <CustomerSearchBar />
                    <div className="mt-4 text-sm text-muted">
                        {t('dashboard.customerSearch.placeholder')}
                    </div>
                </DashboardCard>

                {/* Quick Actions */}
                <DashboardCard title={t('dashboard.quickActions.title')}>
                    <div className="grid grid-1" style={{ gap: 'var(--spacing-3)' }}>
                        <Link href="/customers/onboard" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
                            {t('dashboard.quickActions.newCustomer')}
                        </Link>
                        <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                            {t('dashboard.quickActions.newAccount')}
                        </button>
                        <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                            {t('dashboard.quickActions.viewReports')}
                        </button>
                    </div>
                </DashboardCard>
            </div>

            {/* Activity Feed and Top Customers */}
            <div className="grid grid-2">
                {/* Activity Feed */}
                <DashboardCard title={t('dashboard.activityFeed.title')}>
                    <ActivityFeed activities={mockActivities} />
                </DashboardCard>

                {/* Top Customers */}
                <DashboardCard
                    title={t('dashboard.topCustomers.title')}
                >
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('customers.name') || 'Name'}</th>
                                    <th>{t('customers.balance')}</th>
                                    <th>{t('transactions.title')}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockTopCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td className="font-medium">{customer.name}</td>
                                        <td>{formatCurrency(customer.balance)}</td>
                                        <td>{customer.transactionCount}</td>
                                        <td>
                                            <Link
                                                href={`/customers/${customer.id}`}
                                                className="btn btn-secondary"
                                                style={{ padding: 'var(--spacing-2) var(--spacing-3)', fontSize: 'var(--font-size-xs)' }}
                                            >
                                                <ArrowRight size={14} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 text-center">
                        <Link href="/customers" className="text-accent text-sm font-medium">
                            {t('dashboard.topCustomers.viewAll')} →
                        </Link>
                    </div>
                </DashboardCard>
            </div>
        </>
    );
}
