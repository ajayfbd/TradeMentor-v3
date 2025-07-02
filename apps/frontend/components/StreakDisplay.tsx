'use client';

import { useStreak } from '@/hooks/useStreak';
import { StreakCelebration } from './StreakCelebration';

interface StreakDisplayProps {
  currentStreak?: number;
  onClick?: () => void;
  showTooltip?: boolean;
}

export function StreakDisplay({ currentStreak, onClick, showTooltip = true }: StreakDisplayProps) {
  const {
    currentStreak: hookStreak,
    longestStreak,
    showCelebration,
    milestone,
    closeCelebration
  } = useStreak();

  // Use prop value or hook value
  const streak = currentStreak ?? hookStreak;

  const getStreakClass = (streak: number) => {
    if (streak >= 100) return "text-yellow-500 font-bold animate-pulse";
    if (streak >= 30) return "text-purple-600 font-bold";
    if (streak >= 14) return "text-blue-600 font-bold";
    if (streak >= 7) return "text-green-600 font-semibold";
    return "text-gray-500";
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 100) return "🏆";
    if (streak >= 30) return "🎖️";
    if (streak >= 14) return "💪";
    if (streak >= 7) return "🔥";
    return "📅";
  };

  const getStreakBgClass = (streak: number) => {
    if (streak >= 100) return "bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300";
    if (streak >= 30) return "bg-gradient-to-r from-purple-100 to-purple-200 border-purple-300";
    if (streak >= 14) return "bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300";
    if (streak >= 7) return "bg-gradient-to-r from-green-100 to-green-200 border-green-300";
    return "bg-gray-100 border-gray-300";
  };

  const getTooltipText = (streak: number) => {
    if (streak === 0) return "Start your emotion tracking streak today!";
    if (streak === 1) return "Great start! Keep tracking your emotions daily.";
    if (streak < 7) return `${7 - streak} more days to reach Week Warrior! 🔥`;
    if (streak < 14) return `${14 - streak} more days to become a Two Week Champion! 💪`;
    if (streak < 30) return `${30 - streak} more days to become a Monthly Master! 🎖️`;
    if (streak < 100) return `${100 - streak} more days to become a Legend! 🏆`;
    return "You're an Emotion Tracking Legend! 🏆";
  };

  return (
    <>
      <div className="streak-display-container relative group">
        <div 
          className={`streak-display flex items-center space-x-2 px-3 py-2 rounded-full border transition-all duration-200 cursor-pointer hover:scale-105 ${getStreakBgClass(streak)}`}
          onClick={onClick}
        >
          <span className="streak-emoji text-lg">{getStreakEmoji(streak)}</span>
          <div className="flex flex-col items-center">
            <span className={`streak-count text-sm font-medium ${getStreakClass(streak)}`}>
              {streak}
            </span>
            <span className="streak-label text-xs text-gray-500 leading-tight">
              {streak === 1 ? "day" : "days"}
            </span>
          </div>
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {getTooltipText(streak)}
            {longestStreak > streak && (
              <div className="text-gray-300 mt-1">
                Best: {longestStreak} days
              </div>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        )}

        {/* Streak milestone indicator */}
        {(streak === 7 || streak === 14 || streak === 30 || streak === 100) && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
        )}
      </div>

      {/* Celebration Modal */}
      {showCelebration && milestone && (
        <StreakCelebration
          streak={streak}
          milestone={milestone}
          onClose={closeCelebration}
        />
      )}
    </>
  );
}

// Compact version for mobile
export function StreakDisplayCompact({ currentStreak }: { currentStreak?: number }) {
  const { currentStreak: hookStreak } = useStreak();
  const streak = currentStreak ?? hookStreak;

  const getStreakEmoji = (streak: number) => {
    if (streak >= 100) return "🏆";
    if (streak >= 30) return "🎖️";
    if (streak >= 14) return "💪";
    if (streak >= 7) return "🔥";
    return "📅";
  };

  return (
    <div className="flex items-center space-x-1 text-sm">
      <span>{getStreakEmoji(streak)}</span>
      <span className="font-medium">{streak}</span>
    </div>
  );
}
