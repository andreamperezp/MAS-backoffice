'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { Usuario } from '@/domain/types';
import { mensajeDeError } from '@/lib/api';
import { useEnviarPassword } from './queries';
import styles from './Usuarios.module.css';

interface Props {
  usuario: Usuario;
  /** Contraseña temporal recién generada; el modal está abierto mientras exista. */
  passwordTemporal: string | null;
  onClose: () => void;
}

/** Muestra la contraseña temporal una única vez y permite enviarla por correo. */
export function ResetPasswordModal({ usuario, passwordTemporal, onClose }: Props) {
  const toast = useToast();
  const enviar = useEnviarPassword();

  const enviarPorCorreo = () => {
    if (!passwordTemporal) return;
    enviar.mutate(
      { id: usuario.id, passwordTemporal },
      {
        onSuccess: () => {
          toast.exito('Contraseña temporal enviada por correo.');
          onClose();
        },
        onError: (e) => toast.error(mensajeDeError(e)),
      },
    );
  };

  return (
    <Modal
      open={passwordTemporal !== null}
      onClose={onClose}
      width={440}
      titulo="Contraseña restablecida"
      descripcion={`Contraseña temporal para ${usuario.nombre}. Se le pedirá cambiarla en el próximo inicio de sesión.`}
      acciones={
        <>
          <Button variant="ghost" size="md" grow onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="primary" size="md" grow disabled={enviar.isPending} onClick={enviarPorCorreo}>
            {enviar.isPending ? 'Enviando…' : 'Enviar por correo'}
          </Button>
        </>
      }
    >
      <div className={styles.tempPass}>{passwordTemporal}</div>
    </Modal>
  );
}
