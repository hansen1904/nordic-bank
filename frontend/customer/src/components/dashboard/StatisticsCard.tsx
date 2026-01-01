'use client';

import { TrendingUp } from 'lucide-react';
import styles from './StatisticsCard.module.css';

interface StatisticsCardProps {
    title: string;
    data: number[];
    metric: string;
    metricLabel: string;
}

export default function StatisticsCard({ title, data, metric, metricLabel }: StatisticsCardProps) {
    const maxValue = Math.max(...data);
    const normalizedData = data.map(val => (val / maxValue) * 100);

    return (
        <div className={styles.card}>
            <h4 className={styles.title}>{title}</h4>

            {/* Mini Chart */}
            <div className={styles.chart}>
                {normalizedData.map((height, index) => (
                    <div key={index} className={styles.barContainer}>
                        <div
                            className={styles.bar}
                            style={{ height: `${height}%` }}
                        />
                    </div>
                ))}
            </div>

            {/* Metric */}
            <div className={styles.metric}>
                <TrendingUp size={16} className={styles.metricIcon} />
                <span className={styles.metricValue}>{metric}</span>
                <span className={styles.metricLabel}>{metricLabel}</span>
            </div>
        </div>
    );
}
