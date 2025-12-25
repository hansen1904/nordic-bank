interface MetricCardProps {
    value: string | number;
    label: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export default function MetricCard({ value, label, trend }: MetricCardProps) {
    return (
        <div className="metric-card">
            <div className="metric-value">{value}</div>
            <div className="metric-label">{label}</div>
            {trend && (
                <div className={`mt-2 text-sm ${trend.isPositive ? 'text-success' : 'text-error'}`}>
                    {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </div>
            )}
        </div>
    );
}
