import { redirect } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ShellSkeleton } from '@/components/layout/ShellSkeleton';
import { usuarioActual } from '@/server/auth/session';

/**
 * Layout de las pantallas autenticadas. La lectura de la sesión es dato de
 * request, así que vive detrás de un <Suspense> (requisito de Cache Components).
 */
export default function BackofficeLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <SesionValidada>{children}</SesionValidada>
    </Suspense>
  );
}

async function SesionValidada({ children }: { children: ReactNode }) {
  const user = await usuarioActual();
  // JWT inválido o usuario desactivado: limpiar la cookie antes de ir al login.
  if (!user) redirect('/api/auth/salir');
  return <AppShell user={user}>{children}</AppShell>;
}
