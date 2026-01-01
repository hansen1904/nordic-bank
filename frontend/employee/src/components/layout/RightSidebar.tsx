'use client';

import { TrendingUp, Users, Clock, CheckCircle, Phone, MapPin } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import styles from './RightSidebar.module.css';

export default function RightSidebar() {
    const { user } = useAuth();

    if (!user) return null;

    const greeting = getGreeting();

    // Mock performance data - will be replaced with real API calls
    const performanceStats = {
        customersServed: 12,
        tasksCompleted: 8,
        avgResponseTime: '4.2 min',
        satisfaction: 98
    };

    // Mock assigned customers - will be replaced with real API
    const recentCustomers = [
        { id: '1', name: 'Anders Nielsen', lastContact: '10 min ago' },
        { id: '2', name: 'Maria Hansen', lastContact: '1 hour ago' },
        { id: '3', name: 'Lars Pedersen', lastContact: '2 hours ago' },
    ];

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
                    {greeting}, {user.username}! 👋
                </h3>
                <p className={styles.tagline}>
                    Employee Dashboard
                </p>
            </div>

            {/* Performance Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <Users size={18} className={styles.statIcon} />
                    <div className={styles.statValue}>{performanceStats.customersServed}</div>
                    <div className={styles.statLabel}>Customers Today</div>
                </div>
                <div className={styles.statCard}>
                    <CheckCircle size={18} className={styles.statIcon} />
                    <div className={styles.statValue}>{performanceStats.tasksCompleted}</div>
                    <div className={styles.statLabel}>Tasks Done</div>
                </div>
                <div className={styles.statCard}>
                    <Clock size={18} className={styles.statIcon} />
                    <div className={styles.statValue}>{performanceStats.avgResponseTime}</div>
                    <div className={styles.statLabel}>Avg Response</div>
                </div>
                <div className={styles.statCard}>
                    <TrendingUp size={18} className={styles.statIcon} />
                    <div className={styles.statValue}>{performanceStats.satisfaction}%</div>
                    <div className={styles.statLabel}>Satisfaction</div>
                </div>
            </div>

            {/* Recent Customers */}
            <div className={styles.section}>
                <h4 className={styles.sectionTitle}>
                    <Users size={16} />
                    <span>My Recent Customers</span>
                </h4>
                <div className={styles.customerList}>
                    {recentCustomers.map(customer => (
                        <div key={customer.id} className={styles.customerItem}>
                            <div className={styles.customerAvatar}>
                                {customer.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className={styles.customerInfo}>
                                <span className={styles.customerName}>{customer.name}</span>
                                <span className={styles.customerTime}>{customer.lastContact}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <button className={styles.viewAllBtn}>
                    View All Customers →
                </button>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <h4 className={styles.sectionTitle}>Quick Actions</h4>
                <Link href="/customers/onboard" className={styles.actionBtn}>
                    + New Customer
                </Link>
                <Link href="/customers" className={`${styles.actionBtn} ${styles.secondary}`}>
                    Create Account
                </Link>
            </div>

            {/* Contact Info - Bottom */}
            <div className={styles.contactSection}>
                <h4 className={styles.sectionTitle}>Help Desk</h4>
                <div className={styles.contactItem}>
                    <Phone size={14} />
                    <span>Internal: 1234</span>
                </div>
                <div className={styles.contactItem}>
                    <MapPin size={14} />
                    <span>Office: Floor 3, Room 302</span>
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
