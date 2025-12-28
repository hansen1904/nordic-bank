'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Lock, User, ShieldCheck, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function RegisterContent({ locale }: { locale: string }) {
    const t = useTranslations('register');
    const { register } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await register(formData);
            router.push(`/${locale}/dashboard`);
        } catch (err: unknown) {
            setError((err as Error).message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.registerPage}>
            <div className={styles.background} />

            <div className={`container ${styles.registerContainer}`}>
                <div className={styles.registerCard}>
                    <div className={styles.topNav}>
                        <Link href={`/${locale}/login`} className={styles.backLink}>
                            <ArrowLeft size={20} />
                            <span>{t('login')}</span>
                        </Link>
                    </div>

                    <div className={styles.registerFormContainer}>
                        <h3 className={styles.title}>{t('title')}</h3>
                        <p className={styles.subtitle}>{t('subtitle')}</p>

                        {error && (
                            <div className={styles.errorBanner}>
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.nameRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('first_name_label')}</label>
                                    <div className={styles.inputWrapper}>
                                        <User size={18} className={styles.inputIcon} />
                                        <input
                                            type="text"
                                            name="firstName"
                                            placeholder={t('first_name_placeholder')}
                                            className={styles.formInput}
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('last_name_label')}</label>
                                    <div className={styles.inputWrapper}>
                                        <User size={18} className={styles.inputIcon} />
                                        <input
                                            type="text"
                                            name="lastName"
                                            placeholder={t('last_name_placeholder')}
                                            className={styles.formInput}
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t('username_label')}</label>
                                <div className={styles.inputWrapper}>
                                    <User size={18} className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        name="username"
                                        placeholder={t('username_placeholder')}
                                        className={styles.formInput}
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t('email_label')}</label>
                                <div className={styles.inputWrapper}>
                                    <Mail size={18} className={styles.inputIcon} />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder={t('email_placeholder')}
                                        className={styles.formInput}
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t('password_label')}</label>
                                <div className={styles.inputWrapper}>
                                    <Lock size={18} className={styles.inputIcon} />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder={t('password_placeholder')}
                                        className={styles.formInput}
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={8}
                                        disabled={isLoading}
                                    />
                                </div>
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
                                {isLoading ? 'Processing...' : t('submit')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
