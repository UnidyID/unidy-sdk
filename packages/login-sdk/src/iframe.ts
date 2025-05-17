/**
 * Message type constant for iframe communication
 */
export const MESSAGE_TYPE = 'unidy-iframe-resize';

/**
 * Interface for the iframe utility
 */
export interface IframeUtility {
  emitSize: () => void;
}

/**
 * Creates an iframe utility that communicates with the parent window.
 *
 * @param {string} url - The parent window URL for postMessage communication
 * @returns {IframeUtility} An object with methods to control the iframe behavior
 */
export default function(url: string): IframeUtility {
  /**
   * Publishes the current body height to the parent window.
   *
   * @returns {void}
   */
  function publishHeight(): void {
    const bodyHeight = getBodyHeight();
    parent.postMessage({ type: MESSAGE_TYPE, height: bodyHeight }, url);
  }

  /**
   * Calculates the body height with additional padding for the shadow border.
   *
   * @returns {number} The body height in pixels with added padding
   */
  function getBodyHeight(): number {
    // add pixel for shadow border to not display scrollbar
    return document.body.offsetHeight + 16;
  }

  return {
    /**
     * Starts periodically emitting the iframe size to the parent window.
     *
     * @returns {void}
     */
    emitSize: (): void => {
      window.setInterval(publishHeight, 300);
    },
  };
}