'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { Wallet, ChevronLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

interface CreateRequestPayload {
    customer_id: string;
    requested_type: string;
    reason: string;
}

export default function RequestAccountPage() {
    const t = useTranslations('accounts');
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;

    const [accountType, setAccountType] = useState('savings');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const payload: CreateRequestPayload = {
                customer_id: user.id,
                requested_type: accountType,
                reason: reason
            };

            await apiRequest('/requests', {
                method: 'POST',
                body: JSON.stringify(payload)
            }, '8083');

            setSuccess(true);
            setTimeout(() => {
                router.push(`/${locale}/dashboard/accounts`);
            }, 2000);
        } catch (err: unknown) {
            console.error('Failed to submit request', err);
            setError((err as Error).message || 'Failed to submit request');
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href={`/${locale}/dashboard/accounts`} className={styles.backLink}>
                        <ChevronLeft size={20} />
                        Back to Accounts
                    </Link>
                    <h1 className={styles.title}>
                        <Wallet size={32} />
                        Open New Account
                    </h1>
                    <p className={styles.subtitle}>Submit a request to open a new bank account</p>
                </header>

                <div className={styles.card}>
                    {success ? (
                        <div className={styles.successMessage}>
                            <CheckCircle size={48} className={styles.successIcon} />
                            <h2>Request Submitted!</h2>
                            <p>Your relationship manager will review your request shortly.</p>
                            <p>Redirecting back to accounts...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {error && (
                                <div className={styles.errorBanner}>
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Account Type</label>
                                <select
                                    className={styles.select}
                                    value={accountType}
                                    onChange={(e) => setAccountType(e.target.value)}
                                >
                                    <option value="savings">Savings Account</option>
                                    <option value="checking">Checking Account</option>
                                    <option value="investment">Investment Account</option>
                                    <option value="loan">Loan Account</option>
                                </select>
                                <p className={styles.helperText}>Select the type of account you wish to open.</p>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Reason (Optional)</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Why do you want to open this account?"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={4}
                                />
                            </div>

                            <div className={styles.actions}>
                                <button
                                    type="submit"
                                    className={`btn btn-primary ${styles.submitBtn}`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Request'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
