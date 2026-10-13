'use client';

import { EstadoSolicitudBadge, SegmentoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { detailStyles as d, InfoGrid, Section, Stack } from '@/components/ui/Detail';
import { Drawer } from '@/components/ui/Drawer';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { formatDni, formatFecha } from '@/domain/format';
import { DOCUMENTO_LABEL } from '@/domain/labels';
import type { AccionSolicitud } from '@/domain/schemas';
import type { Solicitud } from '@/domain/types';
import { mensajeDeError } from '@/lib/api';
import { useAccionSolicitud } from './queries';
import styles from './SolicitudDetalle.module.css';

const MENSAJES: Record<AccionSolicitud, string> = {
  aprobar: 'Solicitud aprobada — se movió a Asociados con su carnet digital.',
  rechazar: 'Solicitud rechazada. Seguimiento telefónico para pedir el reenvío.',
  volver_a_pendiente: 'De vuelta en Pendientes para revisión.',
};

interface Props {
  solicitud: Solicitud | null;
  open: boolean;
  onClose: () => void;
  /** Se llama con la solicitud actualizada tras rechazar / volver a pendiente. */
  onChange: (s: Solicitud) => void;
}

export function SolicitudDetalle({ solicitud: s, open, onClose, onChange }: Props) {
  const toast = useToast();
  const accion = useAccionSolicitud();

  const ejecutar = (tipo: AccionSolicitud) => {
    if (!s) return;
    accion.mutate(
      { id: s.id, accion: tipo },
      {
        onSuccess: ({ solicitud }) => {
          toast.exito(MENSAJES[tipo]);
          if (tipo === 'aprobar') onClose();
          else onChange(solicitud);
        },
        onError: (e) => toast.error(mensajeDeError(e)),
      },
    );
  };

  const pendiente = s?.estado === 'pendiente';
  const enCurso = accion.isPending;

  return (
    <Drawer
      open={open && !!s}
      onClose={onClose}
      titulo={s ? `${s.nombre} ${s.apellido}` : ''}
      badges={
        s && (
          <>
            <SegmentoBadge segmento={s.segmento} />
            <EstadoSolicitudBadge estado={s.estado} />
          </>
        )
      }
      footer={
        s &&
        (pendiente ? (
          <div className={d.row}>
            <Button
              variant="approve"
              size="lg"
              grow
              icon="check"
              iconSize={15}
              disabled={enCurso}
              onClick={() => ejecutar('aprobar')}
            >
              Aprobar
            </Button>
            <Button
              variant="danger"
              size="lg"
              grow
              icon="close"
              iconSize={15}
              disabled={enCurso}
              onClick={() => ejecutar('rechazar')}
            >
              Rechazar
            </Button>
          </div>
        ) : (
          <>
            <Button
              variant="neutral"
              size="lg"
              block
              icon="rotateCcw"
              iconSize={15}
              disabled={enCurso}
              onClick={() => ejecutar('volver_a_pendiente')}
            >
              Volver a pendiente
            </Button>
            <p className={d.hint}>
              Se usa cuando la administrativa hizo el seguimiento telefónico y la persona reenvió lo que faltaba.
            </p>
          </>
        ))
      }
    >
      {s && (
        <>
          <Section titulo="Datos de la solicitud">
            <InfoGrid
              items={[
                ['DNI', formatDni(s.dni)],
                ['Fecha de solicitud', formatFecha(s.fechaSolicitud)],
                ['Correo', s.correo],
                ['Teléfono', s.telefono],
              ]}
            />
          </Section>

          <Section titulo="Documentos cargados">
            <Stack>
              {s.documentos.map((doc) => {
                const esImagen = /\.(jpe?g|png|webp|heic)$/i.test(doc.nombreArchivo);
                return (
                  <div key={doc.tipo} className={styles.docCard}>
                    <div className={styles.docThumb}>
                      <Icon name={esImagen ? 'image' : 'file'} size={20} />
                    </div>
                    <div className={styles.docInfo}>
                      <div className={styles.docTitle}>{DOCUMENTO_LABEL[doc.tipo]}</div>
                      <div className={styles.docFile}>{doc.nombreArchivo}</div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.docLink}
                      aria-label={`Ver ${DOCUMENTO_LABEL[doc.tipo]} (se abre en otra pestaña)`}
                    >
                      Ver
                    </a>
                  </div>
                );
              })}
            </Stack>
          </Section>

          <Section titulo="Carnet digital">
            {pendiente ? (
              <div className={d.placeholderBox}>
                <Icon name="briefcase" size={22} />
                <span>Se genera automáticamente al aprobar y la solicitud pasa a Asociados.</span>
              </div>
            ) : (
              <div className={d.placeholderBox}>
                <Icon name="xCircle" size={22} style={{ color: 'var(--red)' }} />
                <span>Solicitud rechazada — no se genera carnet.</span>
              </div>
            )}
          </Section>
        </>
      )}
    </Drawer>
  );
}
