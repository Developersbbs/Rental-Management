/**
 * Authentication service for handling token management and auth status
 */

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated, false otherwise
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Simple check if token exists and is not expired
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    return payload.exp > Date.now() / 1000;
  } catch (e) {
    return false;
  }
};

/**
 * Store authentication token
 * @param {string} token - JWT token to store
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

/**
 * Get stored authentication token
 * @returns {string|null} The stored token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Clear authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem('token');
};

/**
 * Check if token is about to expire (within 5 minutes)
 * @returns {boolean} True if token is about to expire
 */
export const isTokenExpiringSoon = () => {
  const token = getAuthToken();
  if (!token) return true;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    const expiresIn = payload.exp - (Date.now() / 1000);
    return expiresIn < 300; // 5 minutes
  } catch (e) {
    return true;
  }
};
