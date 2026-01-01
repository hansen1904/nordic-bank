'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { FileText, Check, X, Loader2, RefreshCw } from 'lucide-react';
import styles from './AccountRequestsWidget.module.css';

interface AccountRequest {
    ID: string;
    CustomerID: string;
    RequestedType: string;
    Status: string;
    Reason: string;
    CreatedAt: string;
}

export default function AccountRequestsWidget() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<AccountRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await apiRequest<AccountRequest[]>(
                '/requests/?status=pending',
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } },
                '8083'
            );
            setRequests(data || []);
        } catch (error) {
            console.error('Failed to fetch requests', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [user]);

    const handleAction = async (id: string, status: 'approved' | 'rejected') => {
        if (!user) return;
        setProcessingId(id);

        try {
            await apiRequest(
                `/requests/${id}/status`,
                {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                    body: JSON.stringify({
                        status: status,
                        processed_by: user.id
                    })
                },
                '8083'
            );

            // Remove from list
            setRequests(prev => prev.filter(req => req.ID !== id));
        } catch (error) {
            console.error(`Failed to ${status} request`, error);
            alert(`Failed to ${status} request. Please try again.`);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className={styles.widget}>
            <header className={styles.header}>
                <div className={styles.titleWrapper}>
                    <FileText size={20} className={styles.icon} />
                    <h3 className={styles.title}>Account Requests</h3>
                    <span className={styles.badge}>{requests.length}</span>
                </div>
                <button onClick={fetchRequests} className={styles.refreshBtn} title="Refresh">
                    <RefreshCw size={16} />
                </button>
            </header>

            <div className={styles.content}>
                {isLoading ? (
                    <div className={styles.loading}>
                        <Loader2 size={32} className={styles.spinner} />
                    </div>
                ) : requests.length > 0 ? (
                    <div className={styles.list}>
                        {requests.map(req => (
                            <div key={req.ID} className={styles.item}>
                                <div className={styles.itemInfo}>
                                    <div className={styles.itemHeader}>
                                        <span className={styles.type}>{req.RequestedType} Account</span>
                                        <span className={styles.date}>
                                            {new Date(req.CreatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={styles.reason}>
                                        {req.Reason || 'No reason provided'}
                                    </p>
                                    <p className={styles.customer}>Customer ID: {req.CustomerID.substring(0, 8)}...</p>
                                </div>
                                <div className={styles.actions}>
                                    <button
                                        className={`${styles.actionBtn} ${styles.approve}`}
                                        onClick={() => handleAction(req.ID, 'approved')}
                                        disabled={!!processingId}
                                        title="Approve"
                                    >
                                        {processingId === req.ID ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    </button>
                                    <button
                                        className={`${styles.actionBtn} ${styles.deny}`}
                                        onClick={() => handleAction(req.ID, 'rejected')}
                                        disabled={!!processingId}
                                        title="Deny"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <p>No pending requests.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
