import { useEffect, useState } from "react";

export default function useCountdown(targetDate) {
  const [diff, setDiff] = useState(() =>
    Math.max(0, targetDate.getTime() - Date.now())
  );
  useEffect(() => {
    const id = setInterval(
      () => setDiff(Math.max(0, targetDate.getTime() - Date.now())),
      1000
    );
    return () => clearInterval(id);
  }, [targetDate]);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, finished: diff === 0 };
}
