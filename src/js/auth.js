const API_BASE = 'https://story-api.dicoding.dev/v1';
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 

export class AuthService {
  static async login(email, password) {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new AuthError(error.message, 'LOGIN_FAILED');
      }

      const { loginResult } = await response.json();
      this._saveAuthData(loginResult);
      return loginResult;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Network error', 'NETWORK_ERROR');
    }
  }

  static async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new AuthError('No refresh token', 'INVALID_REFRESH_TOKEN');

    try {
      const response = await fetch(`${API_BASE}/refresh-token`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${refreshToken}` }
      });

      if (!response.ok) {
        this._clearAuthData();
        throw new AuthError('Session expired', 'SESSION_EXPIRED');
      }

      const { token } = await response.json();
      localStorage.setItem('token', token);
      return token;
    } catch (error) {
      this._clearAuthData();
      throw new AuthError('Refresh failed', 'REFRESH_FAILED');
    }
  }

  static async getValidToken() {
    const token = localStorage.getItem('token');
    if (!token) throw new AuthError('Not authenticated', 'UNAUTHENTICATED');

    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = Date.now() >= (payload.exp * 1000) - TOKEN_EXPIRY_BUFFER;

    if (isExpired) return await this.refreshToken();
    return token;
  }

  static _saveAuthData({ token, userId, name, refreshToken }) {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify({ userId, name }));
  }

  static _clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}

class AuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AuthError';
    this.code = code; 
  }
}