import { z, ZodSchema, ZodError } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Custom validation error class
export class ValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';
  public readonly issues: z.ZodIssue[];

  constructor(zodError: ZodError) {
    super('Validation failed');
    this.issues = zodError.issues;
  }
}

// Validate input against schema and sanitize
export function validateInput<T>(schema: ZodSchema<T>, input: unknown): T {
  try {
    // First sanitize the input if it's an object with string values
    const sanitizedInput = sanitizeInput(input);
    
    // Then validate against schema
    return schema.parse(sanitizedInput);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error);
    }
    throw error;
  }
}

// Sanitize input to prevent XSS
function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// Common validation schemas
export const emailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .toLowerCase()
  .trim();

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .trim();

export const noteSchema = z.string()
  .max(1000, 'Note too long')
  .trim()
  .optional();

export const symbolSchema = z.string()
  .min(1, 'Symbol required')
  .max(10, 'Symbol too long')
  .regex(/^[A-Z]+$/, 'Symbol must contain only uppercase letters')
  .trim();

export const emotionLevelSchema = z.number()
  .int('Emotion level must be an integer')
  .min(1, 'Emotion level must be at least 1')
  .max(10, 'Emotion level must be at most 10');

export const contextSchema = z.enum([
  'pre-market',
  'market-open',
  'during-trade',
  'post-trade',
  'market-close',
  'weekend',
  'market-event'
], {
  errorMap: () => ({ message: 'Invalid emotion context' })
});

// Trade-specific schemas
export const tradeActionSchema = z.enum(['buy', 'sell'], {
  errorMap: () => ({ message: 'Trade action must be buy or sell' })
});

export const tradeOutcomeSchema = z.enum(['win', 'loss', 'breakeven'], {
  errorMap: () => ({ message: 'Invalid trade outcome' })
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before end date',
    path: ['startDate'],
  }
);

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  size: z.number().int().min(1).max(10 * 1024 * 1024), // 10MB max
  type: z.string().regex(/^(image\/(jpeg|png|gif|webp)|application\/pdf)$/, 
    'Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF files are allowed'),
});

// SQL injection prevention - validate database field names
export const dbFieldSchema = z.string()
  .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid field name')
  .max(64, 'Field name too long');

// Validate sort parameters
export const sortSchema = z.object({
  field: dbFieldSchema,
  direction: z.enum(['asc', 'desc']).default('desc'),
});

// Comprehensive user registration schema
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).strict(); // Reject extra fields

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password required'),
}).strict();

// Password reset schemas
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
}).strict();

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token required'),
  password: passwordSchema,
}).strict();
