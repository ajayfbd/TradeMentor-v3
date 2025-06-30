'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';
import { useFormValidation, validationConfigs } from '@/lib/validation';
import { ValidatedInput, PasswordInput } from '@/components/form/ValidatedInput';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { 
    addField, 
    validateField, 
    validateForm, 
    getFieldError, 
    hasError 
  } = useFormValidation();

  // Setup validation rules
  useEffect(() => {
    addField('email', validationConfigs.loginForm.email);
    addField('password', validationConfigs.loginForm.password);
  }, [addField]);

  const loginMutation = useMutation({
    mutationFn: apiClient.login,
    onSuccess: (data) => {
      login(data.data.token, data.data.user);
      toast({
        title: 'Welcome back! 👋',
        description: 'Successfully logged in.',
      });
      router.push('/emotion');
    },
    onError: (error: any) => {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.isValid) {
      toast({
        title: 'Please fix the errors',
        description: 'Check the form for validation errors.',
        variant: 'destructive',
      });
      return;
    }

    loginMutation.mutate(formData);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to continue your trading journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <ValidatedInput
              id="email"
              label="Email"
              type="email"
              placeholder="trader@example.com"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              disabled={loginMutation.isPending}
              error={getFieldError('email')}
              success={!!formData.email && !hasError('email')}
              required
            />

            {/* Password */}
            <PasswordInput
              id="password"
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => updateFormData('password', e.target.value)}
              disabled={loginMutation.isPending}
              error={getFieldError('password')}
              success={!!formData.password && !hasError('password')}
              showStrengthIndicator={false}
              required
            />

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={loginMutation.isPending}
              className="w-full h-12 text-base font-medium"
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link 
                href="/auth/register"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign up
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
