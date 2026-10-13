import type { Metadata } from 'next';
import { AsociadosView } from '@/features/asociados/AsociadosView';

export const metadata: Metadata = { title: 'Asociados' };

export default function AsociadosPage() {
  return <AsociadosView />;
}
