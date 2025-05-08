/**
 * Token Manager Module
 * 
 * Handles token parsing, validation, and refresh operations.
 */

/**
 * Parses a JWT token and extracts its payload.
 *
 * @param {string} token - The JWT token to parse
 * @param {Function} handleError - Error handler function
 * @returns {Object|null} The decoded token payload or null if parsing fails
 */
export function parseToken(token, handleError) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    handleError('internal_error', 'Failed to parse token', error);
    return null;
  }
}

/**
 * Starts a timer to refresh the authentication token before it expires.
 *
 * @param {string} token - The JWT token to monitor for expiration
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoRefresh - Whether to automatically refresh the token
 * @param {number} options.refreshInterval - Seconds before expiry to refresh token
 * @param {Function} options.refreshToken - Function to refresh the token
 * @param {Function} options.startSessionCheckTimer - Function to start session check timer
 * @param {Function} options.handleError - Error handler function
 * @param {Function} options.emit - Event emitter function
 * @returns {Object} Token expiry time and refresh timer
 */
export function startRefreshTimer(token, {
  autoRefresh,
  refreshInterval,
  refreshToken,
  startSessionCheckTimer,
  handleError,
  emit
}) {
  if (!autoRefresh) return { tokenExpiryTime: null, refreshTimer: null };
  
  let refreshTimer = null;
  let tokenExpiryTime = null;
  
  try {
    const payload = parseToken(token, handleError);
    if (!payload || !payload.exp) {
      handleError('internal_error', 'Token does not contain expiry time');
      return { tokenExpiryTime, refreshTimer };
    }
    
    tokenExpiryTime = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = tokenExpiryTime - now;
    
    // Refresh token when it's close to expiry (refreshInterval seconds before)
    const refreshTime = Math.max(timeUntilExpiry - (refreshInterval * 1000), 0);
    
    refreshTimer = setTimeout(() => {
      emit('token:refresh:start', { timeUntilExpiry });
      refreshToken();
    }, refreshTime);
    
    // Also start session check timer
    startSessionCheckTimer();
    
  } catch (error) {
    handleError('internal_error', 'Failed to start refresh timer', error);
  }
  
  return { tokenExpiryTime, refreshTimer };
}

/**
 * Creates a function to refresh the authentication token.
 *
 * @param {Object} config - Configuration object
 * @param {string} config.unidyUrl - The Unidy URL
 * @param {Function} config.iFrameSource - Function to generate iframe source URL
 * @param {Function} config.handleError - Error handler function
 * @param {Function} config.emit - Event emitter function
 * @param {Function} config.startRefreshTimer - Function to start refresh timer
 * @returns {Function} Token refresh function
 */
export function createRefreshTokenFunction({
  unidyUrl,
  iFrameSource,
  handleError,
  emit,
  startRefreshTimer
}) {
  return function refreshToken() {
    try {
      // Create a hidden iframe for token refresh
      const refreshFrame = document.createElement('iframe');
      refreshFrame.style.display = 'none';
      refreshFrame.setAttribute('src', iFrameSource('refresh'));
      
      // Listen for message from refresh iframe
      const refreshListener = function(event) {
        try {
          // Make the origin check more flexible by removing trailing slashes
          const normalizedUnidyUrl = unidyUrl.replace(/\/+$/, '');
          const normalizedOrigin = event.origin.replace(/\/+$/, '');
          
          // Check if the message is from the expected origin
          if (normalizedOrigin !== normalizedUnidyUrl) {
            return;
          }
          
          // Validate the message data
          if (!event.data || typeof event.data !== 'object') {
            return;
          }
          
          if (event.data.action === 'auth') {
            // Token refreshed successfully
            const idToken = event.data.idToken;
            sessionStorage.setItem('idToken', idToken);
            
            emit('token:refreshed', { idToken });
            
            // Call token refresh listener if defined
            const listeners = window.unidyLoginListeners || {};
            if (listeners.tokenRefresh) {
              listeners.tokenRefresh({ idToken });
            }
            
            // Start a new refresh timer
            startRefreshTimer(idToken);
            
            // Clean up
            window.removeEventListener('message', refreshListener);
            document.body.removeChild(refreshFrame);
          }
        } catch (error) {
          handleError('internal_error', 'Error in refresh listener', error);
        }
      };
      
      window.addEventListener('message', refreshListener);
      
      // Add the iframe to the document
      document.body.appendChild(refreshFrame);
      
      // Set a timeout to remove the iframe if no response
      setTimeout(() => {
        if (document.body.contains(refreshFrame)) {
          window.removeEventListener('message', refreshListener);
          document.body.removeChild(refreshFrame);
          handleError('network_error', 'Token refresh timed out');
        }
      }, 30000); // 30 seconds timeout
      
    } catch (error) {
      handleError('internal_error', 'Failed to refresh token', error);
    }
  };
}