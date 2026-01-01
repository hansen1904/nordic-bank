'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter, usePathname } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { usePreferences } from '@/context/PreferencesContext';
import { Settings, Moon, Sun, Bell, Shield, User, Globe } from 'lucide-react';
import styles from './page.module.css';

export default function SettingsPage() {
    const t = useTranslations('settings');
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const locale = params.locale as string;
    const {
        theme,
        language,
        notificationsEnabled,
        emailNotifications,
        updatePreferences
    } = usePreferences();

    const isDarkMode = theme === 'dark';

    const handleLanguageChange = async (newLocale: string) => {
        // Save to backend
        await updatePreferences({ language: newLocale });

        // Replace the current locale in the pathname with the new one
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const toggleTheme = () => {
        updatePreferences({ theme: isDarkMode ? 'light' : 'dark' });
    };

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>
                        <Settings size={32} />
                        {t('title') || 'Settings'}
                    </h1>
                    <p className={styles.subtitle}>
                        {t('subtitle') || 'Manage your preferences and account settings'}
                    </p>
                </header>

                {/* Appearance */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <Sun size={20} />
                        {t('appearance') || 'Appearance'}
                    </h2>
                    <div className={styles.card}>
                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>
                                    {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                                    {t('darkMode') || 'Dark Mode'}
                                </span>
                                <span className={styles.settingDescription}>
                                    {t('darkModeDesc') || 'Switch between light and dark theme'}
                                </span>
                            </div>
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={isDarkMode}
                                    onChange={() => toggleTheme()}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>
                                    <Globe size={18} />
                                    {t('language') || 'Language'}
                                </span>
                                <span className={styles.settingDescription}>
                                    {t('languageDesc') || 'Choose your preferred language'}
                                </span>
                            </div>
                            <select
                                className={styles.select}
                                value={locale}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                            >
                                <option value="en">English</option>
                                <option value="da">Dansk</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Notifications */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <Bell size={20} />
                        {t('notifications') || 'Notifications'}
                    </h2>
                    <div className={styles.card}>
                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>
                                    <Bell size={18} />
                                    {t('pushNotifications') || 'Push Notifications'}
                                </span>
                                <span className={styles.settingDescription}>
                                    {t('pushNotificationsDesc') || 'Receive notifications about account activity'}
                                </span>
                            </div>
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={notificationsEnabled}
                                    onChange={(e) => updatePreferences({ notifications_enabled: e.target.checked })}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>
                                    {t('emailNotifications') || 'Email Notifications'}
                                </span>
                                <span className={styles.settingDescription}>
                                    {t('emailNotificationsDesc') || 'Receive email updates and statements'}
                                </span>
                            </div>
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={emailNotifications}
                                    onChange={(e) => updatePreferences({ email_notifications: e.target.checked })}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Security */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <Shield size={20} />
                        {t('security') || 'Security'}
                    </h2>
                    <div className={styles.card}>
                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>
                                    {t('changePassword') || 'Change Password'}
                                </span>
                                <span className={styles.settingDescription}>
                                    {t('changePasswordDesc') || 'Update your account password'}
                                </span>
                            </div>
                            <button className={styles.actionBtn}>
                                {t('change') || 'Change'}
                            </button>
                        </div>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>
                                    {t('twoFactor') || 'Two-Factor Authentication'}
                                </span>
                                <span className={styles.settingDescription}>
                                    {t('twoFactorDesc') || 'Add an extra layer of security to your account'}
                                </span>
                            </div>
                            <button className={styles.actionBtn}>
                                {t('enable') || 'Enable'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Profile */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <User size={20} />
                        {t('profile') || 'Profile'}
                    </h2>
                    <div className={styles.card}>
                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>
                                    {t('editProfile') || 'Edit Profile'}
                                </span>
                                <span className={styles.settingDescription}>
                                    {t('editProfileDesc') || 'Update your personal information'}
                                </span>
                            </div>
                            <button className={styles.actionBtn}>
                                {t('edit') || 'Edit'}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
