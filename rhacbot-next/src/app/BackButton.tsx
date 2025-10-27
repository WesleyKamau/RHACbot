"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";

export default function BackButton(): React.ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();

  // Don't render on the homepage
  if (!pathname || pathname === "/") return null;

  const handleClick = () => {
    // If we're on the 404 page, route to home instead of history back
    if (pathname === "/404" || pathname === "/404.html") {
      router.push("/");
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      aria-label={pathname === "/404" ? "Back to home" : "Go back"}
      onClick={handleClick}
      className="back-button"
    >
      ← {pathname === "/404" ? "Home" : "Back"}
    </button>
  );
}
