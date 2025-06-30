/**
 * Enhanced Form Validation Library for TradeMentor
 * Provides real-time validation with immediate feedback
 */

import { useState, useCallback } from 'react';

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
  priority?: number; // Lower numbers show first
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FieldValidationConfig {
  rules: ValidationRule[];
  required?: boolean;
  requiredMessage?: string;
}

// Common validation rules
export const validationRules = {
  // Email validation
  email: {
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value.trim());
    },
    message: 'Please enter a valid email address',
    priority: 1
  },

  // Password validation
  minLength: (length: number) => ({
    validate: (value: string) => value.length >= length,
    message: `Must be at least ${length} characters`,
    priority: 1
  }),

  passwordStrength: {
    validate: (value: string) => {
      // At least 6 chars, 1 letter, 1 number
      return value.length >= 6 && /[a-zA-Z]/.test(value) && /\d/.test(value);
    },
    message: 'Must contain at least one letter and one number',
    priority: 2
  },

  passwordMatch: (compareValue: string) => ({
    validate: (value: string) => value === compareValue,
    message: 'Passwords must match',
    priority: 1
  }),

  // Trading symbol validation
  symbol: {
    validate: (value: string) => {
      const symbolRegex = /^[A-Z]{1,10}$/;
      return symbolRegex.test(value.trim());
    },
    message: 'Symbol must be 1-10 uppercase letters',
    priority: 1
  },

  // Numeric validations
  positiveNumber: {
    validate: (value: string | number) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) && num > 0;
    },
    message: 'Must be a positive number',
    priority: 1
  },

  maxLength: (length: number) => ({
    validate: (value: string) => value.length <= length,
    message: `Must not exceed ${length} characters`,
    priority: 2
  }),

  // Emotion level validation
  emotionLevel: {
    validate: (value: number) => value >= 1 && value <= 10,
    message: 'Emotion level must be between 1 and 10',
    priority: 1
  },

  // Context validation
  validContext: {
    validate: (value: string) => {
      const validContexts = ['pre-trade', 'post-trade', 'market-event'];
      return validContexts.includes(value);
    },
    message: 'Please select a valid context',
    priority: 1
  }
};

// Form validation class
export class FormValidator {
  private fields: Map<string, FieldValidationConfig> = new Map();
  private values: Map<string, any> = new Map();
  private errors: Map<string, string[]> = new Map();
  private warnings: Map<string, string[]> = new Map();

  addField(name: string, config: FieldValidationConfig) {
    this.fields.set(name, config);
    this.errors.set(name, []);
    this.warnings.set(name, []);
  }

  setValue(name: string, value: any): ValidationResult {
    this.values.set(name, value);
    return this.validateField(name);
  }

  validateField(name: string): ValidationResult {
    const config = this.fields.get(name);
    const value = this.values.get(name);
    
    if (!config) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required
    if (config.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors.push(config.requiredMessage || 'This field is required');
    } else if (value && (typeof value !== 'string' || value.trim())) {
      // Only validate rules if value exists and is not empty
      const results = config.rules
        .map(rule => ({ ...rule, result: rule.validate(value) }))
        .sort((a, b) => (a.priority || 999) - (b.priority || 999));

      results.forEach(rule => {
        if (!rule.result) {
          errors.push(rule.message);
        }
      });
    }

    this.errors.set(name, errors);
    this.warnings.set(name, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateAll(): { isValid: boolean; fieldErrors: Record<string, string[]> } {
    const fieldErrors: Record<string, string[]> = {};
    let isValid = true;

    for (const name of Array.from(this.fields.keys())) {
      const result = this.validateField(name);
      fieldErrors[name] = result.errors;
      if (!result.isValid) {
        isValid = false;
      }
    }

    return { isValid, fieldErrors };
  }

  getFieldErrors(name: string): string[] {
    return this.errors.get(name) || [];
  }

  hasFieldError(name: string): boolean {
    const errors = this.errors.get(name) || [];
    return errors.length > 0;
  }

  reset() {
    this.values.clear();
    this.errors.clear();
    this.warnings.clear();
  }
}

// React hook for form validation
export function useFormValidation() {
  const [validator] = useState(() => new FormValidator());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const addField = useCallback((name: string, config: FieldValidationConfig) => {
    validator.addField(name, config);
  }, [validator]);

  const validateField = useCallback((name: string, value: any) => {
    const result = validator.setValue(name, value);
    setFieldErrors((prev: Record<string, string[]>) => ({
      ...prev,
      [name]: result.errors
    }));
    return result;
  }, [validator]);

  const validateForm = useCallback(() => {
    const result = validator.validateAll();
    setFieldErrors(result.fieldErrors);
    return result;
  }, [validator]);

  const getFieldError = useCallback((name: string): string | undefined => {
    const errors = fieldErrors[name] || [];
    return errors[0]; // Return first error
  }, [fieldErrors]);

  const hasError = useCallback((name: string): boolean => {
    return validator.hasFieldError(name);
  }, [validator]);

  const resetValidation = useCallback(() => {
    validator.reset();
    setFieldErrors({});
  }, [validator]);

  return {
    addField,
    validateField,
    validateForm,
    getFieldError,
    hasError,
    resetValidation,
    fieldErrors
  };
}

// Pre-configured validation configs for common forms
export const validationConfigs = {
  loginForm: {
    email: {
      rules: [validationRules.email],
      required: true,
      requiredMessage: 'Email is required'
    },
    password: {
      rules: [validationRules.minLength(6)],
      required: true,
      requiredMessage: 'Password is required'
    }
  },

  registerForm: {
    email: {
      rules: [validationRules.email],
      required: true,
      requiredMessage: 'Email is required'
    },
    password: {
      rules: [
        validationRules.minLength(6),
        validationRules.passwordStrength
      ],
      required: true,
      requiredMessage: 'Password is required'
    },
    confirmPassword: {
      rules: [], // Will be set dynamically
      required: true,
      requiredMessage: 'Please confirm your password'
    }
  },

  tradeForm: {
    symbol: {
      rules: [validationRules.symbol],
      required: true,
      requiredMessage: 'Trading symbol is required'
    },
    pnl: {
      rules: [], // Optional field
      required: false
    }
  },

  emotionForm: {
    level: {
      rules: [validationRules.emotionLevel],
      required: true,
      requiredMessage: 'Please select an emotion level'
    },
    context: {
      rules: [validationRules.validContext],
      required: true,
      requiredMessage: 'Please select when this is happening'
    },
    notes: {
      rules: [validationRules.maxLength(1000)],
      required: false
    },
    symbol: {
      rules: [validationRules.symbol],
      required: false
    }
  },

  reflectionForm: {
    wins: {
      rules: [validationRules.maxLength(2000)],
      required: true,
      requiredMessage: 'Please describe what went well'
    },
    losses: {
      rules: [validationRules.maxLength(2000)],
      required: true,
      requiredMessage: 'Please describe what didn\'t work'
    },
    lessons: {
      rules: [validationRules.maxLength(2000)],
      required: true,
      requiredMessage: 'Please share your key lessons'
    },
    emotionalInsights: {
      rules: [validationRules.maxLength(2000)],
      required: false
    },
    nextWeekGoals: {
      rules: [validationRules.maxLength(2000)],
      required: false
    }
  }
};

export default FormValidator;
