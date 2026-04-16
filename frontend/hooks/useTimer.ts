// frontend/hooks/useTimer.ts
import { useState, useEffect } from "react";

export const useTimer = (initialMinutes: number, onTimeUp?: () => void) => {
  const [seconds, setSeconds] = useState(initialMinutes * 60);

  // Magic fix: Update the countdown if initialMinutes changes (like when loading from local storage)
  useEffect(() => {
    setSeconds(initialMinutes * 60);
  }, [initialMinutes]);

  useEffect(() => {
    if (seconds <= 0 && initialMinutes > 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, initialMinutes, onTimeUp]);

  const formatTime = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return { time: formatTime(), totalSeconds: seconds };
};