import React from 'react';
import { Clock, AlertTriangle, Phone, Mail, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RentalNotificationCard = ({ notification }) => {
    const navigate = useNavigate();

    // Determine color scheme based on urgency
    const getUrgencyStyles = () => {
        switch (notification.urgency) {
            case 'overdue':
                return {
                    bgColor: 'bg-red-50 hover:bg-red-100',
                    borderColor: 'border-red-200',
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                    textColor: 'text-red-600',
                    badgeBg: 'bg-red-100',
                    badgeText: 'text-red-800',
                    badgeBorder: 'border-red-200'
                };
            case 'due-today':
                return {
                    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
                    borderColor: 'border-yellow-200',
                    iconBg: 'bg-yellow-100',
                    iconColor: 'text-yellow-600',
                    textColor: 'text-yellow-600',
                    badgeBg: 'bg-yellow-100',
                    badgeText: 'text-yellow-800',
                    badgeBorder: 'border-yellow-200'
                };
            case 'due-soon':
                return {
                    bgColor: 'bg-orange-50 hover:bg-orange-100',
                    borderColor: 'border-orange-200',
                    iconBg: 'bg-orange-100',
                    iconColor: 'text-orange-600',
                    textColor: 'text-orange-600',
                    badgeBg: 'bg-orange-100',
                    badgeText: 'text-orange-800',
                    badgeBorder: 'border-orange-200'
                };
            default:
                return {
                    bgColor: 'bg-gray-50 hover:bg-gray-100',
                    borderColor: 'border-gray-200',
                    iconBg: 'bg-gray-100',
                    iconColor: 'text-gray-600',
                    textColor: 'text-gray-600',
                    badgeBg: 'bg-gray-100',
                    badgeText: 'text-gray-800',
                    badgeBorder: 'border-gray-200'
                };
        }
    };

    const styles = getUrgencyStyles();

    // Format time display
    const getTimeDisplay = () => {
        if (notification.isOverdue) {
            const days = notification.overdueDays;
            return {
                label: 'Overdue',
                value: days === 1 ? '1 day' : `${days} days`
            };
        } else if (notification.daysUntilDue === 0) {
            return {
                label: 'Due',
                value: 'Today'
            };
        } else {
            const days = notification.daysUntilDue;
            return {
                label: 'Due in',
                value: days === 1 ? '1 day' : `${days} days`
            };
        }
    };

    const timeDisplay = getTimeDisplay();

    const handleClick = () => {
        navigate(`/rentals/return/${notification._id}`);
    };

    return (
        <div
            onClick={handleClick}
            className={`${styles.bgColor} ${styles.borderColor} border rounded-lg p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md`}
        >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                {/* Left Section - Customer & Rental Info */}
                <div className="flex items-start flex-1 min-w-0">
                    <div className={`${styles.iconBg} p-2 rounded-lg mr-3 flex-shrink-0`}>
                        <AlertTriangle className={`w-5 h-5 ${styles.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Customer Name */}
                        <h4 className="font-semibold text-gray-900 truncate text-base">
                            {notification.customer.name}
                        </h4>

                        {/* Rental ID */}
                        <p className="text-sm text-gray-600 mb-2">
                            Rental: <span className="font-medium text-blue-600">{notification.rentalId}</span>
                        </p>

                        {/* Contact Info */}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2">
                            {notification.customer.phone && (
                                <div className="flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    <span>{notification.customer.phone}</span>
                                </div>
                            )}
                            {notification.customer.email && (
                                <div className="flex items-center">
                                    <Mail className="w-3 h-3 mr-1" />
                                    <span className="truncate max-w-[150px]">{notification.customer.email}</span>
                                </div>
                            )}
                        </div>

                        {/* Rental Items */}
                        <div className="mt-2">
                            <div className="flex items-center text-xs text-gray-700 mb-1">
                                <Package className="w-3 h-3 mr-1" />
                                <span className="font-medium">{notification.itemCount} {notification.itemCount === 1 ? 'Item' : 'Items'}:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {notification.items.slice(0, 3).map((item, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white border border-gray-200 text-gray-700"
                                    >
                                        {item.productName}
                                    </span>
                                ))}
                                {notification.itemCount > 3 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                        +{notification.itemCount - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section - Time Info */}
                <div className="flex sm:flex-col items-start sm:items-end gap-2 sm:gap-1 flex-shrink-0">
                    {/* Time Badge */}
                    <div className={`${styles.badgeBg} ${styles.badgeText} ${styles.badgeBorder} border px-3 py-1.5 rounded-lg text-center`}>
                        <div className="text-xs font-medium">{timeDisplay.label}</div>
                        <div className="text-sm font-bold">{timeDisplay.value}</div>
                    </div>

                    {/* Expected Return Date */}
                    <div className="text-xs text-gray-500 text-right">
                        <div className="flex items-center sm:justify-end">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{new Date(notification.expectedReturnTime).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[10px]">
                            {new Date(notification.expectedReturnTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RentalNotificationCard;
