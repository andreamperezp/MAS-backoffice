import 'server-only';
import { MOTIVO_PAUSA_LABEL } from '@/domain/labels';
import type { Asociado, Usuario } from '@/domain/types';

/**
 * Notificaciones salientes. La implementación por defecto solo registra en
 * consola; reemplazar por el proveedor real (WhatsApp Business API / SMTP)
 * sin tocar los services.
 */

export interface NotificadorAsociados {
  afiliacionAprobada(asociado: Asociado): Promise<void>;
  asociadoPausado(asociado: Asociado): Promise<void>;
  asociadoReactivado(asociado: Asociado): Promise<void>;
}

export interface MailerUsuarios {
  invitacion(usuario: Usuario, passwordTemporal: string): Promise<void>;
  passwordTemporal(usuario: Usuario, passwordTemporal: string): Promise<void>;
}

const log = (canal: string, destino: string, mensaje: string) =>
  console.info(`[notificación:${canal}] → ${destino}: ${mensaje}`);

export const whatsapp: NotificadorAsociados = {
  async afiliacionAprobada(a) {
    log('whatsapp', a.telefono, `¡Bienvenida/o a MAS! Tu N.° de afiliado es ${a.numeroAfiliado}.`);
  },
  async asociadoPausado(a) {
    log(
      'whatsapp',
      a.telefono,
      `Tu afiliación fue pausada. Motivo: ${a.motivoPausa ? MOTIVO_PAUSA_LABEL[a.motivoPausa] : '-'}.`,
    );
  },
  async asociadoReactivado(a) {
    log('whatsapp', a.telefono, 'Tu afiliación a MAS fue reactivada.');
  },
};

// Nunca se loguea la contraseña en claro.
export const mailer: MailerUsuarios = {
  async invitacion(u) {
    log('email', u.email, 'Invitación al backoffice con contraseña temporal (oculta en logs).');
  },
  async passwordTemporal(u) {
    log('email', u.email, 'Contraseña temporal restablecida (oculta en logs).');
  },
};
