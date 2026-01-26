import React from 'react';
import { AlertTriangle, Clock, CheckCircle, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServiceAlertCard = ({ alert, onAcknowledge, onDismiss }) => {
    const navigate = useNavigate();

    const getSeverityConfig = (severity) => {
        const config = {
            critical: {
                bg: 'bg-red-50 dark:bg-red-900/20',
                border: 'border-red-200 dark:border-red-800',
                icon: AlertTriangle,
                iconColor: 'text-red-600 dark:text-red-400',
                badge: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            },
            warning: {
                bg: 'bg-yellow-50 dark:bg-yellow-900/20',
                border: 'border-yellow-200 dark:border-yellow-800',
                icon: Clock,
                iconColor: 'text-yellow-600 dark:text-yellow-400',
                badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
            },
            info: {
                bg: 'bg-indigo-50 dark:bg-indigo-900/20',
                border: 'border-indigo-200 dark:border-indigo-800',
                icon: CheckCircle,
                iconColor: 'text-indigo-600 dark:text-indigo-400',
                badge: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200'
            }
        };
        return config[severity] || config.info;
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return `Overdue by ${Math.abs(diffDays)} days`;
        } else if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return 'Due tomorrow';
        } else {
            return `Due in ${diffDays} days`;
        }
    };

    const config = getSeverityConfig(alert.severity);
    const Icon = config.icon;

    return (
        <div className={`p-4 rounded-lg border ${config.bg} ${config.border} transition-all hover:shadow-md`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${config.badge}`}>
                        <Icon className={`w-5 h-5 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {alert.rentalProduct?.name || 'Unknown Product'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {formatDate(alert.dueDate)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Service due: {new Date(alert.dueDate).toLocaleDateString()}
                        </p>
                        {alert.rentalProduct?.serviceInterval && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                Service interval: Every {alert.rentalProduct.serviceInterval} days
                            </p>
                        )}
                    </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.badge} capitalize`}>
                    {alert.severity}
                </span>
            </div>

            {alert.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                    <button
                        onClick={() => navigate('/service-maintenance')}
                        className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 flex items-center justify-center gap-1 shadow-sm transition-colors"
                    >
                        <Wrench className="w-4 h-4" />
                        Service Now
                    </button>
                    <button
                        onClick={() => onAcknowledge(alert._id)}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                    >
                        Acknowledge
                    </button>
                </div>
            )}

            {alert.status === 'acknowledged' && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Acknowledged by {alert.acknowledgedBy?.username || 'Unknown'} on{' '}
                    {new Date(alert.acknowledgedAt).toLocaleDateString()}
                </div>
            )}
        </div>
    );
};

export default ServiceAlertCard;
