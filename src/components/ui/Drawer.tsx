'use client';

import { useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { useOverlay } from './useOverlay';
import styles from './Overlay.module.css';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  titulo: ReactNode;
  badges?: ReactNode;
  children: ReactNode;
  /** Acciones al pie del panel. */
  footer?: ReactNode;
  width?: number;
}

/** Panel lateral de detalle en desktop; bottom sheet en mobile. */
export function Drawer({ open, onClose, titulo, badges, children, footer, width }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const tituloId = useId();
  useOverlay(open, onClose, panelRef);

  return (
    <>
      <div
        className={`${styles.backdrop} ${styles.drawerBackdrop}`}
        data-open={open}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={styles.drawer}
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-hidden={!open}
        inert={!open}
        tabIndex={-1}
        style={width ? ({ '--drawer-width': `${width}px` } as CSSProperties) : undefined}
      >
        <div className={styles.header}>
          <div>
            <h2 id={tituloId} className={styles.title}>
              {titulo}
            </h2>
            {badges && <div className={styles.badges}>{badges}</div>}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        {children}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </>
  );
}
