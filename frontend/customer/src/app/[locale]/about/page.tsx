import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Building2, Wallet, ShieldCheck, Clock } from 'lucide-react';
import styles from '../page.module.css';

type Props = {
    params: Promise<{ locale: string }>;
};

export default async function AboutPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <AboutContent />;
}

function AboutContent() {
    const t = useTranslations();

    const features = [
        { icon: Building2, key: 'loans' },
        { icon: Wallet, key: 'savings' },
        { icon: ShieldCheck, key: 'payments' },
        { icon: Clock, key: 'support' },
    ];

    return (
        <div style={{ paddingTop: 'var(--header-height)' }}>
            {/* Features Section */}
            <section className={styles.features}>
                <div className="container">
                    <div className={styles.sectionHeader}>
                        <h1 className="heading-2">{t('features.title')}</h1>
                        <p className="text-large">{t('features.subtitle')}</p>
                    </div>
                    <div className={styles.featuresGrid}>
                        {features.map((feature) => (
                            <div key={feature.key} className={styles.featureCard}>
                                <div className={styles.featureIcon}>
                                    <feature.icon size={24} />
                                </div>
                                <h3 className={styles.featureTitle}>
                                    {t(`features.${feature.key}.title`)}
                                </h3>
                                <p className={styles.featureDescription}>
                                    {t(`features.${feature.key}.description`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
