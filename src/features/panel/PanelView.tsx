'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { RolBadge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/Detail';
import { Icon, type IconName } from '@/components/ui/Icon';
import { formatFecha, iniciales } from '@/domain/format';
import { SECCIONES } from '@/domain/permisos';
import type { ResumenPanel } from '@/domain/types';
import { api, mensajeDeError } from '@/lib/api';
import styles from './Panel.module.css';

type Tono = 'teal' | 'yellow' | 'gray' | 'red';
const TONOS: Record<Tono, CSSProperties> = {
  teal: { background: 'var(--teal-pale)', color: 'var(--teal-dark)' },
  yellow: { background: 'var(--yellow-pale)', color: 'var(--yellow-ink)' },
  gray: { background: 'var(--gray-pale)', color: 'var(--dark)' },
  red: { background: 'var(--red-pale)', color: 'var(--red)' },
};

function Kpi(props: { icon: IconName; tono: Tono; valor?: number; label: string; labelCorto: string; sub: string }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiIcon} style={TONOS[props.tono]}>
        <Icon name={props.icon} size={18} />
      </div>
      <div className={styles.kpiValue}>{props.valor ?? '–'}</div>
      <div className={styles.kpiLabel}>
        <span className={styles.desktopOnly}>{props.label}</span>
        <span className={styles.mobileOnly}>{props.labelCorto}</span>
      </div>
      <div className={styles.kpiSub}>{props.sub}</div>
    </div>
  );
}

function Acceso(props: {
  href: string;
  icon: IconName;
  tono: Tono;
  titulo: string;
  detalle: string;
  className?: string;
}) {
  return (
    <Link href={props.href} className={`${styles.quick} ${props.className ?? ''}`}>
      <div className={styles.quickIcon} style={TONOS[props.tono]}>
        <Icon name={props.icon} size={20} />
      </div>
      <div>
        <div className={styles.quickTitle}>{props.titulo}</div>
        <div className={styles.quickDetail}>{props.detalle}</div>
      </div>
    </Link>
  );
}

export function PanelView() {
  const { data, error } = useQuery({
    queryKey: ['panel'],
    queryFn: ({ signal }) => api<ResumenPanel>('/api/panel', { signal }),
  });

  return (
    <div className={styles.page}>
      <PageHeader
        titulo="Panel"
        subtitulo={
          <>
            <span className={styles.desktopOnly}>Vista general del sistema · actualizado en tiempo real.</span>
            <span className={styles.mobileOnly}>Vista general del sistema.</span>
          </>
        }
      />

      {error && <p className={styles.error}>{mensajeDeError(error)}</p>}

      <div className={styles.kpis}>
        <Kpi
          icon="users"
          tono="teal"
          valor={data?.asociados.activo}
          label="Asociados activos"
          labelCorto="Asociados activos"
          sub={data ? `${data.asociados.pausado} pausados · ${data.asociados.inactivo} en histórico` : ' '}
        />
        <Kpi
          icon="checkSquare"
          tono="yellow"
          valor={data?.solicitudes.pendientes}
          label="Solicitudes pendientes"
          labelCorto="Pendientes"
          sub="de revisión manual"
        />
        <Kpi
          icon="shield"
          tono="gray"
          valor={data?.usuarios.activo}
          label="Usuarios del sistema"
          labelCorto="Usuarios"
          sub={data ? `${data.usuarios.inactivo} inactivos` : ' '}
        />
        <Kpi
          icon="calendar"
          tono="red"
          valor={data?.solicitudes.rechazadas}
          label="Solicitudes rechazadas"
          labelCorto="Rechazadas"
          sub="en seguimiento telefónico"
        />
      </div>

      <section>
        <h2 className={`${styles.sectionTitle} ${styles.desktopOnly}`}>Accesos rápidos</h2>
        <div className={styles.quicks}>
          <Acceso
            href={SECCIONES.asociados.href}
            icon="users"
            tono="teal"
            titulo="Ver Asociados"
            detalle="Gestionar altas, pausas y bajas"
          />
          <Acceso
            href={SECCIONES.usuarios.href}
            icon="shield"
            tono="gray"
            titulo="Gestionar Usuarios"
            detalle="Accesos y contraseñas del equipo"
          />
          <Acceso
            href={SECCIONES.solicitudes.href}
            icon="checkSquare"
            tono="yellow"
            titulo="Revisar Solicitudes"
            detalle={`${data?.solicitudes.pendientes ?? '–'} pendientes de revisión`}
            className={styles.desktopOnlyFlex}
          />
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
            <span className={styles.desktopOnly}>Usuarios creados recientemente</span>
            <span className={styles.mobileOnly}>Usuarios recientes</span>
          </h2>
          <Link href={SECCIONES.usuarios.href} className={styles.verTodos}>
            Ver todos →
          </Link>
        </div>
        <ul className={styles.users}>
          {data?.usuariosRecientes.map((u) => (
            <li key={u.id} className={styles.userRow}>
              <div className={styles.userInfo}>
                <div className={styles.avatar} aria-hidden="true">
                  {iniciales(u.nombre)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className={styles.userName}>{u.nombre}</div>
                  <div className={styles.userMeta}>
                    <span className={styles.desktopOnly}>{u.email}</span>
                    <span className={styles.mobileOnly}>{formatFecha(u.fechaCreacion)}</span>
                  </div>
                </div>
              </div>
              <div className={styles.userSide}>
                <RolBadge rol={u.rol} />
                <span className={`${styles.userMeta} ${styles.desktopOnly}`}>{formatFecha(u.fechaCreacion)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
