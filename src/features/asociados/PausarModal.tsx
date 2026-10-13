'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RadioOption, Stack } from '@/components/ui/Detail';
import { Modal } from '@/components/ui/Modal';
import { MOTIVO_PAUSA_LABEL } from '@/domain/labels';
import { MOTIVOS_PAUSA, type MotivoPausa } from '@/domain/types';

interface Props {
  open: boolean;
  nombre: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: (motivo: MotivoPausa) => void;
}

export function PausarModal({ open, nombre, pending, onClose, onConfirm }: Props) {
  const [motivo, setMotivo] = useState<MotivoPausa | null>(null);

  const cerrar = () => {
    setMotivo(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={cerrar}
      titulo={`Pausar a ${nombre}`}
      descripcion="Elegí el motivo. Se notifica automáticamente por WhatsApp al asociado."
      acciones={
        <>
          <Button variant="ghost" size="md" grow onClick={cerrar}>
            Cancelar
          </Button>
          <Button
            variant="warning"
            size="md"
            grow
            disabled={!motivo || pending}
            onClick={() => motivo && onConfirm(motivo)}
          >
            {pending ? 'Pausando…' : 'Confirmar pausa'}
          </Button>
        </>
      }
    >
      <fieldset style={{ border: 0, padding: 0, margin: '0 0 22px' }}>
        <legend className="sr-only">Motivo de la pausa</legend>
        <Stack>
          {MOTIVOS_PAUSA.map((m) => (
            <RadioOption key={m} name="motivo-pausa" value={m} checked={motivo === m} onChange={() => setMotivo(m)}>
              {MOTIVO_PAUSA_LABEL[m]}
            </RadioOption>
          ))}
        </Stack>
      </fieldset>
    </Modal>
  );
}
