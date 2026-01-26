import axios from './instance';

// Create an abort controller for request cancellation
let abortController = new AbortController();

// Create a default config with credentials and auth token
const createConfig = (customConfig = {}) => {
  const { headers: customHeaders, ...restConfig } = customConfig;
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // Add authorization header if token exists
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  return {
    withCredentials: true, // Important for cookies
    headers: {
      ...defaultHeaders,
      ...customHeaders
    },
    signal: abortController.signal,
    ...restConfig
  };
};

// Cancel any pending requests
export const cancelPendingRequests = () => {
  abortController.abort();
  // Create a new abort controller for subsequent requests
  abortController = new AbortController();
};

// Handle common errors
const handleError = (error, defaultMessage = 'An error occurred') => {
  // Don't log if the request was cancelled
  if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
    return null; // Let the calling function handle cancellation
  }
  
  // Don't log 401 errors as they're expected when not logged in
  if (error.response?.status !== 401) {
    console.error(`${defaultMessage}:`, error);
  }
  
  // Return a rejected promise with error details
  return Promise.reject({
    message: error.response?.data?.message || defaultMessage,
    status: error.response?.status,
    data: error.response?.data
  });
};

export const getNotifications = async ({ page = 1, status = 'all', limit = 10 } = {}) => {
  try {
    const { data } = await axios.get(
      '/notifications',
      createConfig({
        params: {
          page,
          status,
          limit
        }
      })
    );
    return data || { data: [], meta: null, settings: {} };
  } catch (error) {
    return handleError(error, 'Error fetching notifications') || { data: [], meta: null, settings: {} };
  }
};

export const markAsRead = async (id) => {
  try {
    const { data } = await axios.patch(
      `/notifications/${id}/read`,
      {},
      createConfig()
    );
    return data;
  } catch (error) {
    return handleError(error, 'Error marking notification as read');
  }
};

export const deleteNotification = async (id) => {
  try {
    await axios.delete(
      `/notifications/${id}`,
      createConfig()
    );
    return true;
  } catch (error) {
    return handleError(error, 'Error deleting notification');
  }
};

export const getUnreadCount = async () => {
  try {
    const { data } = await axios.get(
      '/notifications/unread-count',
      createConfig()
    );
    return data?.count || 0;
  } catch (error) {
    return handleError(error, 'Error fetching unread count') || 0;
  }
};

export const getNotificationSettings = async () => {
  try {
    const { data } = await axios.get(
      '/notifications/settings',
      createConfig()
    );
    return data;
  } catch (error) {
    return handleError(error, 'Error fetching notification settings');
  }
};

export const updateNotificationSettings = async (payload) => {
  try {
    const { data } = await axios.put(
      '/notifications/settings',
      payload,
      createConfig()
    );
    return data;
  } catch (error) {
    return handleError(error, 'Error updating notification settings');
  }
};
