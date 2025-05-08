/**
 * Session Manager Module
 * 
 * Handles session checking and management operations.
 */

/**
 * Starts a timer to periodically check if the user's session is still valid.
 *
 * @param {Object} config - Configuration object
 * @param {number} config.sessionCheckInterval - Interval in seconds between session checks
 * @param {Function} config.checkSession - Function to check session validity
 * @returns {number|null} The session check timer ID or null if disabled
 */
export function startSessionCheckTimer({ sessionCheckInterval, checkSession }) {
  if (!sessionCheckInterval) return null;
  
  // Clear any existing timer
  let sessionCheckTimer = null;
  
  sessionCheckTimer = setInterval(() => {
    checkSession();
  }, sessionCheckInterval * 1000);
  
  return sessionCheckTimer;
}

/**
 * Creates a function to check if the user's session is still valid.
 *
 * @param {Object} config - Configuration object
 * @param {string} config.unidyUrl - The Unidy URL
 * @param {number|null} config.tokenExpiryTime - Token expiry time in milliseconds
 * @param {Function} config.handleError - Error handler function
 * @param {Function} config.emit - Event emitter function
 * @returns {Function} Session check function
 */
export function createSessionCheckFunction({
  unidyUrl,
  tokenExpiryTime,
  handleError,
  emit
}) {
  return function checkSession() {
    try {
      // If token is expired, emit session expired event
      if (tokenExpiryTime && Date.now() > tokenExpiryTime) {
        emit('session:expired', { expiredAt: new Date(tokenExpiryTime) });
        
        // Call session expired listener if defined
        const listeners = window.unidyLoginListeners || {};
        if (listeners.sessionExpired) {
          listeners.sessionExpired({ expiredAt: new Date(tokenExpiryTime) });
        }
        
        return false;
      }
      
      // Check with server if session is still valid
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${unidyUrl}/oauth/userinfo`, true);
      xhr.withCredentials = true;
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          emit('session:valid', { response: xhr.responseText });
          return true;
        } else if (xhr.status === 401) {
          emit('session:invalid', { status: xhr.status });
          
          // Call session expired listener if defined
          const listeners = window.unidyLoginListeners || {};
          if (listeners.sessionExpired) {
            listeners.sessionExpired({ status: xhr.status });
          }
          
          return false;
        }
      };
      
      xhr.onerror = function() {
        handleError('network_error', 'Failed to check session');
        return null;
      };
      
      xhr.send();
      
    } catch (error) {
      handleError('internal_error', 'Error checking session', error);
      return null;
    }
  };
}