'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { LayoutDashboard, Building2, MessageSquare, LogOut, User, ChevronLeft, Globe, Settings } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import styles from './Sidebar.module.css';

interface SidebarProps {
    locale: string;
    isOpen?: boolean;
    onClose?: () => void;
}

interface CustomerProfile {
    FirstName?: string;
}

export default function Sidebar({ locale, isOpen = true, onClose }: SidebarProps) {
    const t = useTranslations('navigation');
    const tLang = useTranslations('language');

    const { user, logout } = useAuth();
    const { updatePreferences } = usePreferences();
    const pathname = usePathname();
    const router = useRouter();
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [firstName, setFirstName] = useState(user?.username || 'User');

    useEffect(() => {
        if (user) {
            apiRequest<CustomerProfile>(
                `/customers/me?user_id=${user.id}`,
                { method: 'GET' },
                '8082'
            ).then(profile => {
                if (profile && profile.FirstName) {
                    setFirstName(profile.FirstName);
                }
            }).catch(() => {
                // Keep default username on error
            });
        }
    }, [user]);

    const switchLocale = async (newLocale: string) => {
        // Save preference
        await updatePreferences({ language: newLocale });

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
            icon: LayoutDashboard, // accounts usually uses wallet, swapping icons if needed
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
        {
            href: `/${locale}/dashboard/settings`,
            label: t('settings') || 'Settings',
            icon: Settings,
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
                        <h3 className={styles.userName}>{firstName}</h3>
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
