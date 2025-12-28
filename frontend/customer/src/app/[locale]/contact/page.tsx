import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { MapPin, Phone, Mail, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import styles from './page.module.css';

type Props = {
    params: Promise<{ locale: string }>;
};

export default async function ContactPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <ContactContent />;
}

function ContactContent() {
    const t = useTranslations('contact_page');
    const tFooter = useTranslations('footer');

    const socialLinks = [
        { icon: Facebook, href: '#', label: 'Facebook' },
        { icon: Twitter, href: '#', label: 'Twitter' },
        { icon: Linkedin, href: '#', label: 'LinkedIn' },
        { icon: Instagram, href: '#', label: 'Instagram' },
    ];

    return (
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '80vh' }}>
            <section style={{ padding: 'var(--spacing-24) 0', background: 'var(--bg-secondary)' }}>
                <div className="container">
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h1 className="heading-2" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            {tFooter('contact')}
                        </h1>

                        <div className={styles.contactGrid}>
                            {/* Contact Information */}
                            <div className={styles.contactCard}>
                                <div className={styles.contactIcon}>
                                    <MapPin size={24} />
                                </div>
                                <h3 className={styles.contactTitle}>{t('address_label')}</h3>
                                <p className={styles.contactText}>{tFooter('address')}</p>
                            </div>

                            <div className={styles.contactCard}>
                                <div className={styles.contactIcon}>
                                    <Phone size={24} />
                                </div>
                                <h3 className={styles.contactTitle}>{t('phone_label')}</h3>
                                <p className={styles.contactText}>{tFooter('phone')}</p>
                            </div>

                            <div className={styles.contactCard}>
                                <div className={styles.contactIcon}>
                                    <Mail size={24} />
                                </div>
                                <h3 className={styles.contactTitle}>{t('email_label')}</h3>
                                <p className={styles.contactText}>{tFooter('email')}</p>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                            <h3 className="heading-2" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
                                {tFooter('follow_us')}
                            </h3>
                            <div className={styles.socialLinks}>
                                {socialLinks.map((social) => (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        className={styles.socialLink}
                                        aria-label={social.label}
                                    >
                                        <social.icon size={20} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
