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

  return (
    <div id="vanta-root" className={containerClass}>
      <BackButton />
      <div style={{ zIndex: 100 }}>
        {children}
      </div>
    </div>
  );
}
