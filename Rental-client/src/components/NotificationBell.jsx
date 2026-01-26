import { useCallback, useEffect, useRef, useState } from 'react';
import { HiBell } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/features/auth/loginSlice';
import { getNotifications, markAsRead } from '../services/notificationService';

const UNREAD_LIMIT = 10;
const ALLOWED_ROLES = ['superadmin', 'stockmanager', 'billcounter', 'staff'];

export default function NotificationBell() {
  const user = useSelector(selectUser);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const dropdownRef = useRef(null);

  const fetchUnreadNotifications = useCallback(async ({ silent = false } = {}) => {
    const userRole = user?.role?.toLowerCase();
    if (!user || !ALLOWED_ROLES.includes(userRole)) {
      setNotifications([]);
      setTotalUnread(0);
      if (!silent) {
        setIsLoading(false);
      }
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await getNotifications({ status: 'unread', limit: UNREAD_LIMIT });
      setNotifications(response.data || []);
      const unreadTotal = response.meta?.total ?? response.data?.length ?? 0;
      setTotalUnread(unreadTotal);
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [user]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    // Add event listener when the popup is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Refresh notifications periodically
  useEffect(() => {
    fetchUnreadNotifications();
    const interval = setInterval(() => {
      fetchUnreadNotifications({ silent: true });
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadNotifications]);

  useEffect(() => {
    setIsOpen(false);
    fetchUnreadNotifications();
  }, [user, fetchUnreadNotifications]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchUnreadNotifications({ silent: true });
    }
  };
  const [loadingActions, setLoadingActions] = useState(new Set())

  const handleMarkAsRead = async (notificationId) => {
    if (loadingActions.has(notificationId)) return // Prevent multiple clicks

    setLoadingActions(prev => new Set(prev).add(notificationId))

    try {
      await markAsRead(notificationId)
      setNotifications((prev) => prev.filter((item) => item._id !== notificationId))
      setTotalUnread((prev) => Math.max(prev - 1, 0))
      fetchUnreadNotifications({ silent: true })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      if (error.response?.status === 403) {
        setIsOpen(false)
      }
    } finally {
      // Show loading for minimum 5 seconds for better UX feedback
      setTimeout(() => {
        setLoadingActions(prev => {
          const newSet = new Set(prev)
          newSet.delete(notificationId)
          return newSet
        })
      }, 5000)
    }
  }

  // Check if user has permission to see notifications
  const userRole = user?.role?.toLowerCase();
  if (!user || !ALLOWED_ROLES.includes(userRole)) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 relative ${isOpen ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'
          }`}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <HiBell className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-background">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/5 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Notification Popup */}
      <div
        className={`fixed md:absolute top-16 md:top-12 left-4 right-4 md:left-auto md:right-0 md:w-96 bg-white rounded-xl shadow-2xl overflow-hidden z-[150] border border-gray-200 transform transition-all duration-200 origin-top md:origin-top-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-2 pointer-events-none'
          }`}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            {totalUnread > 0 && (
              <span className="badge badge-primary px-2 py-0.5 text-xs font-bold rounded-full">
                {totalUnread} New
              </span>
            )}
          </div>
          <Link
            to="/notifications"
            className="text-xs font-medium text-primary hover:underline transition-colors"
            onClick={() => setIsOpen(false)}
          >
            View all
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 px-4">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="text-xs text-muted-foreground font-medium">Loading updates...</span>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-12 text-center bg-gray-50/50">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <HiBell className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">No new notifications</p>
            <p className="text-xs text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {notifications.map((item) => (
              <div key={item._id} className="group border-b border-gray-50 last:border-0">
                <button
                  type="button"
                  onClick={() => handleMarkAsRead(item._id)}
                  disabled={loadingActions.has(item._id)}
                  className="block w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors relative"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug line-clamp-2 mb-1.5 font-medium">
                        {item.message}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {loadingActions.has(item._id) ? (
                          <span className="text-primary font-medium flex items-center gap-1">
                            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </span>
                        ) : (
                          <span className="opacity-0 group-hover:opacity-100 text-primary font-medium transition-opacity">
                            Mark as read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
            <Link
              to="/notifications"
              className="text-xs text-muted-foreground hover:text-primary font-medium transition-colors"
              onClick={() => setIsOpen(false)}
            >
              See all notifications
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
