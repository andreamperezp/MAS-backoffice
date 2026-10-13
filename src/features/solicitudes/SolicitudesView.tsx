'use client';

import { useState } from 'react';
import { Badge, EstadoSolicitudBadge, SegmentoBadge } from '@/components/ui/Badge';
import { DataTable, type Columna } from '@/components/ui/DataTable';
import { detailStyles as d, PageHeader } from '@/components/ui/Detail';
import { PillGroup, SearchInput, Toolbar, ToolbarDivider, type Opcion } from '@/components/ui/Filters';
import { Icon } from '@/components/ui/Icon';
import { formatDni, formatFecha } from '@/domain/format';
import type { FiltroSolicitudes } from '@/domain/schemas';
import type { Segmento, Solicitud } from '@/domain/types';
import { mensajeDeError } from '@/lib/api';
import { useDebouncedValue } from '@/lib/hooks';
import { SolicitudDetalle } from './SolicitudDetalle';
import { useSolicitudes } from './queries';

const ESTADOS: Opcion<FiltroSolicitudes['estado']>[] = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'pendiente', label: 'Pendientes' },
  { valor: 'rechazada', label: 'Rechazadas' },
];

const SEGMENTOS: Opcion<'todos' | Segmento>[] = [
  { valor: 'todos', label: 'Todos los segmentos' },
  { valor: 'policia', label: 'Policía' },
  { valor: 'salud', label: 'Salud' },
  { valor: 'caja', label: 'Caja de Policía' },
];

const COLUMNAS: Columna<Solicitud>[] = [
  {
    titulo: 'Solicitante',
    celda: (s) => (
      <>
        <div className={d.primary} style={{ fontWeight: 400 }}>
          {s.nombre} {s.apellido}
        </div>
        <div className={d.secondary}>DNI {formatDni(s.dni)}</div>
      </>
    ),
  },
  { titulo: 'Segmento', celda: (s) => <SegmentoBadge segmento={s.segmento} /> },
  {
    titulo: 'Contacto',
    celda: (s) => (
      <>
        <div className={`${d.text13} ${d.truncate}`} title={s.correo}>
          {s.correo}
        </div>
        <div className={d.secondary} style={{ fontSize: 12.5 }}>
          {s.telefono}
        </div>
      </>
    ),
  },
  {
    titulo: 'Documentos',
    celda: (s) => (
      <div className={d.muted} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
        <Icon name="file" size={15} />
        {s.documentos.length} archivos
      </div>
    ),
  },
  { titulo: 'Fecha', celda: (s) => <span className={d.muted}>{formatFecha(s.fechaSolicitud)}</span> },
  { titulo: 'Estado', celda: (s) => <EstadoSolicitudBadge estado={s.estado} /> },
];

function Tarjeta({ s }: { s: Solicitud }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div className={d.primary}>
            {s.nombre} {s.apellido}
          </div>
          <div className={d.secondary}>
            DNI {formatDni(s.dni)} · {formatFecha(s.fechaSolicitud)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--chevron)' }}>
          <EstadoSolicitudBadge estado={s.estado} />
          <Icon name="chevronRight" size={15} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <SegmentoBadge segmento={s.segmento} corto />
        <Badge tone="subtle">📎 {s.documentos.length} archivos</Badge>
      </div>
    </>
  );
}

export function SolicitudesView() {
  const [estado, setEstado] = useState<FiltroSolicitudes['estado']>('pendiente');
  const [segmento, setSegmento] = useState<FiltroSolicitudes['segmento']>('todos');
  const [busqueda, setBusqueda] = useState('');
  const q = useDebouncedValue(busqueda.trim()) || undefined;

  const { data, isPending, error } = useSolicitudes({ estado, segmento, q });
  const [seleccionada, setSeleccionada] = useState<Solicitud | null>(null);
  const [abierta, setAbierta] = useState(false);

  const abrir = (s: Solicitud) => {
    setSeleccionada(s);
    setAbierta(true);
  };

  return (
    <>
      <PageHeader
        titulo="Solicitudes"
        subtitulo={
          data ? (
            <>
              {data.total} de {data.conteos.total} solicitudes · {data.conteos.pendiente} pendientes de revisión. Las
              aprobadas pasan al listado de Asociados.
            </>
          ) : (
            'Cargando solicitudes…'
          )
        }
      />

      <Toolbar>
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o DNI" />
        <PillGroup label="Filtrar por estado" opciones={ESTADOS} valor={estado} onChange={setEstado} />
        <ToolbarDivider />
        <PillGroup label="Filtrar por segmento" opciones={SEGMENTOS} valor={segmento} onChange={setSegmento} />
      </Toolbar>

      <DataTable
        items={data?.items}
        columnas={COLUMNAS}
        plantilla="1.7fr 1fr 1.4fr 1fr .9fr .9fr"
        tarjeta={(s) => <Tarjeta s={s} />}
        getId={(s) => s.id}
        getLabel={(s) => `Ver solicitud de ${s.nombre} ${s.apellido}`}
        onSelect={abrir}
        cargando={isPending}
        error={error ? mensajeDeError(error) : null}
        vacio="No hay solicitudes que coincidan con la búsqueda o los filtros."
      />

      <SolicitudDetalle
        solicitud={seleccionada}
        open={abierta}
        onClose={() => setAbierta(false)}
        onChange={setSeleccionada}
      />
    </>
  );
}
