import { useTranslations } from 'next-intl';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
    const t = useTranslations('nav');

    return (
        <div>
            <h1 className="heading-2 mb-6">{t('reports')}</h1>

            <DashboardCard>
                <div style={{ textAlign: 'center', padding: 'var(--spacing-16) 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-6)' }}>
                        <div className="activity-icon" style={{ width: '80px', height: '80px' }}>
                            <BarChart3 size={40} />
                        </div>
                    </div>
                    <h3 className="card-title">Reports & Analytics</h3>
                    <p className="text-muted mt-2" style={{ maxWidth: '500px', margin: '0 auto' }}>
                        Generate detailed reports on customer activity, transactions, and account performance.
                    </p>
                    <div className="grid grid-2 mt-6" style={{ maxWidth: '400px', margin: '0 auto' }}>
                        <button className="btn btn-primary">Customer Report</button>
                        <button className="btn btn-secondary">Transaction Report</button>
                        <button className="btn btn-secondary">Account Report</button>
                        <button className="btn btn-secondary">Activity Report</button>
                    </div>
                </div>
            </DashboardCard>
        </div>
    );
}
