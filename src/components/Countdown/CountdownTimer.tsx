'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: string; // ISO string format
  startDate: string; // ISO string format for calculating total duration
}

const CountdownTimer = ({ targetDate, startDate }: CountdownTimerProps) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        giorni: Math.floor(difference / (1000 * 60 * 60 * 24)),
        ore: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minuti: Math.floor((difference / 1000 / 60) % 60),
        secondi: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const totalDuration = +new Date(targetDate) - +new Date(startDate);
  const elapsedDuration = +new Date() - +new Date(startDate);
  const progress = Math.min(elapsedDuration / totalDuration, 1);

  const timerComponents = Object.keys(timeLeft).map(interval => {
    if (!Object.prototype.hasOwnProperty.call(timeLeft, interval)) {
        return null;
    }

    const value = (timeLeft as any)[interval];

    return (
      <div key={interval} className="text-center">
        <span className="text-4xl font-bold">{String(value).padStart(2, '0')}</span>
        <span className="block text-xs uppercase">{interval}</span>
      </div>
    );
  });
  
  const circumference = 2 * Math.PI * 45; // 2 * pi * radius

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#e6e6e6"
                strokeWidth="10"
                fill="transparent"
            />
            {/* Progress circle */}
            <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                className="text-blue-500"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - progress) }}
                transition={{ duration: 1, ease: "linear" }}
            />
        </svg>
        <div className="z-10 flex flex-col items-center">
            {Object.keys(timeLeft).length ? (
                <div className="grid grid-cols-4 gap-2 w-full px-4">
                    {timerComponents}
                </div>
            ) : (
                <span className="text-2xl font-bold">Evento Concluso!</span>
            )}
        </div>
    </div>
  );
};

export default CountdownTimer; 