import React from 'react';
import Link from 'next/link';
import { Wallet, ArrowRight, Star } from 'lucide-react';
import styles from './AccountCard.module.css';

interface AccountCardProps {
    id: string;
    accountNumber: string;
    accountName: string;
    balance: number;
    currency: string;
    locale: string;
    isFavorite?: boolean;
    onToggleFavorite?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export default function AccountCard({
    id,
    accountNumber,
    accountName,
    balance,
    currency,
    locale,
    isFavorite,
    onToggleFavorite
}: AccountCardProps) {
    const formatAmount = (amount: number, curr: string) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: curr,
        }).format(amount / 100);
    };

    return (
        <Link href={`/${locale}/dashboard/accounts/${id}`} className={styles.card}>
            {onToggleFavorite && (
                <div
                    className={styles.starButton}
                    onClick={onToggleFavorite}
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    <Star
                        size={20}
                        fill={isFavorite ? "#fbbf24" : "none"}
                        color={isFavorite ? "#fbbf24" : "#94a3b8"}
                    />
                </div>
            )}

            <div className={styles.header}>
                <div className={styles.icon}>
                    <Wallet size={24} />
                </div>
                <span className={styles.type}>{accountName}</span>
            </div>

            <div className={styles.balance}>
                {formatAmount(balance, currency)}
            </div>

            <div className={styles.footer}>
                <span className={styles.accountNumber}>{accountNumber}</span>
                <div className={styles.viewDetails}>
                    View Details
                    <ArrowRight size={16} />
                </div>
            </div>

            {/* Visual accent */}
            <div className={styles.accent} />
        </Link>
    );
}
