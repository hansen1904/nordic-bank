'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, CreditCard, Calendar, Bell, Phone, MapPin, User } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import StatisticsCard from './StatisticsCard';
import ManagerCard, { ManagerProfile } from './ManagerCard';
import styles from './RightSidebar.module.css';

interface RightSidebarProps {
    user: {
        id: string;
        username: string;
        email: string;
    } | null;
}

export default function RightSidebar({ user }: RightSidebarProps) {
    const [stats, setStats] = useState({
        accountCount: 0,
        transactionCount: 0,
        isLoading: true
    });

    const [manager, setManager] = useState<ManagerProfile | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // 1. Fetch Customer Profile to get Relationship Manager ID
                // User ID from auth context is the Auth User ID. We need to find the Customer profile for this User ID.
                // NOTE: '8082' is customer-service port. Correct endpoint for lookup by UserID is /me
                const customerProfile = await apiRequest<any>(
                    `/customers/me?user_id=${user.id}`,
                    { method: 'GET' },
                    '8082'
                ).catch((err) => {
                    console.error("Failed to fetch customer profile", err);
                    return null;
                });

                // 2. Fetch Manager Details if we have a valid ID
                // Skip if the ID is null, empty, or the all-zeros placeholder UUID
                const isValidManagerID = customerProfile?.RelationshipManagerID &&
                    customerProfile.RelationshipManagerID !== '00000000-0000-0000-0000-000000000000' &&
                    customerProfile.RelationshipManagerID !== '00000000-0000-0000-0000-000000000001';

                if (isValidManagerID) {
                    try {
                        const managerUser = await apiRequest<any>(
                            `/users/${customerProfile.RelationshipManagerID}`,
                            { method: 'GET' },
                            '8081'
                        );

                        // Map role to proper title
                        const roleToTitle: Record<string, string> = {
                            'employee': 'Relationship Manager',
                            'admin': 'Senior Relationship Manager',
                            'customer': 'Customer'
                        };

                        setManager({
                            id: managerUser.id,
                            name: managerUser.username || 'Bank Employee',
                            title: roleToTitle[managerUser.role] || 'Relationship Manager',
                            email: managerUser.email,
                            phone: '+45 70 12 34 56', // Placeholder - not in User model yet
                            status: managerUser.status === 'active' ? 'available' : 'offline',
                            lastContact: 'Available'
                        });
                    } catch (e) {
                        console.error('Failed to fetch manager details:', e);
                        // Fallback if we can't fetch specific manager details
                        setManager({
                            id: customerProfile.RelationshipManagerID,
                            name: 'Assigned Manager',
                            title: 'Relationship Manager',
                            email: 'support@nordicbank.com',
                            phone: '+45 70 12 34 56',
                            status: 'available'
                        });
                    }
                }

                // 3. Fetch Accounts
                // NOTE: '8083' is account-service port
                const accounts = await apiRequest<any[]>(
                    `/accounts?customer_id=${user.id}`,
                    { method: 'GET' },
                    '8083'
                );

                const accountCount = accounts ? accounts.length : 0;
                let transactionCount = 0;

                // 4. Fetch transactions for each account
                if (accounts && accounts.length > 0) {
                    // NOTE: '8084' is transaction-service port
                    const txPromises = accounts.map(acc =>
                        apiRequest<any>(
                            `/transactions/account/${acc.ID}?page=1&limit=1`,
                            { method: 'GET' },
                            '8084'
                        )
                    );

                    const txResults = await Promise.all(txPromises);
                    txResults.forEach(res => {
                        if (res && res.total) {
                            transactionCount += res.total;
                        }
                    });
                }

                setStats({
                    accountCount,
                    transactionCount,
                    isLoading: false
                });

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                setStats(prev => ({ ...prev, isLoading: false }));
            }
        };

        fetchData();
    }, [user]);

    if (!user) return null;

    // Mock data - will be replaced with real API calls
    const greeting = getGreeting();
    const balanceData = [20, 35, 30, 45, 40, 55, 60]; // Last 7 days mock data

    return (
        <aside className={styles.sidebar}>
            {/* Profile Summary */}
            <div className={styles.profileSection}>
                <div className={styles.avatar}>
                    <span className={styles.avatarText}>
                        {user.username.substring(0, 2).toUpperCase()}
                    </span>
                    <div className={styles.statusDot}></div>
                </div>
                <h3 className={styles.greeting}>
                    {greeting}, {manager?.name === 'Assigned Manager' || !manager ? (user.username) : ((manager as any)?._customerFirstName || user.username)}! 👋
                </h3>
                <p className={styles.tagline}>
                    Welcome back to Nordic Bank
                </p>
            </div>

            {/* Statistics Card */}
            <StatisticsCard
                title="Balance Trend"
                data={balanceData}
                metric="+12.5%"
                metricLabel="vs last week"
            />

            {/* Quick Stats Grid */}
            <div className={styles.quickStatsGrid}>
                <div className={styles.quickStatCard}>
                    <CreditCard size={18} className={styles.quickStatIcon} />
                    <div className={styles.quickStatValue}>
                        {stats.isLoading ? '-' : stats.accountCount}
                    </div>
                    <div className={styles.quickStatLabel}>Active Accounts</div>
                </div>
                <div className={styles.quickStatCard}>
                    <TrendingUp size={18} className={styles.quickStatIcon} />
                    <div className={styles.quickStatValue}>
                        {stats.isLoading ? '-' : stats.transactionCount}
                    </div>
                    <div className={styles.quickStatLabel}>Transactions</div>
                </div>
            </div>

            {/* Upcoming Payments */}
            <div className={styles.upcomingSection}>
                <h4 className={styles.sectionTitle}>
                    <Calendar size={16} />
                    <span>Upcoming</span>
                </h4>
                <div className={styles.upcomingItem}>
                    <div className={styles.upcomingInfo}>
                        <span className={styles.upcomingName}>Rent Payment</span>
                        <span className={styles.upcomingDate}>Jan 1, 2025</span>
                    </div>
                    <span className={styles.upcomingAmount}>-8,500 kr</span>
                </div>
                <div className={styles.upcomingItem}>
                    <div className={styles.upcomingInfo}>
                        <span className={styles.upcomingName}>Salary</span>
                        <span className={styles.upcomingDate}>Jan 25, 2025</span>
                    </div>
                    <span className={styles.upcomingAmountPositive}>+32,000 kr</span>
                </div>
            </div>

            {/* Relationship Manager Card */}
            <ManagerCard manager={manager} />

            {/* Notifications */}
            <div className={styles.notificationsSection}>
                <h4 className={styles.sectionTitle}>
                    <Bell size={16} />
                    <span>Notifications</span>
                </h4>
                <div className={styles.notificationItem}>
                    <div className={styles.notificationDot}></div>
                    <p>Your card ending in 4582 was used for a purchase of 299 kr</p>
                </div>
            </div>

            {/* Contact Info - Bottom */}
            <div className={styles.contactSection}>
                <h4 className={styles.sectionTitle}>Contact Us</h4>
                <div className={styles.contactItem}>
                    <Phone size={14} />
                    <span>+45 70 12 34 56</span>
                </div>
                <div className={styles.contactItem}>
                    <MapPin size={14} />
                    <span>Vestergade 42, 1456 Copenhagen K</span>
                </div>
            </div>
        </aside>
    );
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
}
