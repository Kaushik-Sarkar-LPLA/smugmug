'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function isInternalLink(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return false;
  if (anchor.target === '_blank' || anchor.hasAttribute('download')) return false;
  try {
    return new URL(href, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setActive(false);
    document.body.style.cursor = '';
    window.clearTimeout(timeoutRef.current);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest('a');
      if (!anchor || !isInternalLink(anchor)) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      const target = new URL(href, window.location.href);
      const current = new URL(window.location.href);
      if (target.pathname === current.pathname && target.search === current.search) return;

      setActive(true);
      document.body.style.cursor = 'wait';
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setActive(false);
        document.body.style.cursor = '';
      }, 20000);
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.clearTimeout(timeoutRef.current);
      document.body.style.cursor = '';
    };
  }, [pathname]);

  if (!active) return null;

  return (
    <div className="nav-route-loader nav-route-loader--active" role="status" aria-live="polite" aria-label="Loading page">
      <div className="nav-route-loader__bar" />
      <div className="nav-route-loader__panel">
        <div className="nav-route-loader__spinner" />
        <p className="nav-route-loader__label">Loading</p>
      </div>
    </div>
  );
}
