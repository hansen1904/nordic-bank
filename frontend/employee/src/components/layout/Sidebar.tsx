'use client';

import { Home, Users, CreditCard, ArrowLeftRight, HeadphonesIcon, FileText, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
    const t = useTranslations('nav');
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const navItems = [
        { href: '/', icon: Home, label: t('home') },
        { href: '/customers', icon: Users, label: t('customers') },
        { href: '/accounts', icon: CreditCard, label: t('accounts') },
        { href: '/transactions', icon: ArrowLeftRight, label: t('transactions') },
        { href: '/support', icon: HeadphonesIcon, label: t('support') },
        { href: '/reports', icon: FileText, label: t('reports') },
    ];

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/' || pathname === '/da' || pathname === '/en';
        }
        return pathname.includes(href);
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                Nordic Bank
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                        >
                            <Icon />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer" style={{ marginTop: 'auto', padding: 'var(--spacing-4)' }}>
                <button
                    onClick={handleLogout}
                    className="nav-item"
                    style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-slate-400)',
                        cursor: 'pointer'
                    }}
                >
                    <LogOut size={20} />
                    <span>{t('logout')}</span>
                </button>
            </div>
        </aside>
    );
}
