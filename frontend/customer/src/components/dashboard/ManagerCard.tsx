'use client';

import { Phone, Mail, MessageCircle } from 'lucide-react';
import styles from './ManagerCard.module.css';



export interface ManagerProfile {
    id: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    photo?: string;
    lastContact?: string;
    status?: 'available' | 'busy' | 'offline';
}

export interface ManagerCardProps {
    manager?: ManagerProfile | null;
}

export default function ManagerCard({ manager }: ManagerCardProps) {
    if (!manager) return null;

    const statusColors = {
        available: '#22c55e',
        busy: '#f59e0b',
        offline: '#6b7280'
    };

    return (
        <div className={styles.card}>
            <h4 className={styles.title}>Your Relationship Manager</h4>

            <div className={styles.managerInfo}>
                <div className={styles.avatar}>
                    <span className={styles.avatarText}>
                        {manager.name.split(' ').map(n => n[0]).join('')}
                    </span>
                    <div
                        className={styles.statusDot}
                        style={{ background: statusColors[manager.status || 'offline'] }}
                    />
                </div>

                <div className={styles.details}>
                    <h5 className={styles.name}>{manager.name}</h5>
                    <p className={styles.role}>{manager.title}</p>
                    {manager.lastContact && (
                        <p className={styles.lastContact}>
                            Last contact: {manager.lastContact}
                        </p>
                    )}
                </div>
            </div>

            <div className={styles.actions}>
                <button className={`${styles.actionBtn} ${styles.primary}`}>
                    <MessageCircle size={16} />
                    <span>Message</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.secondary}`}>
                    <Phone size={16} />
                </button>
                <button className={`${styles.actionBtn} ${styles.secondary}`}>
                    <Mail size={16} />
                </button>
            </div>
        </div>
    );
}
