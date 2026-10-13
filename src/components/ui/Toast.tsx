'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import styles from './Toast.module.css';

type Tipo = 'exito' | 'error';
interface ToastState {
  mensaje: string;
  tipo: Tipo;
  visible: boolean;
}

interface ToastApi {
  exito: (mensaje: string) => void;
  error: (mensaje: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const DURACION_MS = 2600;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ mensaje: '', tipo: 'exito', visible: false });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const mostrar = useCallback((mensaje: string, tipo: Tipo) => {
    clearTimeout(timer.current);
    setToast({ mensaje, tipo, visible: true });
    timer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), DURACION_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const [api] = useState<ToastApi>(() => ({
    exito: (m) => mostrar(m, 'exito'),
    error: (m) => mostrar(m, 'error'),
  }));

  return (
    <ToastContext value={api}>
      {children}
      <div
        className={styles.toast}
        data-visible={toast.visible}
        data-tipo={toast.tipo}
        role="status"
        aria-live="polite"
      >
        <Icon name={toast.tipo === 'exito' ? 'check' : 'alertCircle'} size={15} />
        <span>{toast.mensaje}</span>
      </div>
    </ToastContext>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  return ctx;
}
