'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/emotion');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              TradeMentor
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              The 30-second emotion check that stops revenge trading
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-3">
                <Link href="/auth/register">Get Started Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">30-Second Check</h3>
              <p className="text-gray-600">
                Quick emotion logging before and after trades to track your mental state
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Pattern Recognition</h3>
              <p className="text-gray-600">
                Discover correlation between your emotions and trading performance
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold mb-2">Mindful Trading</h3>
              <p className="text-gray-600">
                Build emotional awareness to make better trading decisions
              </p>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-white rounded-xl p-8 shadow-sm border">
            <h2 className="text-3xl font-bold mb-8">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h4 className="font-semibold mb-2">Check Emotion</h4>
                <p className="text-sm text-gray-600">Rate your emotional state 1-10</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h4 className="font-semibold mb-2">Make Trade</h4>
                <p className="text-sm text-gray-600">Execute your trading decision</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h4 className="font-semibold mb-2">Log Outcome</h4>
                <p className="text-sm text-gray-600">Record trade results and P&L</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  4
                </div>
                <h4 className="font-semibold mb-2">See Patterns</h4>
                <p className="text-sm text-gray-600">Analyze emotion-performance correlation</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-4">Ready to Trade Mindfully?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of traders improving their emotional discipline
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link href="/auth/register">Start Your Journey</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
