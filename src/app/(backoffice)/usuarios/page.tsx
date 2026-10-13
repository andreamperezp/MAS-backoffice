import type { Metadata } from 'next';
import { UsuariosView } from '@/features/usuarios/UsuariosView';

export const metadata: Metadata = { title: 'Usuarios' };

export default function UsuariosPage() {
  return <UsuariosView />;
}
