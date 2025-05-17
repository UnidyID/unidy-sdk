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
import { createErrorHandler, ErrorData } from './modules/error-handler';
import mitt, { Emitter } from 'mitt';

/**
 * Configuration options for the Unidy Login SDK
 */
export interface UnidyLoginConfig {
  clientId: string;
  scope?: string;
  responseType?: string;
  prompt?: string;
  maxAge?: number;
}

/**
 * Message data structure for iframe communication
 */
export interface MessageData {
  action: string;
  idToken?: string;
  [key: string]: any;
}

/**
 * Unidy Login SDK interface
 */
export interface UnidyLoginSDK {
  init(): UnidyLoginSDK;
  show(options?: { target?: string }): UnidyLoginSDK;
  close(): UnidyLoginSDK;
  onAuth(authHandler: (idToken: string) => void): UnidyLoginSDK;
  isAuthenticated(): boolean;
  getIdToken(): string | null;
  on(type: string, handler: (data: any) => void): void;
  off(type: string, handler: (data: any) => void): void;
  emit(type: string, data: any): void;
}

/**
 * Creates a new instance of the Unidy Login SDK
 * 
 * @param unidyUrl - The URL of the Unidy authentication server
 * @param config - Configuration options for the SDK
 * @returns An instance of the Unidy Login SDK
 */
export default function(
  unidyUrl: string, 
  {
    clientId,
    scope = DEFAULTS.SCOPE,
    responseType = DEFAULTS.RESPONSE_TYPE,
    prompt,
    maxAge
  }: UnidyLoginConfig
): UnidyLoginSDK {
  // Normalize the URL by removing trailing slashes
  unidyUrl = unidyUrl.replace(/\/+$/, '');
  
  const body = document.getElementsByTagName("body")[0];
  const wrapperDivId = DOM_IDS.WRAPPER_DIV;
  const iFrameId = DOM_IDS.IFRAME;

  // State variables
  let iframe: HTMLIFrameElement;
  let wrapperDiv: HTMLDivElement;
  let isInitialized = false;
  let currentIdToken: string | null = null; // Store token in memory instead of sessionStorage
  
  // Event listeners
  const listeners: {
    auth: ((data: MessageData) => void) | null;
    error: ((data: ErrorData) => void) | null;
    [key: string]: ((data: any) => void) | null;
  } = {
    auth: null,
    error: null
  };
  
  // Create event system using Mitt directly
  const emitter: Emitter<any> = mitt();
  
  // Create error handler
  const handleError = createErrorHandler(emitter.emit.bind(emitter));
  
  // Store listeners globally for access by other modules
  (window as any).unidyLoginListeners = listeners;
  
  // Create iframe source function with config
  const getIframeSource = (target: string): string => iFrameSource({
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
  const handleMessage = function(event: MessageEvent): void {
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
      handleError('internal_error', 'Error handling message', error instanceof Error ? error : new Error(String(error)));
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
  function initFrame(): void {
    if (currentIdToken) {
      buildIframeWithConfig("blank");
      if (listeners.auth) {
        listeners.auth({ action: 'auth', idToken: currentIdToken });
      }
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
  function buildIframeWithConfig(target: string): void {
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
  function activateWrapperDivWithConfig(): void {
    activateWrapperDiv(wrapperDiv);
  }
  
  /**
   * Wrapper for disableWrapperDiv that includes wrapperDiv and iframe.
   *
   * @returns {void}
   */
  function disableWrapperDivWithConfig(): void {
    disableWrapperDiv(wrapperDiv, iframe);
  }

  return {
    /**
     * Initializes the Unidy Login SDK.
     * Creates the necessary iframe and sets up event listeners.
     *
     * @returns {UnidyLoginSDK} The SDK instance for method chaining
     */
    init: function(): UnidyLoginSDK {
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
     * @returns {UnidyLoginSDK} The SDK instance for method chaining
     */
    show: function({ target } = { target: "login" }): UnidyLoginSDK {
      if (!isInitialized) {
        this.init();
      }
      
      if (typeof wrapperDiv !== "undefined") {
        const targetStr = target || "login";
        if (getIframeSource(targetStr) !== iframe.getAttribute("src")) {
          iframe.setAttribute("src", getIframeSource(targetStr));

          iframe.addEventListener("load", () => {
            activateWrapperDivWithConfig();
          });
        } else {
          activateWrapperDivWithConfig();
        }
        return this;
      }

      buildIframeWithConfig(target || "login");

      iframe.addEventListener("load", () => {
        activateWrapperDivWithConfig();
      });
      
      return this;
    },
    
    /**
     * Closes the authentication iframe by hiding the wrapper div.
     *
     * @returns {UnidyLoginSDK} The SDK instance for method chaining
     */
    close: function(): UnidyLoginSDK {
      iframe = document.getElementById(iFrameId) as HTMLIFrameElement;
      wrapperDiv = document.getElementById(wrapperDivId) as HTMLDivElement;

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
     * @returns {UnidyLoginSDK} The SDK instance for method chaining
     */
    onAuth: function(authHandler: (idToken: string) => void): UnidyLoginSDK {
      if (typeof authHandler !== 'function') {
        return this;
      }
      
      listeners.auth = ({ idToken }: MessageData): void => {
        try {
          if (idToken) {
            currentIdToken = idToken; // Store token in memory instead of sessionStorage
            authHandler(idToken);
            disableWrapperDivWithConfig();
          }
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
    isAuthenticated: function(): boolean {
      return !!currentIdToken;
    },
    
    /**
     * Retrieves the current ID token from memory.
     *
     * @returns {string|null} The current ID token or null if not available
     */
    getIdToken: function(): string | null {
      return currentIdToken;
    },
    
    // Expose event system methods
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    emit: emitter.emit.bind(emitter)
  };
}