import { ReactNode } from 'react';

interface DashboardCardProps {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
}

export default function DashboardCard({ title, subtitle, children, className = '' }: DashboardCardProps) {
    return (
        <div className={`card ${className}`}>
            {(title || subtitle) && (
                <div className="card-header">
                    <div>
                        {title && <h3 className="card-title">{title}</h3>}
                        {subtitle && <p className="card-subtitle">{subtitle}</p>}
                    </div>
                </div>
            )}
            {children}
        </div>
    );
}
