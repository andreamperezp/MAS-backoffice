'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api';

export function Providers({ children }: { children: ReactNode }) {
  // Un QueryClient por sesión de navegador (no compartido entre requests en SSR).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
            // No reintentar errores de negocio/permisos: solo fallas de red o 5xx.
            retry: (intentos, error) => intentos < 2 && !(error instanceof ApiError && error.status < 500),
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
