'use client';

import { BottomTabNav } from '@/components/BottomTabNav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20 px-4">
        {children}
      </main>
      <BottomTabNav />
    </div>
  );
}
