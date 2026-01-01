'use client';

import React, { useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import TransactionHistory from '@/components/dashboard/TransactionHistory';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import HeroBanner from '@/components/dashboard/HeroBanner';
import { Wallet, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

interface Account {
    ID: string;
    AccountNumber: string;
    AccountName: string;
    Balance: number;
    Currency: string;
    IsFavorite: boolean;
}

export default function DashboardPage() {

    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/'); // Redirect if not logged in
            return;
        }

        const fetchAccounts = async () => {
            if (!user) return;
            try {
                setError(null);
                const response = await apiRequest<Account[]>(
                    `/accounts?customer_id=${user.id}`,
                    { method: 'GET' },
                    '8083'
                );
                // Backend might return null IsFavorite if false/empty, ensure boolean
                const sanitizedAccounts = (response || []).map(acc => ({
                    ...acc,
                    IsFavorite: !!acc.IsFavorite
                }));
                setAccounts(sanitizedAccounts);
            } catch (err: unknown) {
                console.error('Failed to fetch accounts', err);
                const errorMsg = (err as Error).message || 'Unable to load accounts';
                if (errorMsg.includes('Failed to fetch')) {
                    setError('Unable to connect to account service. Please ensure the backend is running.');
                } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
                    setError('Session expired. Please log in again.');
                } else {
                    setError('Failed to load accounts. Please refresh the page.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchAccounts();
        }
    }, [user, authLoading, router]);



    if (authLoading || isLoading) return <div className={styles.loading}>Loading dashboard...</div>;

    const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency,
        }).format(amount / 100);
    };

    // Filter accounts: show favorites if any, otherwise showing first 4
    const favoriteAccounts = accounts.filter(acc => acc.IsFavorite);
    const displayedAccounts = favoriteAccounts.length > 0
        ? favoriteAccounts.slice(0, 4)
        : accounts.slice(0, 4);

    return (
        <DashboardLayout>
            <div className={styles.dashboardContainer}>
                {/* Hero Banner */}
                <HeroBanner
                    title="Welcome Back to Nordic Bank"
                    subtitle="Your trusted financial partner for all your banking needs"
                    ctaText="Explore New Features"
                    ctaAction={() => console.log('CTA clicked')}
                />

                {error && (
                    <div style={{
                        padding: '16px',
                        marginBottom: '24px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fca5a5',
                        borderRadius: '12px',
                        color: '#991b1b'
                    }}>
                        <strong>⚠️ Error:</strong> {error}
                    </div>
                )}

                <section className={styles.overview}>
                    <div className={styles.accountsGrid}>
                        {displayedAccounts.map(acc => (
                            <div
                                key={acc.ID}
                                className={styles.accountCard}
                                onClick={() => router.push(`/dashboard/accounts/${acc.ID}`)}
                                role="button"
                                tabIndex={0}
                            >


                                <div className={styles.accountHeader}>
                                    <Wallet size={24} className={styles.accountIcon} />
                                    <span className={styles.accountType}>{acc.AccountName}</span>
                                </div>
                                <div className={styles.accountBalance}>
                                    {formatAmount(acc.Balance, acc.Currency)}
                                </div>
                                <div className={styles.accountFooter}>
                                    <span className={styles.accountNumber}>{acc.AccountNumber}</span>
                                    <ArrowRight size={18} />
                                </div>
                            </div>
                        ))}
                        {accounts.length === 0 && (
                            <div className={styles.noAccounts}>
                                No accounts found. Open your first account today!
                            </div>
                        )}
                    </div>
                </section>

                <section className={styles.activity}>
                    {accounts.length > 0 ? (
                        <TransactionHistory accountId={accounts[0].ID} />
                    ) : (
                        <div className={styles.noActivity}>
                            Please open an account to see transaction history.
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
