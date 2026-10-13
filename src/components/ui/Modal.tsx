'use client';

import { useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { Button } from './Button';
import { useOverlay } from './useOverlay';
import styles from './Overlay.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  titulo: ReactNode;
  descripcion?: ReactNode;
  children?: ReactNode;
  acciones: ReactNode;
  width?: number;
}

/** Modal centrado en desktop; anclado abajo en mobile. Se desmonta al cerrar. */
export function Modal({ open, onClose, titulo, descripcion, children, acciones, width }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const tituloId = useId();
  useOverlay(open, onClose, panelRef);

  if (!open) return null;

  return (
    <>
      <div
        className={`${styles.backdrop} ${styles.modalBackdrop}`}
        data-open="true"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        style={width ? ({ '--modal-width': `${width}px` } as CSSProperties) : undefined}
      >
        <div className={styles.modalHeader}>
          <h2 id={tituloId} className={styles.modalTitle}>
            {titulo}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        {descripcion && <p className={styles.modalDescription}>{descripcion}</p>}
        {children}
        <div className={styles.modalActions}>{acciones}</div>
      </div>
    </>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  descripcion: ReactNode;
  confirmLabel: string;
  pending?: boolean;
}

/** Confirmación para acciones que no se pueden deshacer desde la UI. */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  titulo,
  descripcion,
  confirmLabel,
  pending,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      titulo={titulo}
      descripcion={descripcion}
      acciones={
        <>
          <Button variant="ghost" size="md" grow onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" size="md" grow onClick={onConfirm} disabled={pending}>
            {pending ? 'Procesando…' : confirmLabel}
          </Button>
        </>
      }
    />
  );
}
