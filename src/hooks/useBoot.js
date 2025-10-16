import { useEffect, useState } from "react";

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve; // don't block if it fails
    img.src = src;
  });
}

export default function useBoot({ assets = [], minDuration = 1200 }) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let raf;
    let stop = false;
    const start = Date.now();
    const preloading = Promise.all(assets.map(preloadImage));

    const tick = () => {
      if (stop) return;
      setProgress((p) => Math.min(90, p + 1.8));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    (async () => {
      await preloading;
      const elapsed = Date.now() - start;
      const wait = Math.max(0, minDuration - elapsed);
      setTimeout(() => {
        setProgress(100);
        setTimeout(() => setReady(true), 250);
      }, wait);
    })();

    return () => {
      stop = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [assets, minDuration]);

  return { ready, progress };
}
