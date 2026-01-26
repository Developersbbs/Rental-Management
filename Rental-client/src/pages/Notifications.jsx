import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  BellIcon,
  ClockIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  EyeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import {
  deleteNotification,
  getNotifications,
  markAsRead,
  updateNotificationSettings
} from '../services/notificationService';
import { selectUser } from '../redux/features/auth/loginSlice';

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Read', value: 'read' }
];

const PAGE_LIMIT = 10;

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString();
};

const Notifications = () => {
  const user = useSelector(selectUser);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState(null);
  const [settings, setSettings] = useState({ allowManualDelete: true, autoDeleteDays: 30 });
  const [autoDeleteInput, setAutoDeleteInput] = useState('');
  const [allowManualDeleteInput, setAllowManualDeleteInput] = useState(true);
  const [loadingActions, setLoadingActions] = useState(new Set())
  const [deletingNotifications, setDeletingNotifications] = useState(new Set())
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)

  const canManageSettings = useMemo(() => user?.role?.toLowerCase() === 'superadmin', [user?.role]);

  const loadNotifications = async (options = {}) => {
    setIsLoading(true);
    try {
      const response = await getNotifications({
        page: options.page ?? page,
        status: options.status ?? statusFilter,
        limit: PAGE_LIMIT
      });

      setNotifications(response.data || []);
      setMeta(response.meta || null);
      if (response.settings) {
        setSettings(response.settings);
        setAutoDeleteInput(String(response.settings.autoDeleteDays ?? ''));
        setAllowManualDeleteInput(response.settings.allowManualDelete ?? true);
      }
    } catch (error) {
      // handled by service
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications({ page: 1, status: statusFilter });
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleMarkAsRead = async (notificationId) => {
    if (loadingActions.has(notificationId)) return // Prevent multiple clicks

    setLoadingActions(prev => new Set(prev).add(notificationId))

    try {
      const updated = await markAsRead(notificationId);
      if (updated) {
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === notificationId ? { ...item, isRead: true, readAt: updated.readAt } : item
          )
        );
        toast.success('Notification marked as read.');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to mark as read.');
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
  };

  const handleDelete = async (notificationId) => {
    if (deletingNotifications.has(notificationId)) return // Prevent multiple clicks

    const confirmed = window.confirm('Delete this notification?');
    if (!confirmed) return;

    setDeletingNotifications(prev => new Set(prev).add(notificationId))

    try {
      await deleteNotification(notificationId);
      toast.success('Notification deleted.');
      setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
      setMeta((prev) =>
        prev
          ? {
            ...prev,
            total: Math.max(prev.total - 1, 0)
          }
          : prev
      );
    } catch (error) {
      toast.error(error?.message || 'Failed to delete notification.');
    } finally {
      // Show loading for minimum 5 seconds for better UX feedback
      setTimeout(() => {
        setDeletingNotifications(prev => {
          const newSet = new Set(prev)
          newSet.delete(notificationId)
          return newSet
        })
      }, 5000)
    }
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedNotification(null);
  };

  const handleOpenNotification = (notification) => {
    setSelectedNotification(notification);
    setIsPopupOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!canManageSettings) return;

    const parsedValue = Number(autoDeleteInput);
    if (!Number.isInteger(parsedValue) || parsedValue < 0 || parsedValue > 365) {
      toast.error('Please enter an integer between 0 and 365.');
      return;
    }

    setIsSavingSettings(true);
    try {
      const payload = {
        autoDeleteDays: parsedValue,
        allowManualDelete: allowManualDeleteInput
      };
      const response = await updateNotificationSettings(payload);
      if (response) {
        toast.success('Notification settings updated.');
        setSettings((prev) => ({
          ...prev,
          autoDeleteDays: response.autoDeleteDays,
          allowManualDelete: response.allowManualDelete
        }));
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to update settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const renderStatusBadge = (item) => {
    if (!item.isRead) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full min-w-fit">
          Unread
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full min-w-fit">
        Read
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-200 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-600">
            Review stock alerts and stay informed about inventory changes.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-gray-100 border border-slate-200 rounded-lg p-1 shadow-sm">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 min-w-[80px] touch-manipulation ${statusFilter === tab.value
                ? 'bg-blue-700 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {canManageSettings && (
        <section className="bg-gray-100 border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Notification Settings</h2>
              <p className="text-sm text-slate-600">
                Configure automatic clean-up for old notifications.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <label className="flex-1">
              <span className="block text-sm font-medium text-slate-700">Auto Delete After (Days)</span>
              <input
                type="number"
                min={0}
                max={365}
                value={autoDeleteInput}
                onChange={(event) => setAutoDeleteInput(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-200 focus:ring-opacity-50 min-h-[44px] touch-manipulation"
                placeholder="Enter number of days"
              />
              <span className="mt-1 text-xs text-slate-500">Set to 0 to disable automatic deletion.</span>
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 min-h-[44px] touch-manipulation cursor-pointer">
              <input
                type="checkbox"
                checked={allowManualDeleteInput}
                onChange={(event) => setAllowManualDeleteInput(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span className="text-sm font-medium text-slate-700">Allow manual deletion</span>
            </label>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className={`inline-flex items-center justify-center rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70 min-h-[44px] touch-manipulation ${isSavingSettings ? 'cursor-not-allowed opacity-70' : 'hover:bg-blue-800'
                }`}
            >
              {isSavingSettings ? (
                <>
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </section>
      )}

      <section className="bg-gray-100 border border-slate-200 rounded-xl shadow-sm">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Notification Feed</h2>
            <p className="text-sm text-slate-600">
              {settings.allowManualDelete
                ? 'You can manually delete notifications.'
                : 'Manual deletion is disabled by the administrator.'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 overflow-hidden">
            <span className="font-semibold text-slate-700">
              {meta ? `Page ${meta.page} of ${meta.totalPages}` : 'Page 1'}
            </span>
            {typeof meta?.total === 'number' && (
              <>
                <span>•</span>
                <span>{meta.total} total</span>
              </>
            )}
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 px-6">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-blue-400 animate-pulse mb-4" />
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-slate-500 px-6 py-20">
            <BellIcon className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-700 mb-2">No notifications to display.</p>
            <p className="text-sm">Try a different filter or check back later.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 min-h-[400px]">
            {notifications.map((item) => (
              <li key={item._id} className="p-4 sm:p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight line-clamp-2">{item.message}</h3>
                    {renderStatusBadge(item)}
                  </div>
                  <div className="text-sm text-slate-500">
                    <span className="font-medium text-slate-700">Created:</span> {formatDateTime(item.createdAt)}
                    {item.readAt && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="font-medium text-slate-700">Read:</span> {formatDateTime(item.readAt)}
                      </>
                    )}
                  </div>
                  {item.productId?.name && (
                    <span className="text-xs uppercase tracking-wide text-slate-400 font-medium">Product: {item.productId.name}</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenNotification(item)}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100 min-h-[44px] min-w-[100px] justify-center touch-manipulation"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View Details
                  </button>

                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(item._id)}
                      disabled={loadingActions.has(item._id)}
                      className={`inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100 min-h-[44px] min-w-[100px] justify-center touch-manipulation ${loadingActions.has(item._id)
                        ? 'opacity-70 cursor-not-allowed bg-gray-200'
                        : 'hover:bg-blue-100'
                        }`}
                    >
                      {loadingActions.has(item._id) ? (
                        <>
                          <div className="w-4 h-4 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Reading...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          Mark as Read
                        </>
                      )}
                    </button>
                  )}

                  {settings.allowManualDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingNotifications.has(item._id)}
                      className={`inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100 min-h-[44px] min-w-[100px] justify-center touch-manipulation ${deletingNotifications.has(item._id)
                        ? 'opacity-70 cursor-not-allowed bg-gray-200'
                        : 'hover:bg-rose-100'
                        }`}
                    >
                      {deletingNotifications.has(item._id) ? (
                        <>
                          <div className="w-4 h-4 border border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <TrashIcon className="h-4 w-4" />
                          Delete
                        </>
                      )}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {meta && meta.totalPages > 1 && (
          <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-gray-100 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px] min-w-[100px] justify-center touch-manipulation"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </button>

            <span className="text-sm text-slate-600">
              Page {page} of {meta.totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPages))}
              disabled={page >= meta.totalPages}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-gray-100 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px] min-w-[100px] justify-center touch-manipulation"
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </footer>
        )}
      </section>

      {/* Notification Popup/Modal */}
      {isPopupOpen && selectedNotification && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-slate-900 bg-opacity-50 transition-opacity"
              onClick={handleClosePopup}
            ></div>

            {/* Modal panel */}
            <div className="relative inline-block w-full max-w-2xl p-0 bg-gray-100 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all align-middle">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-gray-100 bg-opacity-20 rounded-lg">
                      <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-white">Notification Details</h3>
                      <p className="text-blue-100 text-xs sm:text-sm hidden sm:block">Review complete notification information</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClosePopup}
                    className="p-1.5 sm:p-2 text-white hover:bg-gray-100 hover:bg-opacity-20 rounded-lg transition-colors touch-manipulation"
                  >
                    <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                {/* Status badge */}
                <div className="flex justify-center">
                  {renderStatusBadge(selectedNotification)}
                </div>

                {/* Message */}
                <div className="text-center">
                  <h4 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 sm:mb-3 leading-tight">
                    {selectedNotification.message}
                  </h4>
                  {selectedNotification.productId?.name && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                      <InformationCircleIcon className="h-4 w-4" />
                      Product: {selectedNotification.productId.name}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="bg-slate-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-slate-700">Created:</span>
                      <span className="ml-2 text-slate-600">{formatDateTime(selectedNotification.createdAt)}</span>
                    </div>
                  </div>

                  {selectedNotification.readAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-slate-700">Read:</span>
                        <span className="ml-2 text-slate-600">{formatDateTime(selectedNotification.readAt)}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 sm:pt-3 border-t border-slate-200">
                    <div className="flex items-start gap-3">
                      <InformationCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-slate-700 mb-1 text-sm">Notification Type</p>
                        <p className="text-xs sm:text-sm text-slate-600">
                          {selectedNotification.type || 'General notification'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4">
                  {!selectedNotification.isRead && (
                    <button
                      type="button"
                      onClick={() => {
                        handleMarkAsRead(selectedNotification._id);
                        handleClosePopup();
                      }}
                      disabled={loadingActions.has(selectedNotification._id)}
                      className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 min-h-[44px] touch-manipulation ${loadingActions.has(selectedNotification._id)
                        ? 'opacity-70 cursor-not-allowed bg-gray-400'
                        : 'hover:bg-blue-800'
                        }`}
                    >
                      {loadingActions.has(selectedNotification._id) ? (
                        <>
                          <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Marking...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          Mark as Read & Close
                        </>
                      )}
                    </button>
                  )}

                  {settings.allowManualDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDelete(selectedNotification._id);
                        handleClosePopup();
                      }}
                      disabled={deletingNotifications.has(selectedNotification._id)}
                      className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 sm:py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 min-h-[44px] touch-manipulation ${deletingNotifications.has(selectedNotification._id)
                        ? 'opacity-70 cursor-not-allowed bg-gray-200'
                        : 'hover:bg-rose-100'
                        }`}
                    >
                      {deletingNotifications.has(selectedNotification._id) ? (
                        <>
                          <div className="w-4 h-4 border border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <TrashIcon className="h-4 w-4" />
                          Delete Notification
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
