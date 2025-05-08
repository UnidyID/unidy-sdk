/**
 * Event System Module
 * 
 * Provides event subscription, emission, and handling functionality.
 */

/**
 * Creates an event system with on, off, and emit methods.
 *
 * @returns {Object} Event system methods
 */
export function createEventSystem() {
  // Event storage
  const events = {};
  
  /**
   * Subscribes a callback function to a named event.
   *
   * @param {string} eventName - The name of the event to subscribe to
   * @param {Function} callback - The callback function to execute when the event is emitted
   * @returns {void}
   */
  function on(eventName, callback) {
    if (!events[eventName]) {
      events[eventName] = [];
    }
    events[eventName].push(callback);
  }
  
  /**
   * Unsubscribes a callback function from a named event.
   *
   * @param {string} eventName - The name of the event to unsubscribe from
   * @param {Function} callback - The callback function to remove from the event
   * @returns {void}
   */
  function off(eventName, callback) {
    if (!events[eventName]) return;
    events[eventName] = events[eventName].filter(cb => cb !== callback);
  }
  
  /**
   * Emits an event with the provided data to all subscribed callbacks.
   *
   * @param {string} eventName - The name of the event to emit
   * @param {*} data - The data to pass to the callback functions
   * @returns {void}
   */
  function emit(eventName, data) {
    if (!events[eventName]) return;
    events[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${eventName} event handler:`, error);
      }
    });
  }
  
  return {
    on,
    off,
    emit
  };
}

/**
 * Creates a message handler function for iframe communication.
 *
 * @param {Object} config - Configuration object
 * @param {string} config.unidyUrl - The Unidy URL
 * @param {Object} config.listeners - Event listeners object
 * @param {Function} config.emit - Event emitter function
 * @param {Function} config.handleError - Error handler function
 * @returns {Function} Message handler function
 */
export function createMessageHandler({
  unidyUrl,
  listeners,
  emit,
  handleError
}) {
  return function handleMessage(event) {
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

      const action = event.data.action;
      
      // Emit event for this action
      emit(`action:${action}`, event.data);
      
      // Check if there's a listener for this action
      const listener = listeners[action];
      if (!listener) {
        return;
      }
      
      // Call the listener with the message data
      listener(event.data);
    } catch (error) {
      handleError('internal_error', 'Error handling message', error);
    }
  };
}