export const ErrorTypes = {
  AUTHENTICATION: 'authentication_error',
  NETWORK: 'network_error',
  CONFIGURATION: 'configuration_error',
  SESSION: 'session_error',
  INTERNAL: 'internal_error'
};

export interface ErrorData {
  type: string;
  message: string;
  originalError: Error | null;
  timestamp: Date;
}

export function createErrorHandler(errorCallback: (type: string, data: ErrorData) => void):
  (type: string, message: string, originalError?: Error | null) => void {
   return function handleError(type: string, message: string, originalError: Error | null = null): void {
    const errorData: ErrorData = {
      type,
      message,
      originalError,
      timestamp: new Date()
    };
    
    errorCallback('error', errorData);
  };
}
