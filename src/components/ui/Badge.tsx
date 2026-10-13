import type { ReactNode } from 'react';
import {
  ESTADO_ASOCIADO_LABEL,
  ESTADO_SOLICITUD_LABEL,
  ESTADO_USUARIO_LABEL,
  ROL_LABEL,
  SEGMENTO_LABEL,
  SEGMENTO_LABEL_CORTO,
} from '@/domain/labels';
import type { EstadoAsociado, EstadoSolicitud, EstadoUsuario, Rol, Segmento } from '@/domain/types';
import styles from './Badge.module.css';

export type BadgeTone = 'teal' | 'yellow' | 'gray' | 'red' | 'dark' | 'subtle';

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

const TONO_SEGMENTO: Record<Segmento, BadgeTone> = { policia: 'teal', salud: 'yellow', caja: 'gray' };
const TONO_SOLICITUD: Record<EstadoSolicitud, BadgeTone> = { pendiente: 'gray', rechazada: 'red', aprobada: 'teal' };
const TONO_ASOCIADO: Record<EstadoAsociado, BadgeTone> = { activo: 'teal', pausado: 'yellow', inactivo: 'gray' };
const TONO_USUARIO: Record<EstadoUsuario, BadgeTone> = { activo: 'teal', inactivo: 'gray' };
const TONO_ROL: Record<Rol, BadgeTone> = { superadmin: 'dark', administrador: 'gray' };

export const SegmentoBadge = ({ segmento, corto = false }: { segmento: Segmento; corto?: boolean }) => (
  <Badge tone={TONO_SEGMENTO[segmento]}>{(corto ? SEGMENTO_LABEL_CORTO : SEGMENTO_LABEL)[segmento]}</Badge>
);

export const EstadoSolicitudBadge = ({ estado }: { estado: EstadoSolicitud }) => (
  <Badge tone={TONO_SOLICITUD[estado]}>{ESTADO_SOLICITUD_LABEL[estado]}</Badge>
);

export const EstadoAsociadoBadge = ({ estado }: { estado: EstadoAsociado }) => (
  <Badge tone={TONO_ASOCIADO[estado]}>{ESTADO_ASOCIADO_LABEL[estado]}</Badge>
);

export const EstadoUsuarioBadge = ({ estado }: { estado: EstadoUsuario }) => (
  <Badge tone={TONO_USUARIO[estado]}>{ESTADO_USUARIO_LABEL[estado]}</Badge>
);

export const RolBadge = ({ rol }: { rol: Rol }) => <Badge tone={TONO_ROL[rol]}>{ROL_LABEL[rol]}</Badge>;
