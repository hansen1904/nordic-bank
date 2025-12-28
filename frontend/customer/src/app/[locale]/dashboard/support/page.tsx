'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { MessageSquare, Send } from 'lucide-react';
import styles from './page.module.css';

export default function SupportPage() {
    const t = useTranslations('support');
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Send to backend
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ subject: '', message: '' });
        }, 3000);
    };

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>
                            <MessageSquare size={32} />
                            {t('title')}
                        </h1>
                        <p className="text-gray-600">We&apos;re here to help you with any questions or issues.</p>
                    </div>
                </header>

                <div className={styles.formCard}>
                    <h2>{t('contactUs')}</h2>

                    {submitted && (
                        <div className={styles.success}>
                            ✅ {t('successMessage')}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.field}>
                            <label htmlFor="subject">{t('subject')}</label>
                            <input
                                id="subject"
                                type="text"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                required
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="message">{t('message')}</label>
                            <textarea
                                id="message"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                required
                                rows={6}
                                className={styles.textarea}
                            />
                        </div>

                        <button type="submit" className={`btn btn-primary ${styles.submitBtn}`}>
                            <Send size={18} />
                            {t('send')}
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
