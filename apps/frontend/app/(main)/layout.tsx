'use client';

import { BottomTabNav, useShowBottomNav } from '@/components/BottomTabNav';
import { WeeklyPromptModal } from '@/components/weekly-prompt/WeeklyPrompt';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const showBottomNav = useShowBottomNav();

  return (
    <div className="min-h-screen bg-background">
      <main className={showBottomNav ? "pb-20 px-4" : "px-4"}>
        {children}
      </main>
      {showBottomNav && <BottomTabNav />}
      <WeeklyPromptModal />
    </div>
  );
}
