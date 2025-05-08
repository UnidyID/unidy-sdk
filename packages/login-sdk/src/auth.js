/**
 * Unidy Login SDK
 *
 * A lightweight SDK for handling authentication via iframe in web applications.
 *
 * @version 1.1.0
 * @author Unidy Team
 */

import { DOM_IDS, DEFAULTS, LOGOUT_ENDPOINTS } from './modules/constants';
import { parseToken, startRefreshTimer, createRefreshTokenFunction } from './modules/token-manager';
import { startSessionCheckTimer, createSessionCheckFunction } from './modules/session-manager';
import { iFrameSource, buildWrapper, activateWrapperDiv, disableWrapperDiv, buildIframe } from './modules/ui-components';
import { createEventSystem, createMessageHandler } from './modules/event-system';
import { ErrorTypes, createErrorHandler } from './modules/error-handler';

export default function (unidyUrl, {
  clientId,
  scope = DEFAULTS.SCOPE,
  responseType = DEFAULTS.RESPONSE_TYPE,
  prompt,
  maxAge,
  autoRefresh = DEFAULTS.AUTO_REFRESH,
  refreshInterval = DEFAULTS.REFRESH_INTERVAL,
  sessionCheckInterval = DEFAULTS.SESSION_CHECK_INTERVAL
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
  let refreshTimer = null;
  let sessionCheckTimer = null;
  let tokenExpiryTime = null;
  
  // Event listeners
  const listeners = {
    auth: null,
    logout: null,
    error: null,
    tokenRefresh: null,
    sessionExpired: null
  };
  
  // Create event system
  const { on, off, emit } = createEventSystem();
  
  // Create error handler
  const handleError = createErrorHandler(emit);
  
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
  
  // Create message handler
  const handleMessage = createMessageHandler({
    unidyUrl,
    listeners,
    emit,
    handleError
  });
  
  // Create session check function
  const checkSession = createSessionCheckFunction({
    unidyUrl,
    tokenExpiryTime,
    handleError,
    emit
  });
  
  // Create refresh token function
  const refreshToken = createRefreshTokenFunction({
    unidyUrl,
    iFrameSource: getIframeSource,
    handleError,
    emit,
    startRefreshTimer: (token) => {
      const result = startRefreshTimer(token, {
        autoRefresh,
        refreshInterval,
        refreshToken,
        startSessionCheckTimer: () => {
          sessionCheckTimer = startSessionCheckTimer({
            sessionCheckInterval,
            checkSession
          });
        },
        handleError,
        emit
      });
      
      tokenExpiryTime = result.tokenExpiryTime;
      refreshTimer = result.refreshTimer;
    }
  });
  
  /**
   * Initializes the authentication iframe based on session state.
   * If an ID token exists in session storage, builds a blank iframe and triggers the auth event.
   * Otherwise, builds a login iframe.
   *
   * @returns {void}
   */
  function initFrame() {
    if (sessionStorage.idToken) {
      buildIframeWithConfig("blank");
      listeners.auth({ idToken: sessionStorage.idToken });
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
     * Sets the logout event handler.
     * This handler is called when a user logs out.
     *
     * @param {Function} logoutHandler - The function to call on logout
     * @param {Object} logoutHandler.data - The logout event data
     * @returns {Object} The SDK instance for method chaining
     */
    onLogout: function(logoutHandler) {
      if (typeof logoutHandler !== 'function') {
        return this;
      }
      
      listeners.logout = ({ close }) => {
        try {
          // Clear all session storage
          sessionStorage.clear();
          
          // Clear cookies thoroughly
          var cookies = document.cookie.split(";");
          
          // Get the domain parts
          var domain = window.location.hostname;
          var domainParts = domain.split('.');
          var domains = [];
          
          // Add all possible domain variations
          domains.push(domain);
          domains.push('.' + domain);
          
          for (var i = 1; i < domainParts.length; i++) {
            var d = domainParts.slice(i).join('.');
            domains.push(d);
            domains.push('.' + d);
          }
          
          domains.push('');
          
          // Get all paths
          var paths = ['/', ''];
          
          // Clear cookies for all domain and path combinations
          for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            var eqPos = cookie.indexOf("=");
            var name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            
            if (name) { // Only process cookies with non-empty names
              // Try all domain and path combinations
              for (var j = 0; j < domains.length; j++) {
                for (var k = 0; k < paths.length; k++) {
                  var domainPart = domains[j] ? '; domain=' + domains[j] : '';
                  var pathPart = '; path=' + paths[k];
                  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + domainPart + pathPart;
                }
              }
            }
          }
          
          // Call the logout handler
          logoutHandler();
          
          if (close) {
            disableWrapperDivWithConfig();
          }
          
          // Try multiple server-side logout endpoints
          LOGOUT_ENDPOINTS.forEach(function(endpoint) {
            var img = new Image();
            img.src = unidyUrl + endpoint + '?client_id=' + clientId + '&redirect_uri=' + encodeURIComponent(window.location.href) + '&t=' + new Date().getTime();
          });
          
          // Also try a direct XHR request with credentials
          try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', unidyUrl + '/oauth/logout', true);
            xhr.withCredentials = true;
            xhr.send();
          } catch (e) {
            // Silently handle errors
          }
        } catch (error) {
          // Silently handle errors
        }
      };
      
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
          sessionStorage.setItem("idToken", idToken);
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
      return !!sessionStorage.getItem('idToken');
    },
    
    /**
     * Retrieves the current ID token from session storage.
     *
     * @returns {string|null} The current ID token or null if not available
     */
    getIdToken: function() {
      return sessionStorage.getItem('idToken');
    },
    
    // Expose event system
    on,
    off,
    emit
  };
}
