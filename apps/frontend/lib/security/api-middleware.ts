import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from './rate-limiter';
import { validateInput, ValidationError } from './input-validation';
import { jwtManager } from '@/lib/auth/jwt-manager';

// CORS configuration
const CORS_OPTIONS = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

interface ApiMiddlewareOptions {
  requireAuth?: boolean;
  validateSchema?: any;
  rateLimit?: boolean;
  cors?: boolean;
  methods?: string[];
}

export function createApiHandler(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  options: ApiMiddlewareOptions = {}
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    try {
      // 1. CORS handling
      if (options.cors !== false) {
        const corsResponse = handleCORS(request);
        if (corsResponse) return corsResponse;
      }

      // 2. Method validation
      if (options.methods && !options.methods.includes(request.method)) {
        return NextResponse.json(
          { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
          { status: 405 }
        );
      }

      // 3. Rate limiting
      if (options.rateLimit !== false) {
        const rateLimitResponse = await apiRateLimit(request);
        if (rateLimitResponse) return rateLimitResponse;
      }

      // 4. Authentication
      if (options.requireAuth) {
        const authResult = await validateAuthentication(request);
        if (!authResult.success) {
          return NextResponse.json(
            { error: authResult.error, code: 'UNAUTHORIZED' },
            { status: 401 }
          );
        }
        // Add user info to context
        context.user = authResult.user;
      }

      // 5. Input validation
      if (options.validateSchema && request.method !== 'GET') {
        try {
          const body = await request.json();
          const validatedData = validateInput(options.validateSchema, body);
          // Add validated data to context
          context.validatedData = validatedData;
        } catch (error) {
          if (error instanceof ValidationError) {
            return NextResponse.json(
              {
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: error.issues,
              },
              { status: 400 }
            );
          }
          throw error;
        }
      }

      // 6. Security headers
      const response = await handler(request, context);
      return addSecurityHeaders(response);

    } catch (error) {
      console.error('API Error:', error);
      
      return NextResponse.json(
        {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            details: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
        { status: 500 }
      );
    }
  };
}

function handleCORS(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    
    if (origin && CORS_OPTIONS.origin.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', CORS_OPTIONS.methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', CORS_OPTIONS.allowedHeaders.join(', '));
    response.headers.set('Access-Control-Max-Age', CORS_OPTIONS.maxAge.toString());
    
    if (CORS_OPTIONS.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    return response;
  }

  return null;
}

async function validateAuthentication(request: NextRequest): Promise<{
  success: boolean;
  error?: string;
  user?: any;
}> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'No valid authorization header' };
  }

  const token = authHeader.substring(7);
  
  try {
    // In a real implementation, you would verify the JWT token here
    // For now, we'll use a simple validation
    const user = jwtManager.getUserInfo();
    
    if (!user) {
      return { success: false, error: 'Invalid token' };
    }

    return { success: true, user };
  } catch (error) {
    return { success: false, error: 'Token validation failed' };
  }
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS header for HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // CSP header
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust as needed
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];
  
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  return response;
}

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'API_ERROR'
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues,
      },
      { status: 400 }
    );
  }

  console.error('Unhandled API error:', error);
  
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}

// Utility for database connection security
export function getSecureDbConnection() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Validate SSL requirements in production
  if (process.env.NODE_ENV === 'production' && !connectionString.includes('sslmode=require')) {
    throw new Error('Database connection must use SSL in production');
  }

  return connectionString;
}

// Request logging for security monitoring
export function logSecurityEvent(
  type: 'auth_failure' | 'rate_limit' | 'validation_error' | 'suspicious_activity',
  request: NextRequest,
  details?: Record<string, any>
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    url: request.url,
    method: request.method,
    ...details,
  };

  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to your logging service (e.g., DataDog, Sentry, CloudWatch)
    console.log('SECURITY_EVENT:', JSON.stringify(logEntry));
  } else {
    console.warn('Security Event:', logEntry);
  }
}
