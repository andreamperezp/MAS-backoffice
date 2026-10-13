'use client';

import { useState } from 'react';
import { EstadoAsociadoBadge, SegmentoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type Columna } from '@/components/ui/DataTable';
import { detailStyles as d, PageHeader } from '@/components/ui/Detail';
import {
  DateField,
  FilterRow,
  LinkButton,
  PillGroup,
  SearchInput,
  Toolbar,
  ToolbarDivider,
  ToolbarPush,
  type Opcion,
} from '@/components/ui/Filters';
import { Icon } from '@/components/ui/Icon';
import { formatDni, formatFecha } from '@/domain/format';
import { MOTIVO_PAUSA_LABEL } from '@/domain/labels';
import type { FiltroAsociados } from '@/domain/schemas';
import type { Asociado, Segmento } from '@/domain/types';
import { mensajeDeError } from '@/lib/api';
import { useDebouncedValue } from '@/lib/hooks';
import { AsociadoDetalle } from './AsociadoDetalle';
import { ExportarModal } from './ExportarModal';
import { useAsociados } from './queries';
import styles from './Asociados.module.css';

const ESTADOS_FILTRO: Opcion<FiltroAsociados['estado']>[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'activo', label: 'Activos' },
  { valor: 'pausado', label: 'Pausados' },
  { valor: 'inactivo', label: 'Histórico' },
];

const SEGMENTOS: Opcion<'todos' | Segmento>[] = [
  { valor: 'todos', label: 'Todos los segmentos' },
  { valor: 'policia', label: 'Policía' },
  { valor: 'salud', label: 'Salud' },
  { valor: 'caja', label: 'Caja de Policía' },
];

const COLUMNAS: Columna<Asociado>[] = [
  {
    titulo: 'Asociado',
    celda: (a) => (
      <>
        <div className={d.primary}>
          {a.nombre} {a.apellido}
        </div>
        <div className={d.secondary}>DNI {formatDni(a.dni)}</div>
      </>
    ),
  },
  { titulo: 'Segmento', celda: (a) => <SegmentoBadge segmento={a.segmento} /> },
  { titulo: 'N.° de afiliado', celda: (a) => <span className={styles.codeChip}>{a.numeroAfiliado}</span> },
  {
    titulo: 'Contacto',
    celda: (a) => (
      <>
        <div className={`${d.text13} ${d.truncate}`} title={a.correo}>
          {a.correo}
        </div>
        <div className={d.secondary} style={{ fontSize: 12.5 }}>
          {a.telefono}
        </div>
      </>
    ),
  },
  { titulo: 'Alta', celda: (a) => <span className={d.muted}>{formatFecha(a.fechaAlta)}</span> },
  {
    titulo: 'Estado',
    celda: (a) => (
      <div>
        <EstadoAsociadoBadge estado={a.estado} />
        {a.motivoPausa && <div className={styles.motivo}>{MOTIVO_PAUSA_LABEL[a.motivoPausa]}</div>}
      </div>
    ),
  },
];

function Tarjeta({ a }: { a: Asociado }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div className={d.primary}>
            {a.nombre} {a.apellido}
          </div>
          <div className={d.secondary}>
            DNI {formatDni(a.dni)} · {formatFecha(a.fechaAlta)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--chevron)' }}>
          <EstadoAsociadoBadge estado={a.estado} />
          <Icon name="chevronRight" size={15} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <SegmentoBadge segmento={a.segmento} corto />
        <span className={styles.codeChip}>{a.numeroAfiliado}</span>
        {a.motivoPausa && <span className={d.secondary}>· {MOTIVO_PAUSA_LABEL[a.motivoPausa]}</span>}
      </div>
    </>
  );
}

export function AsociadosView() {
  const [estado, setEstado] = useState<FiltroAsociados['estado']>('todos');
  const [segmento, setSegmento] = useState<FiltroAsociados['segmento']>('todos');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const q = useDebouncedValue(busqueda.trim()) || undefined;

  const filtro: FiltroAsociados = { estado, segmento, q, desde: desde || undefined, hasta: hasta || undefined };
  const { data, isPending, error } = useAsociados(filtro);

  const [seleccionado, setSeleccionado] = useState<Asociado | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [exportando, setExportando] = useState(false);

  const c = data?.conteos;

  return (
    <>
      <PageHeader
        titulo="Asociados"
        subtitulo={
          c ? `${c.activo} activos · ${c.pausado} pausados · ${c.inactivo} en histórico.` : 'Cargando asociados…'
        }
      />

      <Toolbar>
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por DNI o N.° de afiliado" />
        <ToolbarDivider />
        <PillGroup label="Filtrar por estado" opciones={ESTADOS_FILTRO} valor={estado} onChange={setEstado} />
        <ToolbarDivider />
        <PillGroup label="Filtrar por segmento" opciones={SEGMENTOS} valor={segmento} onChange={setSegmento} />
        <ToolbarDivider />
        <FilterRow>
          <DateField label="Desde" value={desde} onChange={setDesde} max={hasta || undefined} />
          <DateField label="Hasta" value={hasta} onChange={setHasta} min={desde || undefined} />
          {(desde || hasta) && (
            <LinkButton
              onClick={() => {
                setDesde('');
                setHasta('');
              }}
            >
              Limpiar fechas
            </LinkButton>
          )}
        </FilterRow>
        <ToolbarPush>
          <Button variant="dark" icon="download" className={styles.exportar} onClick={() => setExportando(true)}>
            <span className={styles.exportLabelDesktop}>Exportar</span>
            <span className={styles.exportLabelMobile}>Exportar asociados</span>
          </Button>
        </ToolbarPush>
      </Toolbar>

      <DataTable
        items={data?.items}
        columnas={COLUMNAS}
        plantilla="1.5fr .9fr 1.1fr 1.4fr 1fr 1.1fr"
        tarjeta={(a) => <Tarjeta a={a} />}
        getId={(a) => a.id}
        getLabel={(a) => `Ver asociado ${a.nombre} ${a.apellido}`}
        onSelect={(a) => {
          setSeleccionado(a);
          setAbierto(true);
        }}
        cargando={isPending}
        error={error ? mensajeDeError(error) : null}
        vacio="No hay asociados que coincidan con la búsqueda o los filtros."
      />

      <AsociadoDetalle
        asociado={seleccionado}
        open={abierto}
        onClose={() => setAbierto(false)}
        onChange={setSeleccionado}
      />

      <ExportarModal open={exportando} onClose={() => setExportando(false)} filtroInicial={filtro} />
    </>
  );
}
