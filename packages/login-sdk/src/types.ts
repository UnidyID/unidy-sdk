export interface UnidyAuthConfig {
  clientId: string;
  scope?: string;
  responseType?: string;
  prompt?: string;
  maxAge?: number;
}

export interface UnidyAuthOptions {
  onAuth?: (token: string) => void;
  onClose?: () => void;
}

export interface UnidyAuthInstance {
  auth: () => void;
  show: () => void;
  hide: () => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  getIdToken: () => string | null;
}
