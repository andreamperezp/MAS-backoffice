import type { IconName } from '@/components/ui/Icon';
import { SECCIONES, type Seccion } from '@/domain/permisos';

export interface ItemNav {
  seccion: Seccion;
  href: string;
  label: string;
  icon: IconName;
  /** Se agrupa bajo el separador "Superadmin" en el sidebar. */
  soloSuperadmin: boolean;
}

export const NAV: ItemNav[] = [
  { seccion: 'panel', href: SECCIONES.panel.href, label: 'Panel', icon: 'grid', soloSuperadmin: false },
  {
    seccion: 'solicitudes',
    href: SECCIONES.solicitudes.href,
    label: 'Solicitudes',
    icon: 'checkSquare',
    soloSuperadmin: false,
  },
  { seccion: 'asociados', href: SECCIONES.asociados.href, label: 'Asociados', icon: 'users', soloSuperadmin: false },
  { seccion: 'usuarios', href: SECCIONES.usuarios.href, label: 'Usuarios', icon: 'shield', soloSuperadmin: true },
];
