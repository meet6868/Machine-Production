/**
 * Authentication Helper Functions
 * Manages JWT token operations and user authentication state
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Decode JWT token payload
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  // Check if token expiration time is in the past
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Get time until token expires
 * @param {string} token - JWT token
 * @returns {number} Seconds until expiration, or 0 if expired
 */
export const getTokenExpiryTime = (token) => {
  if (!token) return 0;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;
  
  const currentTime = Date.now() / 1000;
  const timeRemaining = decoded.exp - currentTime;
  
  return timeRemaining > 0 ? timeRemaining : 0;
};

/**
 * Get user ID from token
 * @param {string} token - JWT token
 * @returns {string|null} User ID or null
 */
export const getUserIdFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded?.id || null;
};

/**
 * Store token in localStorage
 * @param {string} token - JWT token
 */
export const saveToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Get token from localStorage
 * @returns {string|null} Token or null
 */
export const getStoredToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Remove token from localStorage
 */
export const removeStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Store user data in localStorage
 * @param {object} user - User data object
 */
export const saveUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

/**
 * Get user data from localStorage
 * @returns {object|null} User data or null
 */
export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Remove user data from localStorage
 */
export const removeStoredUser = () => {
  localStorage.removeItem(USER_KEY);
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  removeStoredToken();
  removeStoredUser();
};

/**
 * Check if user is authenticated with valid token
 * @returns {boolean} True if authenticated
 */
export const isUserAuthenticated = () => {
  const token = getStoredToken();
  if (!token) return false;
  
  return !isTokenExpired(token);
};

/**
 * Get authentication headers for API requests
 * @returns {object} Headers object with Authorization
 */
export const getAuthHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Format token expiry time in human-readable format
 * @param {string} token - JWT token
 * @returns {string} Formatted time remaining
 */
export const formatTokenExpiry = (token) => {
  const seconds = getTokenExpiryTime(token);
  
  if (seconds <= 0) return 'Expired';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default {
  decodeToken,
  isTokenExpired,
  getTokenExpiryTime,
  getUserIdFromToken,
  saveToken,
  getStoredToken,
  removeStoredToken,
  saveUser,
  getStoredUser,
  removeStoredUser,
  clearAuthData,
  isUserAuthenticated,
  getAuthHeaders,
  formatTokenExpiry,
};
