'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import { Menu, Loader2 } from 'lucide-react';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const params = useParams();
    const router = useRouter();
    const locale = params.locale as string;
    const { user, isLoading } = useAuth();

    // P0 FIX: Authentication guard - redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !user) {
            router.push(`/${locale}/login`);
        }
    }, [user, isLoading, router, locale]);

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 size={48} className={styles.spinner} />
                <p>Loading...</p>
            </div>
        );
    }

    // Don't render dashboard if not authenticated
    if (!user) {
        return null;
    }

    return (
        <div className={styles.container}>
            {/* Left Sidebar */}
            <Sidebar
                locale={locale}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <div className={styles.main}>
                {/* Mobile Menu Toggle */}
                <button
                    className={styles.menuToggle}
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open menu"
                >
                    <Menu size={24} />
                </button>

                <div className={styles.content}>
                    {children}
                </div>
            </div>

            {/* Right Sidebar */}
            <RightSidebar user={user} />
        </div>
    );
}
