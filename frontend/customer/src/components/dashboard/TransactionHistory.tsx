'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, ArrowDownLeft, Clock, Search, Filter } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import styles from './TransactionHistory.module.css';

interface Transaction {
    id: string;
    source_account_id: string;
    destination_account_id: string;
    amount: {
        amount: number;
        currency: string;
    };
    type: string;
    status: string;
    reference: string;
    description: string;
    created_at: string;
}

interface Props {
    accountId: string;
}

export default function TransactionHistory({ accountId }: Props) {
    const t = useTranslations('dashboard.transactions');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            setIsLoading(true);
            try {
                // Adjusting to match the backend port for transaction service (8084)
                // For now, I'll use the relative path if I had a proxy, but let's assume direct for now
                // Actually, our apiRequest uses NEXT_PUBLIC_API_URL which points to 8081 (Auth).
                // I need to be able to hit 8084 as well.
                // I'll update apiRequest to accept a full URL or add a new base for transactions.

                // For simplicity, let's assume the transaction history is fetched via a common API gateway 
                // or I'll just hardcode/env var it.

                const response = await apiRequest<{ transactions: Transaction[] }>(
                    `/transactions/account/${accountId}`,
                    { method: 'GET' },
                    '8084'
                );
                setTransactions(response.transactions || []);
            } catch (err: unknown) {
                setError((err as Error).message);
            } finally {
                setIsLoading(false);
            }
        };

        if (accountId) {
            fetchTransactions();
        }
    }, [accountId]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency,
        }).format(amount / 100); // Assuming øre/cents
    };

    if (isLoading) return <div className={styles.loading}>Loading transactions...</div>;
    if (error) return <div className={styles.error}>Error: {error}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>{t('title')}</h2>
                <div className={styles.actions}>
                    <button className={styles.iconButton}><Search size={18} /></button>
                    <button className={styles.iconButton}><Filter size={18} /></button>
                </div>
            </div>

            <div className={styles.list}>
                {transactions.length === 0 ? (
                    <div className={styles.empty}>No transactions found</div>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.id} className={styles.item}>
                            <div className={`${styles.icon} ${tx.source_account_id === accountId ? styles.outflow : styles.inflow}`}>
                                {tx.source_account_id === accountId ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                            </div>
                            <div className={styles.details}>
                                <div className={styles.mainInfo}>
                                    <span className={styles.description}>{tx.description || tx.type}</span>
                                    <span className={`${styles.amount} ${tx.source_account_id === accountId ? styles.negative : styles.positive}`}>
                                        {tx.source_account_id === accountId ? '-' : '+'}
                                        {formatAmount(tx.amount.amount, tx.amount.currency)}
                                    </span>
                                </div>
                                <div className={styles.subInfo}>
                                    <span className={styles.date}>
                                        <Clock size={14} style={{ marginRight: '4px' }} />
                                        {formatDate(tx.created_at)}
                                    </span>
                                    <span className={styles.status}>{tx.status}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
