'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PillGroup, type Opcion } from '@/components/ui/Filters';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ESTADO_ASOCIADO_LABEL, SEGMENTO_LABEL } from '@/domain/labels';
import type { FiltroAsociados } from '@/domain/schemas';
import type { Segmento } from '@/domain/types';
import { useConteoExportacion, urlExportacion } from './queries';
import styles from './Asociados.module.css';

const SEGMENTOS: Opcion<'todos' | Segmento>[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'policia', label: 'Policía' },
  { valor: 'salud', label: 'Salud' },
  { valor: 'caja', label: 'Caja' },
];

const ESTADOS: Opcion<FiltroAsociados['estado']>[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'activo', label: 'Activos' },
  { valor: 'pausado', label: 'Pausados' },
  { valor: 'inactivo', label: 'Inactivos' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Los filtros del listado precargan el modal. */
  filtroInicial: FiltroAsociados;
}

export function ExportarModal({ open, onClose, filtroInicial }: Props) {
  return open ? <Contenido onClose={onClose} filtroInicial={filtroInicial} /> : null;
}

/** Montado solo mientras el modal está abierto, así el estado arranca de los filtros vigentes. */
function Contenido({ onClose, filtroInicial }: Omit<Props, 'open'>) {
  const toast = useToast();
  const [segmento, setSegmento] = useState(filtroInicial.segmento);
  const [estado, setEstado] = useState(filtroInicial.estado);
  const [desde, setDesde] = useState(filtroInicial.desde ?? '');
  const [hasta, setHasta] = useState(filtroInicial.hasta ?? '');

  const filtro: FiltroAsociados = {
    segmento,
    estado,
    desde: desde || undefined,
    hasta: hasta || undefined,
    q: undefined,
  };
  const { data: cantidad } = useConteoExportacion(filtro, true);

  const exportar = () => {
    // Descarga directa: el endpoint responde con Content-Disposition: attachment.
    const link = document.createElement('a');
    link.href = urlExportacion(filtro);
    link.click();

    const partes = [
      estado !== 'todos' && ESTADO_ASOCIADO_LABEL[estado],
      segmento !== 'todos' && SEGMENTO_LABEL[segmento],
      (desde || hasta) && `${desde || '…'} a ${hasta || '…'}`,
    ].filter(Boolean);
    toast.exito(`Exportando ${cantidad ?? ''} asociados${partes.length ? ` · filtro: ${partes.join(', ')}` : ''}.`);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      width={460}
      titulo="Exportar asociados"
      descripcion="Elegí qué asociados incluir en la exportación."
      acciones={
        <>
          <Button variant="ghost" size="md" grow onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="dark" size="md" grow onClick={exportar} disabled={cantidad === 0}>
            Exportar
          </Button>
        </>
      }
    >
      <div className={styles.exportFields}>
        <div>
          <div className={styles.fieldLabel}>Segmento</div>
          <PillGroup label="Segmento" opciones={SEGMENTOS} valor={segmento} onChange={setSegmento} />
        </div>
        <div>
          <div className={styles.fieldLabel}>Estado</div>
          <PillGroup label="Estado" opciones={ESTADOS} valor={estado} onChange={setEstado} />
        </div>
        <div>
          <div className={styles.fieldLabel} id="rango-label">
            Rango de fechas
          </div>
          <div className={styles.rango} role="group" aria-labelledby="rango-label">
            <input
              type="date"
              aria-label="Desde"
              value={desde}
              max={hasta || undefined}
              onChange={(e) => setDesde(e.target.value)}
            />
            <span>a</span>
            <input
              type="date"
              aria-label="Hasta"
              value={hasta}
              min={desde || undefined}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
        </div>
      </div>

      <p className={styles.exportCount} aria-live="polite">
        <b>{cantidad ?? '…'}</b> asociados coinciden con estos filtros.
      </p>
    </Modal>
  );
}
