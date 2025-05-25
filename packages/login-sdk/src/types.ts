export interface UnidyAuthConfig {
  clientId: string;
  scope?: string;
  responseType?: string;
  prompt?: string;
  maxAge?: number;
}

export interface UnidyAuthOptions {
  onAuth?: (token: string) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export interface UnidyAuthInstance {
  show: () => void;
  hide: () => void;
  isAuthenticated: () => boolean;
  getIdToken: () => string | null;
}
