'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress bar when pathname or searchParams change
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept clicks on links that cause route changes
  useEffect(() => {
    function handleAnchorClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const isTargetBlank = target.getAttribute('target') === '_blank';
      const isExternal = target.getAttribute('rel')?.includes('external') || href?.startsWith('http');
      const isHash = href?.startsWith('#');

      if (!href || isTargetBlank || isExternal || isHash) return;

      // Only start if it's a different destination or URL
      const currentUrl = window.location.pathname + window.location.search;
      if (href !== currentUrl) {
        setIsNavigating(true);
        setProgress(35);
        const timer1 = setTimeout(() => setProgress(65), 150);
        const timer2 = setTimeout(() => setProgress(85), 400);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    }

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => document.removeEventListener('click', handleAnchorClick, { capture: true });
  }, []);

  if (!isNavigating && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-teal-600 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(13,148,136,0.6)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? 'width 200ms ease-out, opacity 300ms ease-out 100ms' : 'width 300ms ease-out',
        }}
      />
    </div>
  );
}
