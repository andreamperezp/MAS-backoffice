'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { RolBadge, SegmentoBadge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/Detail';
import { Icon, type IconName } from '@/components/ui/Icon';
import { diasDesde, formatDni, formatFecha, haceDias, iniciales } from '@/domain/format';
import { SECCIONES } from '@/domain/permisos';
import type { ResumenPanel } from '@/domain/types';
import { useSession } from '@/features/auth/session-context';
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

function Tarjeta(props: { titulo: string; tituloCorto: string; href: string; children: ReactNode }) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
          <span className={styles.desktopOnly}>{props.titulo}</span>
          <span className={styles.mobileOnly}>{props.tituloCorto}</span>
        </h2>
        <Link href={props.href} className={styles.verTodos}>
          Ver todos →
        </Link>
      </div>
      {props.children}
    </section>
  );
}

export function PanelView() {
  const { rol } = useSession();
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

      {rol === 'superadmin' ? <PanelSuperadmin data={data} /> : <PanelAdministrador data={data} />}
    </div>
  );
}

/** Visión del sistema completo: incluye usuarios y accesos del equipo. */
function PanelSuperadmin({ data }: { data?: ResumenPanel }) {
  return (
    <>
      <div className={styles.kpis}>
        <KpiAsociados data={data} />
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
          valor={data?.usuarios?.activo}
          label="Usuarios del sistema"
          labelCorto="Usuarios"
          sub={data?.usuarios ? `${data.usuarios.inactivo} inactivos` : ' '}
        />
        <KpiRechazadas data={data} />
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

      <Tarjeta titulo="Usuarios creados recientemente" tituloCorto="Usuarios recientes" href={SECCIONES.usuarios.href}>
        <ul className={styles.users}>
          {data?.usuariosRecientes?.map((u) => (
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
      </Tarjeta>
    </>
  );
}

/** Visión operativa del día a día: la cola de solicitudes y el padrón. */
function PanelAdministrador({ data }: { data?: ResumenPanel }) {
  const masAntigua = data?.solicitudesEnEspera[0];
  const espera = masAntigua ? diasDesde(masAntigua.fechaSolicitud) : null;
  const esperaSub = !data
    ? ' '
    : espera === null
      ? 'todo al día'
      : espera === 0
        ? 'la más antigua entró hoy'
        : `la más antigua espera ${espera} ${espera === 1 ? 'día' : 'días'}`;

  return (
    <>
      <div className={styles.kpis}>
        <KpiAsociados data={data} />
        <Kpi
          icon="checkSquare"
          tono="yellow"
          valor={data?.solicitudes.pendientes}
          label="Solicitudes pendientes"
          labelCorto="Pendientes"
          sub={esperaSub}
        />
        <Kpi
          icon="userPlus"
          tono="gray"
          valor={data?.altasDelMes}
          label="Altas del mes"
          labelCorto="Altas del mes"
          sub="nuevos asociados aprobados"
        />
        <KpiRechazadas data={data} />
      </div>

      <section>
        <h2 className={`${styles.sectionTitle} ${styles.desktopOnly}`}>Accesos rápidos</h2>
        <div className={styles.quicks}>
          <Acceso
            href={SECCIONES.solicitudes.href}
            icon="checkSquare"
            tono="yellow"
            titulo="Revisar Solicitudes"
            detalle={`${data?.solicitudes.pendientes ?? '–'} pendientes de revisión`}
          />
          <Acceso
            href={SECCIONES.asociados.href}
            icon="users"
            tono="teal"
            titulo="Ver Asociados"
            detalle="Pausas, carnets y exportación"
          />
          <Acceso
            href={`${SECCIONES.solicitudes.href}?estado=rechazada`}
            icon="rotateCcw"
            tono="red"
            titulo="Seguimiento de rechazadas"
            detalle={`${data?.solicitudes.rechazadas ?? '–'} para contactar por teléfono`}
          />
        </div>
      </section>

      <Tarjeta titulo="Solicitudes en espera" tituloCorto="En espera" href={SECCIONES.solicitudes.href}>
        {data && data.solicitudesEnEspera.length === 0 ? (
          <p className={styles.vacio}>No hay solicitudes pendientes. ¡Todo al día!</p>
        ) : (
          <ul className={styles.users}>
            {data?.solicitudesEnEspera.map((s) => (
              <li key={s.id} className={styles.userRow}>
                <div className={styles.userInfo}>
                  <div className={styles.avatar} aria-hidden="true">
                    {iniciales(`${s.nombre} ${s.apellido}`)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className={styles.userName}>
                      {s.nombre} {s.apellido}
                    </div>
                    <div className={styles.userMeta}>
                      DNI {formatDni(s.dni)} · {formatFecha(s.fechaSolicitud)}
                    </div>
                  </div>
                </div>
                <div className={styles.userSide}>
                  <SegmentoBadge segmento={s.segmento} corto />
                  <span className={`${styles.userMeta} ${styles.desktopOnly}`}>
                    {haceDias(diasDesde(s.fechaSolicitud))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </>
  );
}

function KpiAsociados({ data }: { data?: ResumenPanel }) {
  return (
    <Kpi
      icon="users"
      tono="teal"
      valor={data?.asociados.activo}
      label="Asociados activos"
      labelCorto="Asociados activos"
      sub={data ? `${data.asociados.pausado} pausados · ${data.asociados.inactivo} en histórico` : ' '}
    />
  );
}

function KpiRechazadas({ data }: { data?: ResumenPanel }) {
  return (
    <Kpi
      icon="calendar"
      tono="red"
      valor={data?.solicitudes.rechazadas}
      label="Solicitudes rechazadas"
      labelCorto="Rechazadas"
      sub="en seguimiento telefónico"
    />
  );
}
