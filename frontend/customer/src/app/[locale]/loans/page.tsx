import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { ShieldCheck, CheckCircle2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import styles from '../page.module.css';

type Props = {
    params: Promise<{ locale: string }>;
};

export default async function LoansPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <LoansContent locale={locale} />;
}

function LoansContent({ locale }: { locale: string }) {
    const t = useTranslations();
    const benefits = t.raw('loans_section.benefits') as string[];

    return (
        <div style={{ paddingTop: 'var(--header-height)' }}>
            {/* Loans Section */}
            <section className={styles.loans}>
                <div className={`container ${styles.loansContainer}`}>
                    <div className={styles.loansContent}>
                        <h1 className="heading-2">{t('loans_section.title')}</h1>
                        <p className="text-large">{t('loans_section.subtitle')}</p>
                        <div className={styles.rateDisplay}>
                            <TrendingUp size={32} color="var(--color-primary-900)" />
                            <span className={styles.rateValue}>{t('loans_section.rate_value')}</span>
                            <span className={styles.rateSuffix}>{t('loans_section.rate_suffix')}</span>
                        </div>
                        <ul className={styles.benefitsList}>
                            {benefits.map((benefit, index) => (
                                <li key={index} className={styles.benefitItem}>
                                    <CheckCircle2 size={20} className={styles.benefitIcon} />
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                        <Link href={`/${locale}/login`} className="btn btn-primary">
                            <ShieldCheck size={18} style={{ marginRight: '8px' }} />
                            {t('loans_section.cta')}
                        </Link>
                    </div>
                    <div className={styles.loansVisual}>
                        <div className={styles.loanCard}>
                            <div className={styles.loanAmount}>
                                <span className={styles.loanCurrency}>DKK</span>
                                <span className={styles.loanValue}>500.000</span>
                            </div>
                            <div className={styles.loanDetails}>
                                <div className={styles.loanDetail}>
                                    <span className={styles.loanDetailLabel}>Estimated Monthly</span>
                                    <span className={styles.loanDetailValue}>4.250 kr</span>
                                </div>
                                <div className={styles.loanDetail}>
                                    <span className={styles.loanDetailLabel}>Tenure</span>
                                    <span className={styles.loanDetailValue}>15 years</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
