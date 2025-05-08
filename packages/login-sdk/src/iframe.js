import { MESSAGE_TYPE } from "../application/iframe";

/**
 * Creates an iframe utility that communicates with the parent window.
 *
 * @param {string} url - The parent window URL for postMessage communication
 * @returns {Object} An object with methods to control the iframe behavior
 */
export default function (url) {
  /**
   * Publishes the current body height to the parent window.
   *
   * @returns {void}
   */
  function publishHeight() {
    const bodyHeight = getBodyHeight();
    parent.postMessage({ type: MESSAGE_TYPE, height: bodyHeight }, url);
  }

  /**
   * Calculates the body height with additional padding for the shadow border.
   *
   * @returns {number} The body height in pixels with added padding
   */
  function getBodyHeight() {
    // add pixel for shadow border to not display scrollbar
    return document.body.offsetHeight + 16;
  }

  return {
    /**
     * Starts periodically emitting the iframe size to the parent window.
     *
     * @returns {void}
     */
    emitSize: () => {
      window.setInterval(publishHeight, 300);
    },
  };
}