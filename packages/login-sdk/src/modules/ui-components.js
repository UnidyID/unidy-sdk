/**
 * UI Components Module
 * 
 * Handles iframe and wrapper div creation and manipulation.
 */

/**
 * Generates the appropriate URL for the iframe based on the target.
 *
 * @param {Object} config - Configuration object
 * @param {string} config.unidyUrl - The Unidy URL
 * @param {string} config.clientId - The client ID for OAuth
 * @param {string} config.scope - The OAuth scope
 * @param {string} config.responseType - The OAuth response type
 * @param {string|undefined} config.prompt - The OAuth prompt parameter
 * @param {number|undefined} config.maxAge - The OAuth max_age parameter
 * @param {string} target - The target page to load ('blank' or 'login')
 * @returns {string} The URL to load in the iframe
 */
export function iFrameSource({
  unidyUrl,
  clientId,
  scope,
  responseType,
  prompt,
  maxAge
}, target) {
  switch (target) {
    case "blank":
      return "";
    default: {
      let callback_url = `${document.location.protocol}//${document.location.hostname}`;

      if (window.location.port !== "") {
        callback_url = `${callback_url}:${document.location.port}`;
      }

      // Build the OAuth URL with additional parameters
      var url = `${unidyUrl}/oauth/authorize` +
        `?client_id=${clientId}` +
        `&scope=${scope}` +
        `&response_type=${responseType}` +
        `&redirect_uri=${unidyUrl}/oauth/iframe?callback_url=${encodeURI(callback_url)}`;
      
      // Always add prompt=login to force authentication
      url += `&prompt=${prompt || 'login'}`;
      
      // Always add max_age=0 to force re-authentication
      url += `&max_age=${maxAge !== undefined ? maxAge : 0}`;
      
      // Always add a random nonce to prevent caching
      url += `&nonce=${Math.random().toString(36).substring(2, 15)}`;
      
      // Always add a timestamp to prevent caching
      url += `&t=${new Date().getTime()}`;
      
      return url;
    }
  }
}

/**
 * Creates the wrapper div that contains the authentication iframe.
 * Sets up click event listener to close the iframe when clicking outside.
 *
 * @param {string} wrapperDivId - The ID to assign to the wrapper div
 * @param {Function} disableWrapperDiv - Function to disable the wrapper div
 * @returns {HTMLElement} The created wrapper div
 */
export function buildWrapper(wrapperDivId, disableWrapperDiv) {
  const wrapperDiv = document.createElement("div");
  wrapperDiv.setAttribute("id", wrapperDivId);

  wrapperDiv.addEventListener("click", () => {
    disableWrapperDiv();
  });
  
  return wrapperDiv;
}

/**
 * Makes the wrapper div visible and adds the active class with a small delay
 * to ensure CSS transitions work properly.
 *
 * @param {HTMLElement} wrapperDiv - The wrapper div element
 * @returns {void}
 */
export function activateWrapperDiv(wrapperDiv) {
  // wrapperDiv.style.display = "block"; // This line is removed

  setTimeout(() => {
    // Ensure the wrapper is displayed before adding 'active' for transition
    // The .active class itself will set display: flex
    if (getComputedStyle(wrapperDiv).display === 'none') {
      // Temporarily set to flex to allow measurement if needed,
      // though .active class should handle final display.
      // Forcing a reflow might be necessary in some edge cases for transitions
      // on 'display' but here opacity is the main transition.
      // The main point is to not have 'display: block' override 'display: flex' from the class.
    }
    wrapperDiv.classList.add("active");
  }, 1); // timeout required to make transition work
}

/**
 * Hides the wrapper div by removing the active class and setting display to none
 * after the CSS transition completes.
 *
 * @param {HTMLElement} wrapperDiv - The wrapper div element
 * @param {HTMLElement} iframe - The iframe element
 * @returns {void}
 */
export function disableWrapperDiv(wrapperDiv, iframe) {
  wrapperDiv.classList.remove("active");

  setTimeout(
    () => {
      wrapperDiv.style.display = "none";
    },
    parseFloat(window.getComputedStyle(iframe).transitionDuration) * 1000,
  );
}

/**
 * Creates and appends the authentication iframe to the DOM.
 * Sets up the message event listener for iframe communication.
 *
 * @param {Object} config - Configuration object
 * @param {string} config.iFrameId - The ID to assign to the iframe
 * @param {string} config.wrapperDivId - The ID to assign to the wrapper div
 * @param {Function} config.iFrameSource - Function to generate iframe source URL
 * @param {Function} config.handleMessage - Function to handle iframe messages
 * @param {Function} config.disableWrapperDiv - Function to disable the wrapper div
 * @param {string} target - The target page to load in the iframe
 * @returns {Object} The created iframe and wrapper div
 */
export function buildIframe({
  iFrameId,
  wrapperDivId,
  iFrameSource,
  handleMessage,
  disableWrapperDiv
}, target) {
  const body = document.getElementsByTagName("body")[0];
  const wrapperDiv = buildWrapper(wrapperDivId, disableWrapperDiv);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("id", iFrameId);
  iframe.setAttribute("src", iFrameSource(target));

  wrapperDiv.appendChild(iframe);
  body.appendChild(wrapperDiv);

  window.addEventListener("message", handleMessage, false);
  
  return { iframe, wrapperDiv };
}
