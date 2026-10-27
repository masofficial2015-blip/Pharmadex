'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  function clearAllTimers() {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }

  function startProgress() {
    clearAllTimers();
    setVisible(true);
    setProgress(35);

    // Increment progress
    const t1 = setTimeout(() => setProgress(70), 120);
    const t2 = setTimeout(() => setProgress(88), 300);

    // Watchdog safety: automatically complete and hide after 700ms max
    // Prevents progress bar from EVER hanging or staying stuck on mobile or cached routes
    const tWatchdog = setTimeout(() => {
      finishProgress();
    }, 700);

    timersRef.current.push(t1, t2, tWatchdog);
  }

  function finishProgress() {
    clearAllTimers();
    setProgress(100);
    const tFade = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);
    timersRef.current.push(tFade);
  }

  // Complete progress whenever route or query params change
  useEffect(() => {
    if (visible) {
      finishProgress();
    }
  }, [pathname, searchParams]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  // Listen to navigation clicks
  useEffect(() => {
    function handleAnchorClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const isTargetBlank = target.getAttribute('target') === '_blank';
      const isExternal =
        target.getAttribute('rel')?.includes('external') ||
        href?.startsWith('http://') ||
        href?.startsWith('https://');
      const isHash = href?.startsWith('#');

      if (!href || isTargetBlank || isExternal || isHash) return;

      const currentPath = window.location.pathname;
      const currentFull = currentPath + window.location.search;

      // Start progress if destination is different
      if (href !== currentFull && href !== currentPath) {
        startProgress();
      }
    }

    document.addEventListener('click', handleAnchorClick, { capture: true });
    window.addEventListener('popstate', finishProgress);

    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
      window.removeEventListener('popstate', finishProgress);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-teal-600 shadow-[0_0_8px_rgba(13,148,136,0.7)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition:
            progress === 100
              ? 'width 150ms ease-out, opacity 250ms ease-out 100ms'
              : 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  );
}
