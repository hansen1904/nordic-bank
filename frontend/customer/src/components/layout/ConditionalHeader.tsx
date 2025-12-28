'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
    const pathname = usePathname();
    const isDashboard = pathname.includes('/dashboard');

    // Don't show header on dashboard pages
    if (isDashboard) {
        return null;
    }

    return <Header />;
}
