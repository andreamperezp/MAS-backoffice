import type { Metadata } from 'next';
import { SolicitudesView } from '@/features/solicitudes/SolicitudesView';

export const metadata: Metadata = { title: 'Solicitudes' };

export default function SolicitudesPage() {
  return <SolicitudesView />;
}
