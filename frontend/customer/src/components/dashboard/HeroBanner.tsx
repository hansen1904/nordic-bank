'use client';

import { ArrowRight } from 'lucide-react';
import styles from './HeroBanner.module.css';

interface HeroBannerProps {
    title: string;
    subtitle: string;
    ctaText?: string;
    ctaAction?: () => void;
    variant?: 'primary' | 'secondary';
}

export default function HeroBanner({
    title,
    subtitle,
    ctaText,
    ctaAction,
    variant = 'primary'
}: HeroBannerProps) {
    return (
        <div className={`${styles.banner} ${styles[variant]}`}>
            <div className={styles.content}>
                <div className={styles.textContent}>
                    <span className={styles.badge}>ANNOUNCEMENT</span>
                    <h2 className={styles.title}>{title}</h2>
                    <p className={styles.subtitle}>{subtitle}</p>
                </div>
                {ctaText && (
                    <button 
                        className={styles.ctaButton}
                        onClick={ctaAction}
                    >
                        <span>{ctaText}</span>
                        <ArrowRight size={18} />
                    </button>
                )}
            </div>
            <div className={styles.decoration}>
                <div className={styles.orb1}></div>
                <div className={styles.orb2}></div>
            </div>
        </div>
    );
}
