import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import {
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    MapPin,
    Phone,
    Mail
} from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
    const t = useTranslations('footer');
    const tHeader = useTranslations('header');
    const locale = useLocale();

    const quickLinks = [
        { href: `/${locale}`, label: tHeader('home') },
        { href: `/${locale}#features`, label: tHeader('about') },
        { href: `/${locale}#loans`, label: tHeader('loans') },
        { href: `/${locale}/login`, label: tHeader('login') },
    ];

    const socialLinks = [
        { icon: Facebook, href: '#', label: 'Facebook' },
        { icon: Twitter, href: '#', label: 'Twitter' },
        { icon: Linkedin, href: '#', label: 'LinkedIn' },
        { icon: Instagram, href: '#', label: 'Instagram' },
    ];

    return (
        <footer className={styles.footer} id="contact">
            <div className={`container ${styles.footerContainer}`}>
                <div className={styles.footerGrid}>
                    {/* Brand Column - Updated for Seriousness */}
                    <div className={styles.brandColumn}>
                        <Link href={`/${locale}`} className={styles.logo}>
                            <div className={styles.logoIcon}>
                                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="4" y="4" width="24" height="24" rx="2" fill="white" fillOpacity="0.1" />
                                    <path d="M16 8L22 14V24H10V14L16 8Z" fill="white" />
                                    <path d="M16 12V20M12 16H20" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <span className={styles.logoText}>Nordic Bank</span>
                        </Link>
                        <p className={styles.description}>{t('description')}</p>
                    </div>

                    {/* Quick Links */}
                    <div className={styles.linksColumn}>
                        <h4 className={styles.columnTitle}>{t('quick_links')}</h4>
                        <ul className={styles.linksList}>
                            {quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className={styles.link}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className={styles.contactColumn}>
                        <h4 className={styles.columnTitle}>{t('contact')}</h4>
                        <ul className={styles.contactList}>
                            <li className={styles.contactItem}>
                                <MapPin size={18} className={styles.contactIcon} />
                                <span>{t('address')}</span>
                            </li>
                            <li className={styles.contactItem}>
                                <Phone size={18} className={styles.contactIcon} />
                                <span>{t('phone')}</span>
                            </li>
                            <li className={styles.contactItem}>
                                <Mail size={18} className={styles.contactIcon} />
                                <span>{t('email')}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div className={styles.socialColumn}>
                        <h4 className={styles.columnTitle}>{t('follow_us')}</h4>
                        <div className={styles.socialLinks}>
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    className={styles.socialLink}
                                    aria-label={social.label}
                                >
                                    <social.icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className={styles.bottomBar}>
                    <p className={styles.copyright}>{t('copyright')}</p>
                </div>
            </div>
        </footer>
    );
}
