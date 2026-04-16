import { useEffect, useRef, useState } from 'react';

export default function Timer({ duration, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef(null);

  useEffect(() => {
    setTimeLeft(duration);
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          onExpire?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [duration]);

  const R = 44;
  const circumference = 2 * Math.PI * R;
  const progress = timeLeft / duration;
  const dashoffset = circumference * (1 - progress);

  const color =
    timeLeft > duration * 0.5
      ? '#22C55E'
      : timeLeft > duration * 0.25
      ? '#EAB308'
      : '#EF4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="110" height="110" className="-rotate-90">
        <circle cx="55" cy="55" r={R} fill="none" stroke="#1A1A3E" strokeWidth="8" />
        <circle
          cx="55"
          cy="55"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      <span
        className="absolute text-3xl font-black"
        style={{ color, transition: 'color 0.5s ease' }}
      >
        {timeLeft}
      </span>
    </div>
  );
}
