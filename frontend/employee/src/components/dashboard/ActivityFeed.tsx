import { formatDistanceToNow } from '@/lib/utils';

interface Activity {
    id: string;
    type: 'comment' | 'approval' | 'status_change' | 'report';
    title: string;
    description: string;
    timestamp: Date;
    icon?: string;
}

interface ActivityFeedProps {
    activities: Activity[];
    maxHeight?: string;
}

export default function ActivityFeed({ activities, maxHeight = '400px' }: ActivityFeedProps) {
    if (activities.length === 0) {
        return (
            <div className="text-center text-muted py-8">
                No recent activity
            </div>
        );
    }

    return (
        <div className="activity-feed" style={{ maxHeight }}>
            {activities.map((activity) => (
                <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                        {getActivityIcon(activity.type)}
                    </div>
                    <div className="activity-content">
                        <div className="activity-title">{activity.title}</div>
                        <div className="activity-description">{activity.description}</div>
                        <div className="activity-time">
                            {formatDistanceToNow(activity.timestamp)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function getActivityIcon(type: Activity['type']) {
    switch (type) {
        case 'comment':
            return '💬';
        case 'approval':
            return '✓';
        case 'status_change':
            return '🔄';
        case 'report':
            return '📄';
        default:
            return '•';
    }
}
