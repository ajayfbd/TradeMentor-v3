'use client';

import { useState, useEffect } from 'react';

interface StreakCelebrationProps {
  streak: number;
  milestone: string;
  onClose?: () => void;
}

export function StreakCelebration({ streak, milestone, onClose }: StreakCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (streak && milestone) {
      setIsVisible(true);
      
      // Trigger confetti effect using CSS animation
      const confettiElement = document.createElement('div');
      confettiElement.className = 'confetti-container';
      confettiElement.innerHTML = generateConfetti(streak);
      document.body.appendChild(confettiElement);
      
      // Remove confetti after animation
      setTimeout(() => {
        document.body.removeChild(confettiElement);
      }, 3000);
      
      // Auto-close after delay
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) setTimeout(onClose, 300);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [streak, milestone, onClose]);
  
  const generateConfetti = (streak: number) => {
    const confettiCount = streak >= 30 ? 150 : streak >= 14 ? 100 : 50;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
    
    let confettiHTML = '';
    for (let i = 0; i < confettiCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const animationDelay = Math.random() * 3;
      const animationDuration = 3 + Math.random() * 2;
      
      confettiHTML += `
        <div class="confetti-piece" style="
          left: ${left}%;
          background-color: ${color};
          animation-delay: ${animationDelay}s;
          animation-duration: ${animationDuration}s;
        "></div>
      `;
    }
    
    return confettiHTML;
  };
  
  if (!isVisible) return null;
  
  const getAchievementIcon = (streak: number) => {
    if (streak >= 100) return "🏆";
    if (streak >= 30) return "🎖️";
    if (streak >= 14) return "💪";
    return "🔥";
  };
  
  const getDescription = (streak: number) => {
    if (streak >= 100) {
      return "You've achieved legendary status! Your commitment to emotional awareness is remarkable.";
    }
    if (streak >= 30) {
      return "A full month of emotion tracking shows incredible dedication to your trading psychology.";
    }
    if (streak >= 14) {
      return "Two weeks of consistent tracking is forming a powerful habit that will transform your trading.";
    }
    return "Your first week complete! You're on your way to mastering your trading emotions.";
  };
  
  return (
    <>
      <style jsx>{`
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9999;
          overflow: hidden;
        }
        
        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          animation: confetti-fall linear forwards;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes scale-in {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .streak-progress-fill {
          animation: progress-fill 1s ease-out 0.5s both;
        }
        
        @keyframes progress-fill {
          from {
            width: 0%;
          }
          to {
            width: var(--progress-width);
          }
        }
      `}</style>
      
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 animate-fade-in">
        <div className="streak-celebration bg-white rounded-xl p-8 max-w-md mx-4 shadow-lg animate-scale-in">
          <div className="achievement-icon text-center text-7xl mb-4">
            {getAchievementIcon(streak)}
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-4 text-primary">
            {milestone}
          </h2>
          
          <div className="streak-counter relative my-6">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary streak-progress-fill"
                style={{ 
                  '--progress-width': `${Math.min(streak, 100)}%` 
                } as React.CSSProperties}
              ></div>
            </div>
            <div className="text-center mt-2 text-4xl font-bold">
              {streak} <span className="text-xl font-normal text-gray-600">days</span>
            </div>
          </div>
          
          <p className="text-center text-gray-600 mb-6">
            {getDescription(streak)}
          </p>
          
          <div className="flex space-x-4">
            <button
              className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
              onClick={() => {
                setIsVisible(false);
                if (onClose) setTimeout(onClose, 300);
              }}
            >
              Continue 🚀
            </button>
            
            <button
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
              onClick={() => {
                // Share achievement (can implement social sharing)
                if (navigator.share) {
                  navigator.share({
                    title: milestone,
                    text: `I've maintained my emotion tracking streak for ${streak} days! 🔥`,
                    url: window.location.href
                  });
                } else {
                  alert("Share functionality would integrate with social platforms");
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
