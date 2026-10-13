import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SolicitudesView } from '@/features/solicitudes/SolicitudesView';

export const metadata: Metadata = { title: 'Solicitudes' };

export default function SolicitudesPage() {
  // La vista lee `searchParams` (filtro inicial): va detrás de Suspense.
  return (
    <Suspense>
      <SolicitudesView />
    </Suspense>
  );
}
