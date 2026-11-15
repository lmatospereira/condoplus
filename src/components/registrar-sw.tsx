"use client";

import { useEffect } from "react";

/** Registra o service worker (necessário para instalar o app) em produção ou localhost. */
export function RegistrarSw() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const local = ["localhost", "127.0.0.1"].includes(location.hostname);
    if (process.env.NODE_ENV !== "production" && !local) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
