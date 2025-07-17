export const Utils = {
  /**
   * Extracts a parameter value from the URL hash fragment
   * @param windowHref - The current window href
   * @param paramName - The name of the parameter to extract
   * @returns The parameter value or null if not found
   */
  extractHashUrlParam(windowHref: string, paramName: string): string | null {
    const url = new URL(windowHref);
    const hashParams = new URLSearchParams(url.hash.substring(1));
    return hashParams.get(paramName);
  },

  /**
   * Detects if the current browser prevents access to third-party cookies
   * @returns True if the browser prevents third-party cookie access
   */
  browserLimitsThirdPartyCookies(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafari =
      userAgent.includes("safari") &&
      // will match chrome and chromium browsers
      !userAgent.includes("chrom") &&
      !userAgent.includes("android");
    return isSafari;
  },
};
