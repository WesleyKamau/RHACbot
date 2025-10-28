"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function BackButton(): React.ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    // Check if there's browser history from within the app
    setHasHistory(window.history.length > 1);
  }, []);

  // Don't render on the homepage
  if (!pathname || pathname === "/") return null;

  const handleClick = () => {
    // If we're on the 404 page or there's no history, route to home
    if (pathname === "/404" || pathname === "/404.html" || !hasHistory) {
      router.push("/");
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      aria-label={pathname === "/404" || !hasHistory ? "Back to home" : "Go back"}
      onClick={handleClick}
      className="back-button"
    >
      ← {pathname === "/404" || !hasHistory ? "Home" : "Back"}
    </button>
  );
}
