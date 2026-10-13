import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionUser } from '@/domain/types';
import { PASSWORD_DEMO } from '@/server/mock/seed';
import { repos } from '@/server/repositories';
import { ejecutarAccionAsociado } from '@/server/services/asociados';
import { autenticar } from '@/server/services/auth';
import { ejecutarAccionSolicitud } from '@/server/services/solicitudes';
import {
  actualizarUsuario,
  crearUsuario,
  enviarPasswordTemporal,
  restablecerPassword,
} from '@/server/services/usuarios';

const superadmin: SessionUser = {
  id: 'U-0000',
  nombre: 'Superadmin',
  email: 'superadmin@mas.org.ar',
  rol: 'superadmin',
};

beforeEach(() => {
  // Base mock limpia en cada test.
  (globalThis as { __masMockDb?: unknown }).__masMockDb = undefined;
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

describe('solicitudes', () => {
  it('aprobar crea el asociado con su N.° de afiliado y saca la solicitud de la cola', async () => {
    const { asociado } = await ejecutarAccionSolicitud('S-0231', 'aprobar');
    expect(asociado).toMatchObject({ dni: '32456789', estado: 'activo', solicitudId: 'S-0231' });
    expect(asociado?.numeroAfiliado).toMatch(/^\d{4}-32456789$/);

    const pendientes = await repos().solicitudes.listar({ estado: 'pendiente', segmento: 'todos' });
    expect(pendientes.items.map((s) => s.id)).not.toContain('S-0231');
  });

  it('no permite aprobar dos veces ni aprobar una rechazada', async () => {
    await ejecutarAccionSolicitud('S-0231', 'aprobar');
    await expect(ejecutarAccionSolicitud('S-0231', 'aprobar')).rejects.toMatchObject({ codigo: 'TRANSICION_INVALIDA' });
    await expect(ejecutarAccionSolicitud('S-0236', 'aprobar')).rejects.toMatchObject({ codigo: 'TRANSICION_INVALIDA' });
  });

  it('rechazar y volver a pendiente', async () => {
    expect((await ejecutarAccionSolicitud('S-0232', 'rechazar')).solicitud.estado).toBe('rechazada');
    expect((await ejecutarAccionSolicitud('S-0232', 'volver_a_pendiente')).solicitud.estado).toBe('pendiente');
  });

  it('la cola de pendientes es FIFO', async () => {
    const { items } = await repos().solicitudes.listar({ estado: 'pendiente', segmento: 'todos' });
    const fechas = items.map((s) => s.fechaSolicitud);
    expect(fechas).toEqual([...fechas].sort());
  });
});

describe('asociados', () => {
  it('pausar exige motivo y estado activo; reactivar limpia el motivo', async () => {
    const pausado = await ejecutarAccionAsociado('A-0001', { accion: 'pausar', motivo: 'falta_de_pago' });
    expect(pausado).toMatchObject({ estado: 'pausado', motivoPausa: 'falta_de_pago' });
    await expect(ejecutarAccionAsociado('A-0001', { accion: 'pausar', motivo: 'otro' })).rejects.toMatchObject({
      codigo: 'TRANSICION_INVALIDA',
    });
    expect(await ejecutarAccionAsociado('A-0001', { accion: 'reactivar' })).toMatchObject({
      estado: 'activo',
      motivoPausa: null,
    });
  });

  it('desactivar conserva el registro en el histórico', async () => {
    await ejecutarAccionAsociado('A-0004', { accion: 'desactivar' });
    const { items } = await repos().asociados.listar({ estado: 'inactivo', segmento: 'todos' });
    expect(items.map((a) => a.id)).toContain('A-0004');
  });
});

describe('usuarios y autenticación', () => {
  it('autentica por usuario o correo y rechaza contraseña incorrecta', async () => {
    expect(await autenticar('superadmin', PASSWORD_DEMO)).toMatchObject({ rol: 'superadmin' });
    expect(await autenticar('ADMIN@mas.org.ar', PASSWORD_DEMO)).toMatchObject({ rol: 'administrador' });
    expect(await autenticar('admin', 'otra')).toBeNull();
    expect(await autenticar('no-existe', PASSWORD_DEMO)).toBeNull();
  });

  it('un usuario inactivo no puede ingresar', async () => {
    expect(await autenticar('julieta.roldan', PASSWORD_DEMO)).toBeNull();
  });

  it('no permite correos duplicados', async () => {
    await expect(
      crearUsuario({ nombre: 'Otra Valeria', email: 'valeria.suarez@mas.org.ar', rol: 'administrador' }),
    ).rejects.toMatchObject({
      codigo: 'CONFLICTO',
    });
  });

  it('un superadmin no puede quitarse a sí mismo el rol ni el acceso', async () => {
    await expect(actualizarUsuario(superadmin.id, { rol: 'administrador' }, superadmin)).rejects.toMatchObject({
      codigo: 'CONFLICTO',
    });
    await expect(actualizarUsuario(superadmin.id, { estado: 'inactivo' }, superadmin)).rejects.toMatchObject({
      codigo: 'CONFLICTO',
    });
  });

  it('siempre queda al menos un superadmin activo', async () => {
    const otro: SessionUser = { ...superadmin, id: 'U-0002' };
    await expect(actualizarUsuario(superadmin.id, { estado: 'inactivo' }, otro)).rejects.toMatchObject({
      codigo: 'CONFLICTO',
    });
  });

  it('la contraseña temporal permite ingresar y solo se puede reenviar la vigente', async () => {
    const { passwordTemporal } = await restablecerPassword('U-0002');
    expect(await autenticar('valeria.suarez', passwordTemporal)).not.toBeNull();
    expect(await autenticar('valeria.suarez', PASSWORD_DEMO)).toBeNull();
    await expect(enviarPasswordTemporal('U-0002', passwordTemporal)).resolves.toBeUndefined();
    await expect(enviarPasswordTemporal('U-0002', 'INVENTADA')).rejects.toMatchObject({ codigo: 'CONFLICTO' });
  });
});
