import { useTranslations } from 'next-intl';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { BookOpen, HelpCircle, FileText } from 'lucide-react';

export default function SupportPage() {
    const t = useTranslations('support');

    return (
        <div>
            <h1 className="heading-2 mb-6">{t('title')}</h1>

            <div className="grid grid-3">
                <DashboardCard>
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-8) 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-4)' }}>
                            <div className="activity-icon" style={{ width: '64px', height: '64px' }}>
                                <HelpCircle size={32} />
                            </div>
                        </div>
                        <h3 className="card-title">{t('customerIssues')}</h3>
                        <p className="text-muted text-sm mt-2">Track and resolve customer issues</p>
                        <button className="btn btn-primary mt-4">View Issues</button>
                    </div>
                </DashboardCard>

                <DashboardCard>
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-8) 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-4)' }}>
                            <div className="activity-icon" style={{ width: '64px', height: '64px' }}>
                                <BookOpen size={32} />
                            </div>
                        </div>
                        <h3 className="card-title">{t('guides')}</h3>
                        <p className="text-muted text-sm mt-2">Step-by-step procedure guides</p>
                        <button className="btn btn-primary mt-4">Browse Guides</button>
                    </div>
                </DashboardCard>

                <DashboardCard>
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-8) 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-4)' }}>
                            <div className="activity-icon" style={{ width: '64px', height: '64px' }}>
                                <FileText size={32} />
                            </div>
                        </div>
                        <h3 className="card-title">{t('knowledgeBase')}</h3>
                        <p className="text-muted text-sm mt-2">Search our knowledge base</p>
                        <button className="btn btn-primary mt-4">Search</button>
                    </div>
                </DashboardCard>
            </div>
        </div>
    );
}
