/**
 * UI Components Module
 * 
 * Handles iframe and wrapper div creation and manipulation.
 */

/**
 * Configuration for the iframe source
 */
export interface IFrameSourceConfig {
  unidyUrl: string;
  clientId: string;
  scope: string;
  responseType: string;
  prompt?: string;
  maxAge?: number;
}

/**
 * Configuration for building the iframe
 */
export interface BuildIframeConfig {
  iFrameId: string;
  wrapperDivId: string;
  iFrameSource: (target: string) => string;
  handleMessage: (event: MessageEvent) => void;
  disableWrapperDiv: () => void;
}

/**
 * Result of building the iframe
 */
export interface BuildIframeResult {
  iframe: HTMLIFrameElement;
  wrapperDiv: HTMLDivElement;
}

/**
 * Generates the appropriate URL for the iframe based on the target.
 *
 * @param {IFrameSourceConfig} config - Configuration object
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
}: IFrameSourceConfig, target: string): string {
  switch (target) {
    case "blank":
      return "";
    default: {
      let callback_url = `${document.location.protocol}//${document.location.hostname}`;

      if (window.location.port !== "") {
        callback_url = `${callback_url}:${document.location.port}`;
      }

      // Build the OAuth URL with additional parameters
      let url = `${unidyUrl}/oauth/authorize` +
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
 * @returns {HTMLDivElement} The created wrapper div
 */
export function buildWrapper(wrapperDivId: string, disableWrapperDiv: () => void): HTMLDivElement {
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
 * @param {HTMLDivElement} wrapperDiv - The wrapper div element
 * @returns {void}
 */
export function activateWrapperDiv(wrapperDiv: HTMLDivElement): void {
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
 * @param {HTMLDivElement} wrapperDiv - The wrapper div element
 * @param {HTMLIFrameElement} iframe - The iframe element
 * @returns {void}
 */
export function disableWrapperDiv(wrapperDiv: HTMLDivElement, iframe: HTMLIFrameElement): void {
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
 * @param {BuildIframeConfig} config - Configuration object
 * @param {string} target - The target page to load in the iframe
 * @returns {BuildIframeResult} The created iframe and wrapper div
 */
export function buildIframe({
  iFrameId,
  wrapperDivId,
  iFrameSource,
  handleMessage,
  disableWrapperDiv
}: BuildIframeConfig, target: string): BuildIframeResult {
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