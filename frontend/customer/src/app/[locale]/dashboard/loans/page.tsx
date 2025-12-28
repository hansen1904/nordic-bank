'use client';

import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Building2 } from 'lucide-react';
import styles from '../accounts/page.module.css';

export default function LoansPage() {
    const t = useTranslations('loans');

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>
                            <Building2 size={32} />
                            {t('title')}
                        </h1>
                        <p className={styles.subtitle}>View and manage your loans</p>
                    </div>
                </header>

                <div className={styles.content}>
                    <div className={styles.emptyState}>
                        <Building2 size={64} style={{ opacity: 0.3 }} />
                        <h3>{t('noLoans')}</h3>
                        <p>When you have active loans, they will appear here with payment schedules and details.</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
