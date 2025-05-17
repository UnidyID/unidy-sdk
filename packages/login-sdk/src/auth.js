/**
 * Unidy Login SDK
 *
 * A lightweight SDK for handling authentication via iframe in web applications.
 *
 * @version 1.1.0
 * @author Unidy Team
 */

import { DOM_IDS, DEFAULTS } from './modules/constants';
import { iFrameSource, activateWrapperDiv, disableWrapperDiv, buildIframe } from './modules/ui-components';
import { createErrorHandler } from './modules/error-handler';
import mitt from 'mitt';

export default function (unidyUrl, {
  clientId,
  scope = DEFAULTS.SCOPE,
  responseType = DEFAULTS.RESPONSE_TYPE,
  prompt,
  maxAge
}) {
  // Normalize the URL by removing trailing slashes
  unidyUrl = unidyUrl.replace(/\/+$/, '');
  
  const body = document.getElementsByTagName("body")[0];
  const wrapperDivId = DOM_IDS.WRAPPER_DIV;
  const iFrameId = DOM_IDS.IFRAME;

  // State variables
  let iframe;
  let wrapperDiv;
  let isInitialized = false;
  let currentIdToken = null; // Store token in memory instead of sessionStorage
  
  // Event listeners
  const listeners = {
    auth: null,
    error: null
  };
  
  // Create event system using Mitt directly
  const emitter = mitt();
  
  // Create error handler
  const handleError = createErrorHandler(emitter.emit.bind(emitter));
  
  // Store listeners globally for access by other modules
  window.unidyLoginListeners = listeners;
  
  // Create iframe source function with config
  const getIframeSource = (target) => iFrameSource({
    unidyUrl,
    clientId,
    scope,
    responseType,
    prompt,
    maxAge
  }, target);
  
  /**
   * Creates a message handler function for iframe communication.
   *
   * @param {MessageEvent} event - The message event from the iframe
   * @returns {void}
   */
  const handleMessage = function(event) {
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
      try {
        emitter.emit(`action:${action}`, event.data);
      } catch (error) {
        console.error(`Error in action:${action} event handler:`, error);
      }
      
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
  
  // No session check or refresh token functions
  
  /**
   * Initializes the authentication iframe based on authentication state.
   * If an ID token exists in memory, builds a blank iframe and triggers the auth event.
   * Otherwise, builds a login iframe.
   *
   * @returns {void}
   */
  function initFrame() {
    if (currentIdToken) {
      buildIframeWithConfig("blank");
      listeners.auth({ idToken: currentIdToken });
    } else {
      buildIframeWithConfig("login");
    }
  }
  
  /**
   * Wrapper for buildIframe that includes configuration.
   *
   * @param {string} target - The target page to load in the iframe
   * @returns {void}
   */
  function buildIframeWithConfig(target) {
    const result = buildIframe({
      iFrameId,
      wrapperDivId,
      iFrameSource: getIframeSource,
      handleMessage,
      disableWrapperDiv: () => disableWrapperDiv(wrapperDiv, iframe)
    }, target);
    
    iframe = result.iframe;
    wrapperDiv = result.wrapperDiv;
  }
  
  /**
   * Wrapper for activateWrapperDiv that includes wrapperDiv.
   *
   * @returns {void}
   */
  function activateWrapperDivWithConfig() {
    activateWrapperDiv(wrapperDiv);
  }
  
  /**
   * Wrapper for disableWrapperDiv that includes wrapperDiv and iframe.
   *
   * @returns {void}
   */
  function disableWrapperDivWithConfig() {
    disableWrapperDiv(wrapperDiv, iframe);
  }

  return {
    /**
     * Initializes the Unidy Login SDK.
     * Creates the necessary iframe and sets up event listeners.
     *
     * @returns {Object} The SDK instance for method chaining
     */
    init: function() {
      if (isInitialized) {
        return this;
      }
      
      isInitialized = true;
      initFrame();
      return this;
    },
    
    /**
     * Shows the authentication iframe with the specified target page.
     *
     * @param {Object} options - The options object
     * @param {string} [options.target="login"] - The target page to show ('login')
     * @returns {Object} The SDK instance for method chaining
     */
    show: function({ target } = { target: "login" }) {
      if (!isInitialized) {
        this.init();
      }
      
      if (typeof wrapperDiv !== "undefined") {
        if (getIframeSource(target) !== iframe.getAttribute("src")) {
          iframe.setAttribute("src", getIframeSource(target));

          iframe.addEventListener("load", () => {
            activateWrapperDivWithConfig();
          });
        } else {
          activateWrapperDivWithConfig();
        }
        return this;
      }

      buildIframeWithConfig(target);

      iframe.addEventListener("load", () => {
        activateWrapperDivWithConfig();
      });
      
      return this;
    },
    
    /**
     * Closes the authentication iframe by hiding the wrapper div.
     *
     * @returns {Object} The SDK instance for method chaining
     */
    close: function() {
      iframe = document.getElementById(iFrameId);
      wrapperDiv = document.getElementById(wrapperDivId);

      if (iframe && wrapperDiv) {
        disableWrapperDivWithConfig();
      }
      
      return this;
    },
    
    /**
     * Sets the authentication event handler.
     * This handler is called when a user successfully authenticates.
     *
     * @param {Function} authHandler - The function to call on successful authentication
     * @param {string} authHandler.idToken - The ID token received after successful authentication
     * @returns {Object} The SDK instance for method chaining
     */
    onAuth: function(authHandler) {
      if (typeof authHandler !== 'function') {
        return this;
      }
      
      listeners.auth = ({ idToken }) => {
        try {
          currentIdToken = idToken; // Store token in memory instead of sessionStorage
          authHandler(idToken);
          disableWrapperDivWithConfig();
        } catch (error) {
          // Silently handle errors
        }
      };
      
      return this;
    },
    
    /**
     * Checks if the user is currently authenticated.
     *
     * @returns {boolean} True if the user is authenticated (has an ID token), false otherwise
     */
    isAuthenticated: function() {
      return !!currentIdToken;
    },
    
    /**
     * Retrieves the current ID token from memory.
     *
     * @returns {string|null} The current ID token or null if not available
     */
    getIdToken: function() {
      return currentIdToken;
    },
    
    // Expose event system methods
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    emit: emitter.emit.bind(emitter)
  };
}
