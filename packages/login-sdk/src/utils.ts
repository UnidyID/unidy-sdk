export const Utils = {
  /**
   * Extracts a parameter value from the URL hash fragment
   * @param windowHref - The current window href
   * @param paramName - The name of the parameter to extract
   * @returns The parameter value or null if not found
   */
  extractHashUrlParam(windowHref: string, paramName:string): string | null {
    const url = new URL(windowHref);
    const hashParams = new URLSearchParams(url.hash.substring(1));
    return hashParams.get(paramName);
  },

  /**
   * Detects if the current browser is Safari
   * @returns True if the browser is Safari, false otherwise
   */
  isSafari(): boolean {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  },
};
