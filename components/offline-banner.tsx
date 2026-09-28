"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function snapshot() { return navigator.onLine; }
function serverSnapshot() { return true; }

export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  if (online) return null;
  return <aside className="offline-banner" role="status" aria-live="polite"><WifiOff aria-hidden="true" /><span>Você está offline. Algumas ações ficam pausadas até a conexão voltar.</span></aside>;
}
