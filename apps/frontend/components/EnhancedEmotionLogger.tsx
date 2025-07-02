'use client';

import { useState, useEffect } from 'react';
import { useStreakContext } from '@/contexts/StreakContext';
import { StreakDisplay } from './StreakDisplay';

interface EmotionEntry {
  id: string;
  emotion: number;
  timestamp: Date;
  note?: string;
}

export function EnhancedEmotionLogger() {
  const [currentEmotion, setCurrentEmotion] = useState<number>(5);
  const [note, setNote] = useState<string>('');
  const [isLogging, setIsLogging] = useState(false);
  const [recentEntries, setRecentEntries] = useState<EmotionEntry[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { updateStreak, canUpdateToday, currentStreak } = useStreakContext();

  // Load recent entries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tradementor_emotion_entries');
    if (saved) {
      try {
        const entries = JSON.parse(saved).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        setRecentEntries(entries);
      } catch (err) {
        console.error('Error loading emotion entries:', err);
      }
    }
  }, []);

  // Save entries to localStorage
  const saveEntries = (entries: EmotionEntry[]) => {
    localStorage.setItem('tradementor_emotion_entries', JSON.stringify(entries));
    setRecentEntries(entries);
  };

  const handleLogEmotion = async () => {
    setIsLogging(true);
    
    try {
      // Create new emotion entry
      const newEntry: EmotionEntry = {
        id: Date.now().toString(),
        emotion: currentEmotion,
        timestamp: new Date(),
        note: note.trim() || undefined
      };

      // Add to recent entries (keep last 10)
      const updatedEntries = [newEntry, ...recentEntries].slice(0, 10);
      saveEntries(updatedEntries);

      // Update streak if we can today
      if (canUpdateToday) {
        await updateStreak();
      }

      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reset form
      setNote('');
      setCurrentEmotion(5);

      // Here you would also send to your API
      // await api.post('/api/emotions', newEntry);

    } catch (error) {
      console.error('Error logging emotion:', error);
      alert('Failed to log emotion. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  const getEmotionColor = (emotion: number) => {
    if (emotion <= 2) return 'text-red-600 bg-red-50';
    if (emotion <= 4) return 'text-orange-600 bg-orange-50';
    if (emotion <= 6) return 'text-yellow-600 bg-yellow-50';
    if (emotion <= 8) return 'text-green-600 bg-green-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getEmotionEmoji = (emotion: number) => {
    if (emotion <= 2) return '😟';
    if (emotion <= 4) return '😐';
    if (emotion <= 6) return '🙂';
    if (emotion <= 8) return '😊';
    return '😄';
  };

  const getTodaysEntries = () => {
    const today = new Date().toDateString();
    return recentEntries.filter(entry => entry.timestamp.toDateString() === today);
  };

  return (
    <div className="enhanced-emotion-logger max-w-2xl mx-auto p-6">
      {/* Header with Streak Display */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">How are you feeling?</h2>
        <StreakDisplay 
          currentStreak={currentStreak}
          onClick={() => alert(`Current streak: ${currentStreak} days!\nKeep logging your emotions daily to maintain your streak.`)}
        />
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-fade-in">
          <div className="flex items-center">
            <span className="mr-2">✅</span>
            <span>Emotion logged successfully!</span>
            {canUpdateToday && <span className="ml-2">🔥 Streak updated!</span>}
          </div>
        </div>
      )}

      {/* Today's Summary */}
      {getTodaysEntries().length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-800 mb-2">Today&apos;s Emotions ({getTodaysEntries().length})</h3>
          <div className="flex space-x-2">
            {getTodaysEntries().map((entry) => (
              <div
                key={entry.id}
                className={`px-3 py-1 rounded-full text-sm ${getEmotionColor(entry.emotion)}`}
              >
                {getEmotionEmoji(entry.emotion)} {entry.emotion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emotion Slider */}
      <div className="emotion-input bg-white rounded-xl p-6 shadow-md mb-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Current Emotion Level: <span className="text-2xl ml-2">{getEmotionEmoji(currentEmotion)} {currentEmotion}</span>
          </label>
          
          <div className="relative">
            <input
              type="range"
              min="1"
              max="10"
              value={currentEmotion}
              onChange={(e) => setCurrentEmotion(parseInt(e.target.value))}
              className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 - Very Low</span>
              <span>5 - Neutral</span>
              <span>10 - Very High</span>
            </div>
          </div>
        </div>

        {/* Note Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's affecting your emotions? Any trading insights?"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            rows={3}
            maxLength={200}
          />
          <div className="text-xs text-gray-500 mt-1">{note.length}/200 characters</div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleLogEmotion}
          disabled={isLogging}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            isLogging
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-hover text-white shadow-md hover:shadow-lg transform hover:scale-[1.02]'
          }`}
        >
          {isLogging ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Logging...
            </div>
          ) : (
            <>
              Log Emotion {canUpdateToday && '🔥'}
            </>
          )}
        </button>

        {/* Streak Encouragement */}
        {!canUpdateToday && (
          <p className="text-center text-sm text-gray-500 mt-3">
            ✅ You&apos;ve already logged emotions today! Streak maintained.
          </p>
        )}
      </div>

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <div className="recent-entries bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Entries</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getEmotionEmoji(entry.emotion)}</span>
                  <div>
                    <div className="font-medium">Level {entry.emotion}</div>
                    <div className="text-sm text-gray-500">
                      {entry.timestamp.toLocaleDateString()} at {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {entry.note && (
                      <div className="text-sm text-gray-600 mt-1 italic">&quot;{entry.note}&quot;</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
