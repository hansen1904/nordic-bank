'use client';

import { useTranslations } from 'next-intl';
import { Mail, Lock, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function LoginContent({ locale }: { locale: string }) {
    const t = useTranslations('login');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <div className={styles.loginPage}>
            {/* Background Elements - Simple Architectural Grid */}
            <div className={styles.background} />

            <div className={`container ${styles.loginContainer}`}>
                <div className={styles.loginCard}>
                    {/* Logo - Classic & Serious */}
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

                    {/* Coming Soon Banner - Informational & Grave */}
                    <div className={styles.comingSoonBanner}>
                        <div className={styles.comingSoonIcon}>
                            <Info size={20} />
                        </div>
                        <div className={styles.comingSoonContent}>
                            <h2 className={styles.comingSoonTitle}>{t('coming_soon.title')}</h2>
                            <p className={styles.comingSoonMessage}>{t('coming_soon.message')}</p>
                        </div>
                    </div>

                    {/* Notify Form */}
                    <div className={styles.notifyForm}>
                        <div className={styles.inputWrapper}>
                            <Mail size={18} className={styles.inputIcon} />
                            <input
                                type="email"
                                placeholder={t('coming_soon.notify_placeholder')}
                                className={styles.notifyInput}
                            />
                        </div>
                        <button className={`btn btn-primary ${styles.notifyButton}`}>
                            {t('coming_soon.notify_button')}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className={styles.divider}>
                        <span className={styles.dividerLine} />
                        <span className={styles.dividerText}>Preview</span>
                        <span className={styles.dividerLine} />
                    </div>

                    {/* Login Form Preview (Disabled) */}
                    <div className={styles.loginFormPreview}>
                        <h3 className={styles.previewTitle}>{t('title')}</h3>
                        <p className={styles.previewSubtitle}>{t('subtitle')}</p>

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t('email_label')}</label>
                                <div className={styles.inputWrapper}>
                                    <Mail size={18} className={styles.inputIcon} />
                                    <input
                                        type="email"
                                        placeholder={t('email_placeholder')}
                                        className={styles.formInput}
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t('password_label')}</label>
                                <div className={styles.inputWrapper}>
                                    <Lock size={18} className={styles.inputIcon} />
                                    <input
                                        type="password"
                                        placeholder={t('password_placeholder')}
                                        className={styles.formInput}
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className={styles.formOptions}>
                                <label className={styles.checkbox}>
                                    <input type="checkbox" disabled />
                                    <span>{t('remember_me')}</span>
                                </label>
                                <a href="#" className={styles.forgotLink}>{t('forgot_password')}</a>
                            </div>

                            <button type="submit" className={`btn btn-primary ${styles.submitButton}`} disabled>
                                <ShieldCheck size={18} style={{ marginRight: '8px' }} />
                                {t('submit')}
                            </button>
                        </form>

                        <p className={styles.registerPrompt}>
                            {t('no_account')}{' '}
                            <a href="#" className={styles.registerLink}>{t('register')}</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
