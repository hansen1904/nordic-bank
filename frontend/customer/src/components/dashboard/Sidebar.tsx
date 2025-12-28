'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Wallet, Building2, MessageSquare, LogOut, User, ChevronLeft, Globe } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
    locale: string;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ locale, isOpen = true, onClose }: SidebarProps) {
    const t = useTranslations('navigation');
    const tLang = useTranslations('language');

    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [langMenuOpen, setLangMenuOpen] = useState(false);

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
        setLangMenuOpen(false);
    };

    const navItems = [
        {
            href: `/${locale}/dashboard`,
            label: t('overview'),
            icon: LayoutDashboard,
        },
        {
            href: `/${locale}/dashboard/accounts`,
            label: t('accounts'),
            icon: Wallet,
        },
        {
            href: `/${locale}/dashboard/loans`,
            label: t('loans'),
            icon: Building2,
        },
        {
            href: `/${locale}/dashboard/support`,
            label: t('support'),
            icon: MessageSquare,
        },
    ];

    const isActive = (href: string) => {
        if (href === `/${locale}/dashboard`) {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    const handleLogout = () => {
        logout();
        if (onClose) onClose();
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div className={styles.overlay} onClick={onClose} />
            )}

            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                {/* Mobile close button */}
                <button className={styles.closeBtn} onClick={onClose}>
                    <ChevronLeft size={24} />
                </button>

                {/* User Profile Section */}
                <div className={styles.profile}>
                    <div className={styles.avatar}>
                        <User size={24} />
                    </div>
                    <div className={styles.userInfo}>
                        <h3 className={styles.userName}>{user?.username || 'User'}</h3>
                        <p className={styles.userEmail}>{user?.email}</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${active ? styles.active : ''}`}
                                onClick={onClose}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Language Switcher */}
                <div className={styles.langSection}>
                    <button
                        className={styles.langButton}
                        onClick={() => setLangMenuOpen(!langMenuOpen)}
                    >
                        <Globe size={20} />
                        <span>{locale.toUpperCase()}</span>
                    </button>

                    {langMenuOpen && (
                        <div className={styles.langDropdown}>
                            <button
                                onClick={() => switchLocale('da')}
                                className={`${styles.langOption} ${locale === 'da' ? styles.active : ''}`}
                            >
                                🇩🇰 {tLang('da')}
                            </button>
                            <button
                                onClick={() => switchLocale('en')}
                                className={`${styles.langOption} ${locale === 'en' ? styles.active : ''}`}
                            >
                                🇬🇧 {tLang('en')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Logout Button */}
                <button className={styles.logoutBtn} onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>{t('logout')}</span>
                </button>
            </aside>
        </>
    );
}
