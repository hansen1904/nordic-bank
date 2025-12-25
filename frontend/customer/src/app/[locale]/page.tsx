import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

type Props = {
    params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <HomeContent locale={locale} />;
}

function HomeContent({ locale }: { locale: string }) {
    const t = useTranslations();

    return (
        <>
            {/* Hero Section - Classic and Professional */}
            <section className={styles.hero}>
                <div className={styles.heroBackground} />
                <div className={`container ${styles.heroContainer}`}>
                    <div className={styles.heroContent}>
                        <h1 className={`heading-1 ${styles.heroTitle}`}>
                            {t('hero.title')}
                        </h1>
                        <p className={styles.heroSubtitle}>
                            {t('hero.subtitle')}
                        </p>
                        <div className={styles.heroCtas}>
                            <Link href={`/${locale}/login`} className="btn btn-primary">
                                {t('hero.cta_primary')}
                                <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                            </Link>
                            <Link href={`/${locale}/about`} className="btn btn-secondary">
                                {t('hero.cta_secondary')}
                            </Link>
                        </div>
                    </div>
                    <div className={styles.heroVisual}>
                        <div className={styles.heroCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.logoIcon} style={{ width: '24px', height: '24px' }}>
                                    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="4" y="4" width="24" height="24" rx="2" fill="white" fillOpacity="0.1" />
                                        <path d="M16 8L22 14V24H10V14L16 8Z" fill="white" />
                                        <path d="M16 12V20M12 16H20" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <span className={styles.cardBrand}>Nordic Bank Platinum</span>
                            </div>
                            <div className={styles.cardNumber}>•••• •••• •••• 4242</div>
                            <div className={styles.cardFooter}>
                                <div className={styles.cardHolder}>
                                    <span className={styles.cardLabel}>Card Holder</span>
                                    <span className={styles.cardValue}>NORDIC INVESTOR</span>
                                </div>
                                <div className={styles.cardExpiry}>
                                    <span className={styles.cardLabel}>Expires</span>
                                    <span className={styles.cardValue}>12/29</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
