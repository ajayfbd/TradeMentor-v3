'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';
import { useFormValidation } from '@/lib/validation';
import { ValidatedInput, PasswordInput } from '@/components/form/ValidatedInput';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { validateField } = useFormValidation();

  const registerMutation = useMutation({
    mutationFn: apiClient.register,
    onSuccess: (data: any) => {
      login(data.data.token, data.data.user);
      toast({
        title: 'Welcome to TradeMentor! 🎉',
        description: 'Your account has been created successfully.',
      });
      router.push('/emotion');
    },
    onError: (error: any) => {
      toast({
        title: 'Registration failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEmailField = (email: string): string => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePasswordField = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateConfirmPasswordField = (confirmPassword: string, password: string): string => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const errors = {
      email: validateEmailField(formData.email),
      password: validatePasswordField(formData.password),
      confirmPassword: validateConfirmPasswordField(formData.confirmPassword, formData.password),
    };

    setFieldErrors(errors);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      toast({
        title: 'Please fix the errors',
        description: 'Check the form for validation errors.',
        variant: 'destructive',
      });
      return;
    }

    registerMutation.mutate({
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Join TradeMentor
            </h1>
            <p className="text-gray-600">
              Start your journey to mindful trading
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <ValidatedInput
                id="email"
                type="email"
                label="Email"
                placeholder="trader@example.com"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                error={fieldErrors.email}
                disabled={registerMutation.isPending}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <PasswordInput
                id="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                error={fieldErrors.password}
                disabled={registerMutation.isPending}
                hint="Must be at least 6 characters"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <PasswordInput
                id="confirmPassword"
                label="Confirm Password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                error={fieldErrors.confirmPassword}
                disabled={registerMutation.isPending}
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={registerMutation.isPending}
              className="w-full h-12 text-base font-medium"
            >
              {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                href="/auth/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link 
            href="/"
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
