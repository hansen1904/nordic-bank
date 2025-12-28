'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%' }}></div>
            </div>
        );
    }

    if (!user && !pathname.includes('/login')) {
        return null; // Will redirect
    }

    if (pathname.includes('/login')) {
        return <>{children}</>;
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
