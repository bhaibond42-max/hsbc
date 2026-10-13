"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppPreferencesProvider } from "@/components/app-preferences-provider";
import { DocumentLoadCapture } from "@/components/document-load-capture";

type Toast = { id: number; message: string };

const ToastContext = createContext<(message: string) => void>(() => undefined);

export function useToast() {
  return useContext(ToastContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string) => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
  }, []);
  const value = useMemo(() => push, [push]);

  return (
    <QueryClientProvider client={client}>
      <ToastContext.Provider value={value}>
        <AppPreferencesProvider />
        <DocumentLoadCapture />
        {children}
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
          {toasts.map((toast) => (
            <div key={toast.id} className="rise rounded-full bg-neutral-950 px-4 py-2 text-sm text-white shadow-lg">
              {toast.message}
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    </QueryClientProvider>
  );
}
