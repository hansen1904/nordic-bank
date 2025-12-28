'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AccountCard from '@/components/dashboard/AccountCard';
import { apiRequest } from '@/lib/api';
import { Wallet, Plus, Loader2 } from 'lucide-react';
import styles from './page.module.css';

interface Account {
    ID: string;
    AccountNumber: string;
    AccountName: string;
    Balance: number;
    Currency: string;
    Status: string;
}

export default function AccountsPage() {
    const t = useTranslations('accounts');
    const { user } = useAuth();
    const params = useParams();
    const locale = params.locale as string;

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAccounts = async () => {
            if (!user) return;

            try {
                setError(null);
                const response = await apiRequest<Account[]>(
                    `/accounts/?customer_id=${user.id}`,
                    { method: 'GET' },
                    '8083'
                );
                setAccounts(response || []);
            } catch (err: unknown) {
                console.error('Failed to fetch accounts', err);
                setError('Failed to load accounts');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccounts();
    }, [user]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.loading}>
                        <Loader2 size={48} className={styles.spinner} />
                        <p>Loading accounts...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>
                            <Wallet size={32} />
                            {t('title')}
                        </h1>
                        <p className={styles.subtitle}>Manage your accounts and view transaction history</p>
                    </div>
                    <button className={`btn btn-primary ${styles.addBtn}`}>
                        <Plus size={20} />
                        Open New Account
                    </button>
                </header>

                {error && (
                    <div className={styles.error}>
                        ⚠️ {error}
                    </div>
                )}

                {accounts.length > 0 ? (
                    <div className={styles.grid}>
                        {accounts.map((account) => (
                            <AccountCard
                                key={account.ID}
                                id={account.ID}
                                accountNumber={account.AccountNumber}
                                accountName={account.AccountName}
                                balance={account.Balance}
                                currency={account.Currency}
                                locale={locale}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <Wallet size={64} style={{ opacity: 0.3 }} />
                        <h3>{t('noAccounts')}</h3>
                        <p>Open your first account to start banking with us.</p>
                        <button className={`btn btn-primary ${styles.emptyBtn}`}>
                            <Plus size={20} />
                            Open New Account
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
