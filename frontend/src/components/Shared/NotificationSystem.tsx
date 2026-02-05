import React, { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import {
    FaCheckCircle,
    FaExclamationTriangle,
    FaInfoCircle,
    FaTimes,
    FaExclamationCircle,
} from 'react-icons/fa';
import './NotificationSystem.css';

export const NotificationSystem: React.FC = () => {
    const { notifications, removeNotification } = useUIStore();

    useEffect(() => {
        // Auto-remove notifications after timeout
        const timeouts: NodeJS.Timeout[] = [];

        notifications.forEach(notification => {
            if (notification.autoClose !== false) {
                const timeout = setTimeout(() => {
                    removeNotification(notification.id);
                }, notification.duration || 5000);
                timeouts.push(timeout);
            }
        });

        return () => {
            timeouts.forEach(timeout => clearTimeout(timeout));
        };
    }, [notifications, removeNotification]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <FaCheckCircle />;
            case 'error':
                return <FaExclamationCircle />;
            case 'warning':
                return <FaExclamationTriangle />;
            default:
                return <FaInfoCircle />;
        }
    };

    if (notifications.length === 0) return null;

    return (
        <div className="notification-system">
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className={`notification notification-${notification.type}`}
                >
                    <div className="notification-icon">
                        {getIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                        {notification.title && (
                            <h4 className="notification-title">{notification.title}</h4>
                        )}
                        <p className="notification-message">{notification.message}</p>
                    </div>
                    <button
                        className="notification-close"
                        onClick={() => removeNotification(notification.id)}
                    >
                        <FaTimes />
                    </button>
                </div>
            ))}
        </div>
    );
};
