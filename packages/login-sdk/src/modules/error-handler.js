/**
 * Error Handler Module
 * 
 * Provides error handling functionality for the SDK.
 */

/**
 * Error types used throughout the SDK.
 */
export const ErrorTypes = {
  AUTHENTICATION: 'authentication_error',
  NETWORK: 'network_error',
  CONFIGURATION: 'configuration_error',
  SESSION: 'session_error',
  INTERNAL: 'internal_error'
};

/**
 * Creates an error handler function.
 *
 * @param {Function} emit - Event emitter function
 * @returns {Function} Error handler function
 */
export function createErrorHandler(emit) {
  /**
   * Handles errors by creating a standardized error object and emitting an error event.
   *
   * @param {string} type - The type of error from ErrorTypes
   * @param {string} message - The error message
   * @param {Error|null} originalError - The original error object if available
   * @returns {void}
   */
  return function handleError(type, message, originalError = null) {
    const errorData = {
      type,
      message,
      originalError,
      timestamp: new Date()
    };
    
    emit('error', errorData);
    
    // Call error listener if defined
    const listeners = window.unidyLoginListeners || {};
    if (listeners.error) {
      listeners.error(errorData);
    }
    
    // Log error to console for debugging
    console.error(`[Unidy Login SDK] ${type}: ${message}`, originalError);
  };
}