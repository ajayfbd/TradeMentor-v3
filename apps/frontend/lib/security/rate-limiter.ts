import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message: string; // Error message when limit exceeded
  standardHeaders?: boolean; // Include rate limit headers
  legacyHeaders?: boolean; // Include legacy X-RateLimit headers
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (use Redis in production)
const store: RateLimitStore = {};

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const identifier = getClientIdentifier(request);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Initialize or get existing entry
    if (!store[identifier] || store[identifier].resetTime < now) {
      store[identifier] = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }

    const entry = store[identifier];
    entry.count++;

    // Prepare headers
    const headers = new Headers();
    
    if (config.standardHeaders) {
      headers.set('RateLimit-Limit', config.max.toString());
      headers.set('RateLimit-Remaining', Math.max(0, config.max - entry.count).toString());
      headers.set('RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    }

    if (config.legacyHeaders) {
      headers.set('X-RateLimit-Limit', config.max.toString());
      headers.set('X-RateLimit-Remaining', Math.max(0, config.max - entry.count).toString());
      headers.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    }

    // Check if limit exceeded
    if (entry.count > config.max) {
      headers.set('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString());
      
      return NextResponse.json(
        {
          error: config.message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers,
        }
      );
    }

    return null; // No rate limit exceeded
  };
}

function getClientIdentifier(request: NextRequest): string {
  // Get client IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Include user agent for additional fingerprinting
  const userAgent = request.headers.get('user-agent') || '';
  
  return `${ip}:${userAgent.slice(0, 50)}`; // Truncate user agent
}

// Specific rate limiters for different endpoints
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many API requests, please try again later.',
  standardHeaders: true,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
});

export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
});
