"use client";
import React, { useEffect } from "react";
import BackButton from "./BackButton";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

export default function AppShell({ children }: Props) {
  const stylishEnv = (process.env.NEXT_PUBLIC_STYLISH || process.env.NEXT_PUBLIC_REACT_APP_STYLISH || "").toString().toLowerCase();
  const stylishEnabled = ["1", "true", "yes", "on"].includes(stylishEnv);

  const containerClass = stylishEnabled ? 'vanta-container' : 'non-stylish-container';

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname) return;

    // Allowlist of known app routes — extend if you add more pages
    const allowed = new Set(["/", "/add-chat", "/send-message"]);

    // Skip assets, next internals and api routes
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static') || pathname.includes('.')) return;

    // If the path is not allowed and it's not already the not-found path, redirect to /404
    if (!allowed.has(pathname) && pathname !== '/404') {
      // Use replace so user doesn't accumulate invalid paths in history
      router.replace('/404');
    }
  }, [pathname, router]);

  return (
    <div id="vanta-root" className={containerClass}>
      <BackButton />
      <div style={{ zIndex: 100 }}>
        {children}
      </div>
    </div>
  );
}
