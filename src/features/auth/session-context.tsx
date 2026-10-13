'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SessionUser } from '@/domain/types';

const SessionContext = createContext<SessionUser | null>(null);

export function SessionProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  return <SessionContext value={user}>{children}</SessionContext>;
}

/** Usuario logueado (validado en el servidor por el layout del backoffice). */
export function useSession(): SessionUser {
  const user = useContext(SessionContext);
  if (!user) throw new Error('useSession debe usarse dentro de <SessionProvider>.');
  return user;
}
