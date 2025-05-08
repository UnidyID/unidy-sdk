/**
 * Unit tests for the token-manager module
 */

import { parseToken } from '../../src/modules/token-manager';

describe('Token Manager', () => {
  describe('parseToken', () => {
    // Mock error handler
    const mockErrorHandler = jest.fn();
    
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    test('should parse a valid JWT token', () => {
      // Create a sample JWT token with a known payload
      const payload = { sub: 'user123', name: 'Test User', exp: 1609459200 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      const result = parseToken(token, mockErrorHandler);
      
      expect(result).toEqual(payload);
      expect(mockErrorHandler).not.toHaveBeenCalled();
    });
    
    test('should handle invalid tokens and call error handler', () => {
      const invalidToken = 'invalid-token';
      
      const result = parseToken(invalidToken, mockErrorHandler);
      
      expect(result).toBeNull();
      expect(mockErrorHandler).toHaveBeenCalledWith(
        'internal_error',
        'Failed to parse token',
        expect.any(Error)
      );
    });
  });
});