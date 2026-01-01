'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ArrowRightLeft } from 'lucide-react';
import styles from '../page.module.css';

export default function TransferPage() {
    return (
        <DashboardLayout>
            <div className={styles.dashboardContainer}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1e293b' }}>
                    Money Transfer
                </h1>

                <div style={{
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <ArrowRightLeft size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                    <h2 style={{ fontSize: '18px', marginBottom: '8px', color: '#475569' }}>Transfer Feature Coming Soon</h2>
                    <p style={{ color: '#94a3b8' }}>We are currently building a secure transfer experience for you.</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
