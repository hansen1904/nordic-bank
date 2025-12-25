'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, ChevronDown, Globe, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
    const t = useTranslations('header');
    const tLang = useTranslations('language');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
        setLangMenuOpen(false);
    };

    const navLinks = [
        { href: `/${locale}`, label: t('home') },
        { href: `/${locale}/about`, label: t('about') },
        { href: `/${locale}/loans`, label: t('loans') },
        { href: `/${locale}/contact`, label: t('contact') },
    ];

    return (
        <header className={styles.header}>
            <div className={`container ${styles.headerContainer}`}>
                {/* Logo - Left side */}
                <Link href={`/${locale}`} className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="4" y="4" width="24" height="24" rx="2" fill="#0f172a" />
                            <path d="M16 8L22 14V24H10V14L16 8Z" fill="white" fillOpacity="0.1" />
                            <path d="M16 12V20M12 16H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <span className={styles.logoText}>Nordic Bank</span>
                </Link>

                {/* Right Side Container */}
                <div className={styles.rightSide}>
                    {/* Desktop Navigation - Now on the right */}
                    <nav className={styles.desktopNav}>
                        {navLinks.map((link) => (
                            <Link key={link.href} href={link.href} className={styles.navLink}>
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className={styles.actions}>
                        {/* Language Switcher */}
                        <div className={styles.langSwitcher}>
                            <button
                                className={styles.langButton}
                                onClick={() => setLangMenuOpen(!langMenuOpen)}
                                aria-label={tLang('label')}
                            >
                                <Globe size={16} />
                                <span className={styles.langCode}>{locale.toUpperCase()}</span>
                                <ChevronDown size={12} className={langMenuOpen ? styles.chevronUp : ''} />
                            </button>
                            {langMenuOpen && (
                                <div className={styles.langDropdown}>
                                    <button
                                        onClick={() => switchLocale('da')}
                                        className={`${styles.langOption} ${locale === 'da' ? styles.active : ''}`}
                                    >
                                        <span style={{ fontSize: '1rem' }}>🇩🇰</span> {tLang('da')}
                                    </button>
                                    <button
                                        onClick={() => switchLocale('en')}
                                        className={`${styles.langOption} ${locale === 'en' ? styles.active : ''}`}
                                    >
                                        <span style={{ fontSize: '1rem' }}>🇬🇧</span> {tLang('en')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Login Button */}
                        <Link href={`/${locale}/login`} className={`btn btn-primary ${styles.loginBtn}`}>
                            <ShieldCheck size={18} style={{ marginRight: '8px' }} />
                            {t('login')}
                        </Link>

                        {/* Mobile Menu Toggle */}
                        <button
                            className={styles.mobileToggle}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <nav className={styles.mobileNav}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={styles.mobileNavLink}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link
                        href={`/${locale}/login`}
                        className={`btn btn-primary ${styles.mobileLoginBtn}`}
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        {t('login')}
                    </Link>
                </nav>
            )}
        </header>
    );
}
