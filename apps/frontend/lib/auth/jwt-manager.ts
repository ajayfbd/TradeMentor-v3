'use client';

import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  sub: string;
  email: string;
  exp: number;
  iat: number;
  type: 'access' | 'refresh';
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class JWTManager {
  private static instance: JWTManager;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private tokenRefreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry

  private constructor() {
    this.loadTokensFromStorage();
    this.startTokenRefreshTimer();
  }

  static getInstance(): JWTManager {
    if (!JWTManager.instance) {
      JWTManager.instance = new JWTManager();
    }
    return JWTManager.instance;
  }

  private loadTokensFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    } catch (error) {
      console.warn('Failed to load tokens from storage:', error);
    }
  }

  private saveTokensToStorage(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('tokenExpiresAt', tokens.expiresAt.toString());
    } catch (error) {
      console.error('Failed to save tokens to storage:', error);
    }
  }

  private clearTokensFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiresAt');
    } catch (error) {
      console.error('Failed to clear tokens from storage:', error);
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  private shouldRefreshToken(token: string): boolean {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Date.now();
      const expiryTime = decoded.exp * 1000;
      return (expiryTime - currentTime) < this.tokenRefreshThreshold;
    } catch {
      return true;
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      return null;
    }

    // If token is expired, try to refresh
    if (this.isTokenExpired(this.accessToken)) {
      const newToken = await this.refreshAccessToken();
      return newToken;
    }

    // If token is close to expiry, refresh proactively
    if (this.shouldRefreshToken(this.accessToken)) {
      // Don't wait for refresh, return current token and refresh in background
      this.refreshAccessToken().catch(console.error);
    }

    return this.accessToken;
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      this.logout();
      return null;
    }

    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.tokens) {
        this.setTokens(data.tokens);
        return data.tokens.accessToken;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      return null;
    }
  }

  setTokens(tokens: AuthTokens): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.saveTokensToStorage(tokens);
  }

  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.clearTokensFromStorage();
    
    // Notify auth context about logout
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null && !this.isTokenExpired(this.accessToken);
  }

  getUserInfo(): TokenPayload | null {
    if (!this.accessToken) return null;
    
    try {
      return jwtDecode<TokenPayload>(this.accessToken);
    } catch {
      return null;
    }
  }

  private startTokenRefreshTimer(): void {
    // Check every minute for tokens that need refreshing
    setInterval(() => {
      if (this.accessToken && this.shouldRefreshToken(this.accessToken)) {
        this.refreshAccessToken().catch(console.error);
      }
    }, 60 * 1000);
  }
}

export const jwtManager = JWTManager.getInstance();
