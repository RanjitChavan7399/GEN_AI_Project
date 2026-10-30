import React from 'react';
import { motion } from 'framer-motion';

export const ScoreRing = ({ score = 0, size = 180, strokeWidth = 14, label = "Match Score" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (val) => {
    if (val >= 80) return { gradient: ['#10B981', '#D9F99D'], text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (val >= 60) return { gradient: ['#059669', '#10B981'], text: 'text-emerald-700', badge: 'bg-teal-100 text-teal-800 border-teal-300' };
    return { gradient: ['#F59E0B', '#FBBF24'], text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800 border-amber-300' };
  };

  const style = getScoreColor(score);

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          <defs>
            <linearGradient id="scoreRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={style.gradient[0]} />
              <stop offset="100%" stopColor={style.gradient[1]} />
            </linearGradient>
          </defs>
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="opacity-40"
          />
          {/* Animated score stroke */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#scoreRingGradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={`text-4xl font-extrabold tracking-tight ${style.text}`}
          >
            {score}%
          </motion.span>
          <span className="text-xs uppercase font-semibold tracking-wider text-surface-textMuted mt-1">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};
