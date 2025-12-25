'use client';

import { useTranslations } from 'next-intl';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Plus, Bell } from 'lucide-react';

interface HeaderProps {
    employeeName?: string;
}

export default function Header({ employeeName = 'Tom' }: HeaderProps) {
    const t = useTranslations('dashboard');
    const params = useParams();
    const pathname = usePathname();
    const currentLocale = params.locale as string;

    const getTimeOfDay = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('morning');
        if (hour < 18) return t('afternoon');
        return t('evening');
    };

    const greeting = t('greeting', {
        timeOfDay: getTimeOfDay(),
        name: employeeName
    });

    // Get the path without the locale prefix
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';

    return (
        <header className="dashboard-header">
            <h1 className="greeting">{greeting}</h1>
            <div className="header-actions">
                <div className="language-switcher">
                    <Link
                        href={`/da${pathWithoutLocale}`}
                        className={`lang-option ${currentLocale === 'da' ? 'active' : ''}`}
                    >
                        DA
                    </Link>
                    <Link
                        href={`/en${pathWithoutLocale}`}
                        className={`lang-option ${currentLocale === 'en' ? 'active' : ''}`}
                    >
                        EN
                    </Link>
                </div>
                <button className="btn btn-secondary" aria-label="Notifications">
                    <Bell size={18} />
                </button>
                <button className="btn btn-primary">
                    <Plus size={18} />
                    New Challenge
                </button>
            </div>
        </header>
    );
}
