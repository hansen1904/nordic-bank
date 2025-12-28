'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Lock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function LoginContent({ locale }: { locale: string }) {
    const t = useTranslations('login');
    const { login } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await login(email, password);
            router.push(`/${locale}/dashboard`); // Assuming there's a dashboard
        } catch (err: unknown) {
            setError((err as Error).message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.background} />

            <div className={`container ${styles.loginContainer}`}>
                <div className={styles.loginCard}>
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

                    <div className={styles.loginFormContainer}>
                        <h3 className={styles.title}>{t('title')}</h3>
                        <p className={styles.subtitle}>{t('subtitle')}</p>

                        {error && (
                            <div className={styles.errorBanner}>
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t('form.email_or_username')}</label>
                                <div className={styles.inputWrapper}>
                                    <Mail size={18} className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        placeholder={t('form.email_or_username')}
                                        className={styles.formInput}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t('form.password')}</label>
                                <div className={styles.inputWrapper}>
                                    <Lock size={18} className={styles.inputIcon} />
                                    <input
                                        type="password"
                                        placeholder={t('form.password')}
                                        className={styles.formInput}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className={styles.formOptions}>
                                <label className={styles.checkbox}>
                                    <input type="checkbox" disabled={isLoading} />
                                    <span>Remember me</span>
                                </label>
                                <a href="#" className={styles.forgotLink}>{t('links.forgot_password')}</a>
                            </div>

                            <button
                                type="submit"
                                className={`btn btn-primary ${styles.submitButton}`}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <ShieldCheck size={18} style={{ marginRight: '8px' }} />
                                )}
                                {isLoading ? 'Authenticating...' : t('form.submit')}
                            </button>
                        </form>

                        <p className={styles.registerPrompt}>
                            {t('links.no_account')}{' '}
                            <Link href={`/${locale}/register`} className={styles.registerLink}>
                                {t('links.register')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
