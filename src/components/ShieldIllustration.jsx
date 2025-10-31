import React from 'react';

export default function SecurityShield() {
  return (
    <div className="min-h-screen from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-8">
      <div className="relative w-96 h-96">
        {/* Main shield container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative animate-float">
            {/* Glow effect */}
            <div className="absolute inset-0 blur-2xl opacity-50 bg-teal-400 rounded-full scale-110"></div>

            {/* Shield */}
            <svg width="200" height="240" viewBox="0 0 200 240" className="relative z-10">
              {/* Shield background with gradient */}
              <defs>
                <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#5eead4" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.7" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Shield shape */}
              <path
                d="M 100 10 L 180 50 L 180 120 Q 180 200 100 230 Q 20 200 20 120 L 20 50 Z"
                fill="url(#shieldGradient)"
                stroke="#5eead4"
                strokeWidth="2"
                filter="url(#glow)"
                className="animate-pulse"
                style={{ animationDuration: '3s' }}
              />

              {/* Shield highlight */}
              <path
                d="M 100 10 L 180 50 L 180 120 Q 180 200 100 230 Q 20 200 20 120 L 20 50 Z"
                fill="none"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="400"
                strokeDashoffset="400"
                className="animate-draw"
              />

              {/* Magnifying glass handle */}
              <line
                x1="140"
                y1="140"
                x2="165"
                y2="165"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                className="animate-pulse"
                style={{ animationDuration: '2s' }}
              />

              {/* Magnifying glass circle */}
              <circle
                cx="115"
                cy="115"
                r="35"
                fill="none"
                stroke="white"
                strokeWidth="8"
                className="animate-pulse"
                style={{ animationDuration: '2s' }}
              />

              {/* Inner circle detail */}
              <circle
                cx="115"
                cy="115"
                r="25"
                fill="rgba(255, 255, 255, 0.1)"
              />

              {/* Magnifying glass shine */}
              <path
                d="M 95 95 Q 100 90 105 95"
                stroke="rgba(255, 255, 255, 0.6)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Scanning line effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-scan"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes scan {
          0% { transform: translateY(-120px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(120px); opacity: 0; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-draw {
          animation: draw 3s ease-in-out infinite;
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}