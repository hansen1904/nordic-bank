'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { Wallet, ArrowLeft, Download, Send, Loader2 } from 'lucide-react';
import styles from './page.module.css';

interface Account {
    ID: string;
    AccountNumber: string;
    AccountName: string;
    Balance: number;
    Currency: string;
    Status: string;
}

interface Transaction {
    ID: string;
    Amount: number;
    Type: string;
    Description: string;
    CreatedAt: string;
}

export default function AccountDetailPage() {

    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const accountId = params.id as string;

    const [account, setAccount] = useState<Account | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAccountData = async () => {
            if (!user) return;

            try {
                setError(null);

                // Fetch account details
                const accountData = await apiRequest<Account>(
                    `/accounts/${accountId}`,
                    { method: 'GET' },
                    '8083'
                );
                setAccount(accountData);

                // Fetch transactions
                const txData = await apiRequest<Transaction[]>(
                    `/transactions?account_id=${accountId}`,
                    { method: 'GET' },
                    '8084'
                );
                setTransactions(txData || []);
            } catch (err: unknown) {
                console.error('Failed to fetch account data', err);
                setError('Failed to load account details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccountData();
    }, [user, accountId]);

    const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency,
        }).format(amount / 100);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className={styles.loading}>
                    <Loader2 size={48} className={styles.spinner} />
                    <p>Loading account details...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !account) {
        return (
            <DashboardLayout>
                <div className={styles.error}>
                    <p>{error || 'Account not found'}</p>
                    <button onClick={() => router.back()} className="btn btn-primary">
                        Go Back
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className={styles.container}>
                {/* Back button */}
                <button className={styles.backBtn} onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                    Back to Accounts
                </button>

                {/* Account Header */}
                <div className={styles.accountHeader}>
                    <div className={styles.accountInfo}>
                        <div className={styles.icon}>
                            <Wallet size={32} />
                        </div>
                        <div>
                            <h1 className={styles.accountName}>{account.AccountName}</h1>
                            <p className={styles.accountNumber}>{account.AccountNumber}</p>
                        </div>
                    </div>

                    <div className={styles.balanceCard}>
                        <p className={styles.balanceLabel}>Current Balance</p>
                        <h2 className={styles.balance}>
                            {formatAmount(account.Balance, account.Currency)}
                        </h2>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className={styles.actions}>
                    <button className={`btn btn-primary ${styles.actionBtn}`}>
                        <Send size={20} />
                        Transfer
                    </button>
                    <button className={`btn btn-secondary ${styles.actionBtn}`}>
                        <Download size={20} />
                        Export
                    </button>
                </div>

                {/* Transactions */}
                <div className={styles.transactionsSection}>
                    <h3 className={styles.sectionTitle}>Recent Transactions</h3>

                    {transactions.length > 0 ? (
                        <div className={styles.transactionsList}>
                            {transactions.map((tx) => (
                                <div key={tx.ID} className={styles.transaction}>
                                    <div className={styles.txInfo}>
                                        <p className={styles.txDescription}>{tx.Description}</p>
                                        <p className={styles.txDate}>{formatDate(tx.CreatedAt)}</p>
                                    </div>
                                    <div className={`${styles.txAmount} ${tx.Type === 'credit' ? styles.positive : styles.negative
                                        }`}>
                                        {tx.Type === 'credit' ? '+' : '-'}
                                        {formatAmount(Math.abs(tx.Amount), account.Currency)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noTransactions}>
                            <p>No transactions yet</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
