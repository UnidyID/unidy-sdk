import { DOM_IDS, DEFAULTS } from './modules/constants';
import { iFrameSource, activateWrapperDiv, disableWrapperDiv, buildIframe } from './modules/ui-components';
import { createErrorHandler, ErrorData } from './modules/error-handler';
import mitt, { Emitter } from 'mitt';

export interface UnidyLoginConfig {
  clientId: string;
  scope?: string;
  responseType?: string;
  prompt?: string;
  maxAge?: number;
}

export interface MessageData {
  action: string;
  idToken?: string;
  [key: string]: any;
}

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
  unidyUrl = unidyUrl.replace(/\/+$/, '');
  
  const body = document.getElementsByTagName("body")[0];
  const wrapperDivId = DOM_IDS.WRAPPER_DIV;
  const iFrameId = DOM_IDS.IFRAME;

  let iframe: HTMLIFrameElement;
  let wrapperDiv: HTMLDivElement;
  let isInitialized = false;
  let currentIdToken: string | null = null; 
  
  const listeners: {
    auth: ((data: MessageData) => void) | null;
    error: ((data: ErrorData) => void) | null;
    [key: string]: ((data: any) => void) | null;
  } = {
    auth: null,
    error: null
  };
  
  const emitter: Emitter<any> = mitt();
  
  const handleError = createErrorHandler(emitter.emit.bind(emitter));
  
  (window as any).unidyLoginListeners = listeners;
  
  const getIframeSource = (target: string): string => iFrameSource({
    unidyUrl,
    clientId,
    scope,
    responseType,
    prompt,
    maxAge
  }, target);

  const handleMessage = function(event: MessageEvent): void {
    try {
      const normalizedUnidyUrl = unidyUrl.replace(/\/+$/, '');
      const normalizedOrigin = event.origin.replace(/\/+$/, '');
      
      if (normalizedOrigin !== normalizedUnidyUrl) {
        return;
      }
      
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      const action = event.data.action;
      
      try {
        emitter.emit(`action:${action}`, event.data);
      } catch (error) {
        console.error(`Error in action:${action} event handler:`, error);
      }
      
      const listener = listeners[action];
      if (!listener) {
        return;
      }
      
      listener(event.data);
    } catch (error) {
      handleError('internal_error', 'Error handling message', error instanceof Error ? error : new Error(String(error)));
    }
  };
  
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
  
  function activateWrapperDivWithConfig(): void {
    activateWrapperDiv(wrapperDiv);
  }
  
  function disableWrapperDivWithConfig(): void {
    disableWrapperDiv(wrapperDiv, iframe);
  }

  return {
    init: function(): UnidyLoginSDK {
      if (isInitialized) {
        return this;
      }
      
      isInitialized = true;
      initFrame();
      return this;
    },
    
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

    close: function(): UnidyLoginSDK {
      iframe = document.getElementById(iFrameId) as HTMLIFrameElement;
      wrapperDiv = document.getElementById(wrapperDivId) as HTMLDivElement;

      if (iframe && wrapperDiv) {
        disableWrapperDivWithConfig();
      }
      
      return this;
    },
    
    onAuth: function(authHandler: (idToken: string) => void): UnidyLoginSDK {
      if (typeof authHandler !== 'function') {
        return this;
      }
      
      listeners.auth = ({ idToken }: MessageData): void => {
        try {
          if (idToken) {
            currentIdToken = idToken; 
            authHandler(idToken);
            disableWrapperDivWithConfig();
          }
        } catch (error) {
        }
      };
      
      return this;
    },
    
    isAuthenticated: function(): boolean {
      return !!currentIdToken;
    },
    
    getIdToken: function(): string | null {
      return currentIdToken;
    },
    
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    emit: emitter.emit.bind(emitter)
  };
}
