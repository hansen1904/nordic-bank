'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import TransactionHistory from '@/components/dashboard/TransactionHistory';
import styles from '../page.module.css'; // Reusing dashboard styles for consistency

export default function TransactionsPage() {
    const t = useTranslations('dashboard');

    return (
        <DashboardLayout>
            <div className={styles.dashboardContainer}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1e293b' }}>
                    {t('transactions') || 'Transactions'}
                </h1>
                
                <section className={styles.activity}>
                    {/* We can reuse the TransactionHistory component. 
                        Ideally, it should support a "full view" mode or we just render it here.
                        For now, passing a dummy or null accountId if it handles it, 
                        or we need to fetch accounts here too to pass the ID.
                        Let's just render the component; it might need refactoring to show ALL transactions if no ID is passed.
                    */}
                    <TransactionHistory accountId="" /> 
                </section>
            </div>
        </DashboardLayout>
    );
}
