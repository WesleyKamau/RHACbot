"use client";
import React, { useEffect, useRef } from "react";

export default function VantaLoader(): null {
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    const stylishEnv = (process.env.NEXT_PUBLIC_STYLISH || process.env.NEXT_PUBLIC_REACT_APP_STYLISH || "").toString().toLowerCase();
    const stylishEnabled = ["1", "true", "yes", "on"].includes(stylishEnv);

    if (!stylishEnabled) return;
    
    // Disable Vanta on mobile screens (640px and below)
    if (typeof window !== "undefined" && window.innerWidth <= 640) return;

    const loadVanta = () => {
      // Target the vanta root by id (vanta-root) so the loader is deterministic
      const el = document.getElementById("vanta-root") as HTMLElement | null;
      if (!el) return;
      // @ts-ignore
      if ((window as any).VANTA && (window as any).VANTA.FOG) {
        // @ts-ignore
        vantaEffect.current = (window as any).VANTA.FOG({
          el,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          highlightColor: '#ff0077',
          midtoneColor: '#841e10',
          lowlightColor: '#ff00d1',
        });
      }
    };

    // If VANTA already present, initialize; otherwise load the script and init on load.
    if (typeof window !== "undefined" && (window as any).VANTA) {
      loadVanta();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js";
      script.async = true;
      script.onload = loadVanta;
      document.body.appendChild(script);
    }

    return () => {
      if (vantaEffect.current && vantaEffect.current.destroy) vantaEffect.current.destroy();
    };
  }, []);

  return null;
}
