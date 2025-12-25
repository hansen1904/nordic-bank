import { useTranslations } from 'next-intl';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { mockAccounts } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';

export default function AccountsPage() {
    const t = useTranslations('accounts');

    return (
        <div>
            <h1 className="heading-2 mb-6">{t('title')}</h1>

            <DashboardCard>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Account Number</th>
                                <th>{t('accountType')}</th>
                                <th>{t('balance')}</th>
                                <th>Currency</th>
                                <th>{t('status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockAccounts.map((account) => (
                                <tr key={account.id}>
                                    <td className="font-medium">{account.accountNumber}</td>
                                    <td className="text-sm capitalize">
                                        {account.type === 'checking' ? t('checking') : t('savings')}
                                    </td>
                                    <td className="font-semibold">{formatCurrency(account.balance)}</td>
                                    <td className="text-sm">{account.currency}</td>
                                    <td>
                                        <span className={`badge ${account.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                            {account.status}
                                        </span>
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
