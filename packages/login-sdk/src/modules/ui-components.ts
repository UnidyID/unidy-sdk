export interface IFrameSourceConfig {
  unidyUrl: string;
  clientId: string;
  scope: string;
  responseType: string;
  prompt?: string;
  maxAge?: number;
}

export interface BuildIframeConfig {
  iFrameId: string;
  wrapperDivId: string;
  iFrameSource: (target: string) => string;
  handleMessage: (event: MessageEvent) => void;
  disableWrapperDiv: () => void;
}

export interface BuildIframeResult {
  iframe: HTMLIFrameElement;
  wrapperDiv: HTMLDivElement;
}

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

      let url = `${unidyUrl}/oauth/authorize` +
        `?client_id=${clientId}` +
        `&scope=${scope}` +
        `&response_type=${responseType}` +
        `&redirect_uri=${unidyUrl}/oauth/iframe?callback_url=${encodeURI(callback_url)}`;
      
      url += `&prompt=${prompt || 'login'}`;
      
      url += `&max_age=${maxAge !== undefined ? maxAge : 0}`;
      
      url += `&nonce=${Math.random().toString(36).substring(2, 15)}`;
      
      url += `&t=${new Date().getTime()}`;
      
      return url;
    }
  }
}

export function buildWrapper(wrapperDivId: string, disableWrapperDiv: () => void): HTMLDivElement {
  const wrapperDiv = document.createElement("div");
  wrapperDiv.setAttribute("id", wrapperDivId);

  wrapperDiv.addEventListener("click", () => {
    disableWrapperDiv();
  });
  
  return wrapperDiv;
}

export function activateWrapperDiv(wrapperDiv: HTMLDivElement): void {
  setTimeout(() => {
    wrapperDiv.classList.add("active");
  }, 1); 
}

export function disableWrapperDiv(wrapperDiv: HTMLDivElement, iframe: HTMLIFrameElement): void {
  wrapperDiv.classList.remove("active");

  setTimeout(
    () => {
      wrapperDiv.style.display = "none";
    },
    parseFloat(window.getComputedStyle(iframe).transitionDuration) * 1000,
  );
}

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
