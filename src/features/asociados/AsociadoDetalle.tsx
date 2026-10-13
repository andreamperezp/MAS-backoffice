'use client';

import { useState } from 'react';
import { EstadoAsociadoBadge, SegmentoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { detailStyles as d, InfoGrid, Section, Stack } from '@/components/ui/Detail';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatDni, formatFecha } from '@/domain/format';
import { MOTIVO_PAUSA_LABEL } from '@/domain/labels';
import type { AccionAsociado } from '@/domain/schemas';
import type { Asociado, MotivoPausa } from '@/domain/types';
import { mensajeDeError } from '@/lib/api';
import { Carnet } from './Carnet';
import { descargarCarnetPng, linkWhatsapp } from './carnet-utils';
import { PausarModal } from './PausarModal';
import { useAccionAsociado } from './queries';
import styles from './Asociados.module.css';

const MENSAJES: Record<AccionAsociado['accion'], string> = {
  pausar: 'Asociado pausado · notificación enviada por WhatsApp.',
  reactivar: 'Asociado reactivado · notificación enviada por WhatsApp.',
  desactivar: 'Movido a Histórico / Inactivos. El registro se conserva para auditoría.',
};

interface Props {
  asociado: Asociado | null;
  open: boolean;
  onClose: () => void;
  onChange: (a: Asociado) => void;
}

export function AsociadoDetalle({ asociado: a, open, onClose, onChange }: Props) {
  const toast = useToast();
  const accion = useAccionAsociado();
  const [pausando, setPausando] = useState(false);
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);
  // Feedback local de la sesión ("✓ Enviado" / "✓ Listo") por asociado.
  const [enviados, setEnviados] = useState<Set<string>>(() => new Set());
  const [descargados, setDescargados] = useState<Set<string>>(() => new Set());

  const ejecutar = (comando: AccionAsociado, alTerminar?: () => void) => {
    if (!a) return;
    accion.mutate(
      { id: a.id, comando },
      {
        onSuccess: (actualizado) => {
          onChange(actualizado);
          toast.exito(MENSAJES[comando.accion]);
          alTerminar?.();
        },
        onError: (e) => toast.error(mensajeDeError(e)),
      },
    );
  };

  const enviarWhatsapp = () => {
    if (!a) return;
    window.open(linkWhatsapp(a), '_blank', 'noopener,noreferrer');
    setEnviados((s) => new Set(s).add(a.id));
    toast.exito('Carnet enviado por WhatsApp.');
  };

  const descargar = async () => {
    if (!a) return;
    try {
      await descargarCarnetPng(a);
      setDescargados((s) => new Set(s).add(a.id));
      toast.exito('Carnet descargado.');
    } catch (e) {
      toast.error(mensajeDeError(e));
    }
  };

  const enviado = !!a && enviados.has(a.id);
  const descargado = !!a && descargados.has(a.id);

  return (
    <>
      <Drawer
        open={open && !!a}
        onClose={onClose}
        titulo={a ? `${a.nombre} ${a.apellido}` : ''}
        badges={
          a && (
            <>
              <SegmentoBadge segmento={a.segmento} />
              <EstadoAsociadoBadge estado={a.estado} />
            </>
          )
        }
        footer={
          a &&
          a.estado !== 'inactivo' && (
            <Stack>
              <h3 className={d.sectionTitle} style={{ marginBottom: 2 }}>
                Acciones
              </h3>
              {a.estado === 'activo' && (
                <Button
                  variant="warning"
                  size="lg"
                  block
                  icon="pause"
                  disabled={accion.isPending}
                  onClick={() => setPausando(true)}
                >
                  Pausar / Mora
                </Button>
              )}
              {a.estado === 'pausado' && (
                <Button
                  variant="approve"
                  size="lg"
                  block
                  icon="play"
                  disabled={accion.isPending}
                  onClick={() => ejecutar({ accion: 'reactivar' })}
                >
                  Reactivar
                </Button>
              )}
              <Button
                variant="danger"
                size="lg"
                block
                icon="trash"
                disabled={accion.isPending}
                onClick={() => setConfirmandoBaja(true)}
              >
                Desactivar
              </Button>
            </Stack>
          )
        }
      >
        {a && (
          <>
            {a.motivoPausa && <div className={d.notice}>Motivo de pausa: {MOTIVO_PAUSA_LABEL[a.motivoPausa]}</div>}

            <Section titulo="Datos del asociado">
              <InfoGrid
                items={[
                  ['DNI', formatDni(a.dni)],
                  ['Fecha de alta', formatFecha(a.fechaAlta)],
                  ['Correo', a.correo],
                  ['Teléfono', a.telefono],
                ]}
              />
            </Section>

            <Section titulo="Carnet digital">
              <Carnet asociado={a} />
              <p className={styles.formula}>N.° de afiliado = año de alta + N.° de DNI.</p>
              <div className={d.row} style={{ gap: 8 }}>
                <Button variant="whatsapp" icon="message" grow done={enviado} onClick={enviarWhatsapp}>
                  {enviado ? '✓ Enviado' : 'Enviar por WhatsApp'}
                </Button>
                <Button variant="outline" icon="download" grow done={descargado} onClick={descargar}>
                  {descargado ? '✓ Listo' : 'Descargar'}
                </Button>
              </div>
            </Section>
          </>
        )}
      </Drawer>

      <PausarModal
        open={pausando}
        nombre={a ? `${a.nombre} ${a.apellido}` : ''}
        pending={accion.isPending}
        onClose={() => setPausando(false)}
        onConfirm={(motivo: MotivoPausa) => ejecutar({ accion: 'pausar', motivo }, () => setPausando(false))}
      />

      <ConfirmModal
        open={confirmandoBaja}
        onClose={() => setConfirmandoBaja(false)}
        onConfirm={() => ejecutar({ accion: 'desactivar' }, () => setConfirmandoBaja(false))}
        pending={accion.isPending}
        titulo={a ? `Desactivar a ${a.nombre} ${a.apellido}` : 'Desactivar'}
        descripcion="Pasa al histórico de inactivos. El registro no se borra: se conserva para auditoría."
        confirmLabel="Desactivar"
      />
    </>
  );
}
