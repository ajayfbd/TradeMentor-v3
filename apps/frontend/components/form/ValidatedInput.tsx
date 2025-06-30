/**
 * Enhanced Form Components with Real-time Validation
 */

import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input, InputProps } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface ValidatedInputProps extends InputProps {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  onValidate?: (value: string) => void;
  showValidation?: boolean;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ 
    label, 
    error, 
    hint, 
    success, 
    onValidate, 
    showValidation = true,
    className, 
    onChange,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setHasValue(!!value);
      onChange?.(e);
      onValidate?.(value);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
      onValidate?.(e.target.value);
    };

    const showError = showValidation && error && !isFocused;
    const showSuccess = showValidation && success && hasValue && !error;

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className={cn(
            'text-sm font-medium',
            showError && 'text-destructive',
            showSuccess && 'text-green-600'
          )}>
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          <Input
            ref={ref}
            {...props}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'transition-all duration-200',
              showError && 'border-destructive focus:border-destructive focus:ring-destructive',
              showSuccess && 'border-green-500 focus:border-green-500 focus:ring-green-500',
              isFocused && 'ring-2 ring-primary/20',
              className
            )}
            aria-invalid={showError ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
          />
          
          {/* Validation Icon */}
          {showValidation && hasValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {showError && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              {showSuccess && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {showError && (
          <p id={`${props.id}-error`} className="text-sm text-destructive flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
          </p>
        )}

        {/* Hint */}
        {hint && !showError && (
          <p id={`${props.id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

interface PasswordInputProps extends Omit<ValidatedInputProps, 'type'> {
  showStrengthIndicator?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrengthIndicator = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [strength, setStrength] = useState(0);

    const calculateStrength = (password: string): number => {
      let score = 0;
      if (password.length >= 6) score += 1;
      if (password.length >= 8) score += 1;
      if (/[a-z]/.test(password)) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/\d/.test(password)) score += 1;
      if (/[^a-zA-Z\d]/.test(password)) score += 1;
      return Math.min(score, 5);
    };

    const handlePasswordChange = (value: string) => {
      if (showStrengthIndicator) {
        setStrength(calculateStrength(value));
      }
      props.onValidate?.(value);
    };

    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

    return (
      <div className="space-y-2">
        <div className="relative">
          <ValidatedInput
            ref={ref}
            {...props}
            type={showPassword ? 'text' : 'password'}
            onValidate={handlePasswordChange}
            className="pr-10"
          />
          
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {showStrengthIndicator && props.value && (
          <div className="space-y-1">
            <div className="flex space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i < strength ? strengthColors[strength - 1] : 'bg-gray-200'
                  )}
                />
              ))}
            </div>
            {strength > 0 && (
              <p className="text-xs text-muted-foreground">
                Password strength: {strengthLabels[strength - 1]}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  onValidate?: (value: string) => void;
  showValidation?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
}

export const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ 
    label, 
    error, 
    hint, 
    success, 
    onValidate, 
    showValidation = true,
    showCharCount = true,
    maxLength,
    className, 
    onChange,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [charCount, setCharCount] = useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setCharCount(value.length);
      onChange?.(e);
      onValidate?.(value);
    };

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
      onValidate?.(e.target.value);
    };

    const showError = showValidation && error && !isFocused;
    const showSuccess = showValidation && success && charCount > 0 && !error;
    const isNearLimit = maxLength && charCount > maxLength * 0.8;

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className={cn(
            'text-sm font-medium',
            showError && 'text-destructive',
            showSuccess && 'text-green-600'
          )}>
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          <Textarea
            ref={ref}
            {...props}
            maxLength={maxLength}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'transition-all duration-200 resize-none',
              showError && 'border-destructive focus:border-destructive focus:ring-destructive',
              showSuccess && 'border-green-500 focus:border-green-500 focus:ring-green-500',
              isFocused && 'ring-2 ring-primary/20',
              className
            )}
            aria-invalid={showError ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            {/* Error Message */}
            {showError && (
              <p id={`${props.id}-error`} className="text-sm text-destructive flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {error}
              </p>
            )}

            {/* Hint */}
            {hint && !showError && (
              <p id={`${props.id}-hint`} className="text-xs text-muted-foreground">
                {hint}
              </p>
            )}
          </div>

          {/* Character Count */}
          {showCharCount && maxLength && (
            <p className={cn(
              'text-xs',
              isNearLimit ? 'text-orange-500' : 'text-muted-foreground',
              charCount >= maxLength && 'text-destructive'
            )}>
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

ValidatedTextarea.displayName = 'ValidatedTextarea';

interface FormFieldProps {
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}

export function FormField({ children, error, required }: FormFieldProps) {
  return (
    <div className={cn(
      'space-y-2 transition-all duration-200',
      error && 'animate-shake'
    )}>
      {children}
    </div>
  );
}

// Enhanced form validation styles for globals.css
export const formValidationStyles = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }

  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }

  /* Enhanced focus states */
  .form-field-focus {
    @apply ring-2 ring-primary/20 border-primary;
  }

  /* Touch-friendly form elements */
  @media (pointer: coarse) {
    .form-input, .form-textarea, .form-select {
      @apply min-h-[48px] text-base;
    }
    
    .form-button {
      @apply min-h-[48px] min-w-[48px];
    }
  }
`;
