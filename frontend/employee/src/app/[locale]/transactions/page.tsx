import { useTranslations } from 'next-intl';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { mockTransactions } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';

export default function TransactionsPage() {
    const t = useTranslations('transactions');

    return (
        <div>
            <h1 className="heading-2 mb-6">{t('title')}</h1>

            <DashboardCard>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('date')}</th>
                                <th>{t('type')}</th>
                                <th>{t('description')}</th>
                                <th>{t('amount')}</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockTransactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td className="text-sm">{tx.date.toLocaleDateString('da-DK')}</td>
                                    <td className="text-sm">
                                        <span className="badge badge-info capitalize">{tx.type}</span>
                                    </td>
                                    <td className="text-sm">{tx.description}</td>
                                    <td className="font-semibold">
                                        <span className={tx.type === 'deposit' ? 'text-success' : ''}>
                                            {tx.type === 'deposit' ? '+' : '-'}
                                            {formatCurrency(tx.amount)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${tx.status === 'completed' ? 'badge-success' : tx.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                                            {tx.status}
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
