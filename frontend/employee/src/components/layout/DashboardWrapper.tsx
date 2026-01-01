'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import styles from './DashboardWrapper.module.css';

export default function DashboardWrapper({ children, locale }: { children: React.ReactNode, locale: string }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !user && !pathname.includes('/login')) {
            router.push(`/${locale}/login`);
        }
    }, [user, isLoading, pathname, router, locale]);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    if (!user && !pathname.includes('/login')) {
        return null; // Will redirect
    }

    // Login page has no sidebar
    if (pathname.includes('/login')) {
        return <>{children}</>;
    }

    return (
        <div className={styles.dashboardLayout}>
            {/* Left Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className={styles.mainContent}>
                <div className={styles.content}>
                    {children}
                </div>
            </main>

            {/* Right Sidebar */}
            <RightSidebar />
        </div>
    );
}
