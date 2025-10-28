"use client";
import React, { useEffect, useState, useRef } from "react";
import BackButton from "./BackButton";
import { usePathname, useRouter } from "next/navigation";
import { healthCheck } from "../../lib/api";

type Props = {
  children: React.ReactNode;
};

export default function AppShell({ children }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Check if the page has scrollable-page class
    if (containerRef.current) {
      const hasScrollable = containerRef.current.querySelector('.scrollable-page') !== null;
      setIsScrollable(hasScrollable);
    }
  }, [children]);

  // Call health check on mount and when navigating to send-message or add-chat
  useEffect(() => {
    const wakeUpBackend = async () => {
      try {
        await healthCheck();
        console.log('Backend health check completed');
      } catch (error) {
        console.warn('Backend health check failed:', error);
      }
    };

    // Always call on mount
    wakeUpBackend();

    // Also call when navigating to specific pages
    if (pathname === '/send-message' || pathname === '/add-chat') {
      wakeUpBackend();
    }
  }, [pathname]);
  
  const stylishEnv = (process.env.NEXT_PUBLIC_STYLISH || process.env.NEXT_PUBLIC_REACT_APP_STYLISH || "").toString().toLowerCase();
  const stylishEnabled = ["1", "true", "yes", "on"].includes(stylishEnv);

  const containerClass = stylishEnabled ? 'vanta-container' : 'non-stylish-container';

  return (
    <div id="vanta-root" className={containerClass}>
      <BackButton />
      <div 
        ref={containerRef}
        style={{ 
          zIndex: 100,
          ...(isMobile ? {
            // Mobile: no centering, natural flow
            width: '100%',
            height: 'auto',
            display: 'block'
          } : {})
        }}
        className={isScrollable ? 'scrollable-container' : ''}
      >
        {children}
      </div>
    </div>
  );
}
