import 'server-only';
import { numeroAfiliado } from '@/domain/format';
import type { Asociado, Documento, Solicitud } from '@/domain/types';
import { hashPassword } from '../auth/password';
import type { UsuarioConCredenciales } from '../repositories/types';

/**
 * Datos hardcodeados para desarrollo y demo. Reflejan la forma de los datos que
 * llegan del Portal de afiliaciones (masmutual.grupodelsud.com).
 *
 * Credenciales de prueba (ver README): `superadmin` / `mas2026` y `admin` / `mas2026`.
 */

export const PASSWORD_DEMO = 'mas2026';

const documentos = (): Documento[] => [
  { tipo: 'dni_frente', nombreArchivo: 'dni-frente.jpg', url: '/mock/documentos/dni-frente.svg' },
  { tipo: 'dni_dorso', nombreArchivo: 'dni-dorso.jpg', url: '/mock/documentos/dni-dorso.svg' },
  { tipo: 'recibo_sueldo', nombreArchivo: 'recibo-sueldo.pdf', url: '/mock/documentos/recibo-sueldo.svg' },
];

export function seedSolicitudes(): Solicitud[] {
  const base = (s: Omit<Solicitud, 'documentos'>): Solicitud => ({ ...s, documentos: documentos() });
  return [
    base({
      id: 'S-0231',
      nombre: 'María',
      apellido: 'González',
      dni: '32456789',
      segmento: 'policia',
      correo: 'maria.gonzalez@mail.com',
      telefono: '+54 9 11 5544-0021',
      fechaSolicitud: '2026-09-18',
      estado: 'pendiente',
    }),
    base({
      id: 'S-0232',
      nombre: 'Carlos',
      apellido: 'Fernández',
      dni: '28901234',
      segmento: 'salud',
      correo: 'carlos.fernandez@mail.com',
      telefono: '+54 9 11 4432-7788',
      fechaSolicitud: '2026-09-18',
      estado: 'pendiente',
    }),
    base({
      id: 'S-0233',
      nombre: 'Lucía',
      apellido: 'Martínez',
      dni: '35112233',
      segmento: 'caja',
      correo: 'lucia.martinez@mail.com',
      telefono: '+54 9 11 6690-1123',
      fechaSolicitud: '2026-09-19',
      estado: 'pendiente',
    }),
    base({
      id: 'S-0234',
      nombre: 'Diego',
      apellido: 'Ramírez',
      dni: '30778899',
      segmento: 'salud',
      correo: 'diego.ramirez@mail.com',
      telefono: '+54 9 11 3321-9087',
      fechaSolicitud: '2026-09-20',
      estado: 'pendiente',
    }),
    base({
      id: 'S-0236',
      nombre: 'Martín',
      apellido: 'López',
      dni: '29667788',
      segmento: 'caja',
      correo: 'martin.lopez@mail.com',
      telefono: '+54 9 11 2298-6650',
      fechaSolicitud: '2026-09-22',
      estado: 'rechazada',
    }),
  ];
}

export function seedAsociados(): Asociado[] {
  const base = (a: Omit<Asociado, 'numeroAfiliado' | 'solicitudId'>): Asociado => ({
    ...a,
    solicitudId: null,
    numeroAfiliado: numeroAfiliado(a.fechaAlta, a.dni),
  });
  return [
    base({
      id: 'A-0001',
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '31987654',
      segmento: 'policia',
      correo: 'juan.perez@mail.com',
      telefono: '+54 9 11 5120-3344',
      fechaAlta: '2026-09-18',
      estado: 'activo',
      motivoPausa: null,
    }),
    base({
      id: 'A-0002',
      nombre: 'Ana',
      apellido: 'Benítez',
      dni: '34556120',
      segmento: 'salud',
      correo: 'ana.benitez@mail.com',
      telefono: '+54 9 11 3871-6620',
      fechaAlta: '2026-09-20',
      estado: 'activo',
      motivoPausa: null,
    }),
    base({
      id: 'A-0003',
      nombre: 'Sofía',
      apellido: 'Torres',
      dni: '33445566',
      segmento: 'policia',
      correo: 'sofia.torres@mail.com',
      telefono: '+54 9 11 7765-4432',
      fechaAlta: '2026-09-21',
      estado: 'activo',
      motivoPausa: null,
    }),
    base({
      id: 'A-0004',
      nombre: 'Roberto',
      apellido: 'Sánchez',
      dni: '27889900',
      segmento: 'caja',
      correo: 'roberto.sanchez@mail.com',
      telefono: '+54 9 11 4410-2287',
      fechaAlta: '2026-09-10',
      estado: 'pausado',
      motivoPausa: 'falta_de_pago',
    }),
    base({
      id: 'A-0005',
      nombre: 'Patricia',
      apellido: 'Díaz',
      dni: '31223344',
      segmento: 'salud',
      correo: 'patricia.diaz@mail.com',
      telefono: '+54 9 11 6602-3391',
      fechaAlta: '2026-09-05',
      estado: 'pausado',
      motivoPausa: 'en_revision',
    }),
    base({
      id: 'A-0006',
      nombre: 'Fernando',
      apellido: 'Acosta',
      dni: '26554433',
      segmento: 'policia',
      correo: 'fernando.acosta@mail.com',
      telefono: '+54 9 11 8890-1120',
      fechaAlta: '2026-08-02',
      estado: 'inactivo',
      motivoPausa: null,
    }),
  ];
}

/** Devuelve un ISO datetime relativo a hoy (para que "Hoy"/"Ayer" tengan sentido en la demo). */
function haceDias(dias: number, hh: number, mm: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

export function seedUsuarios(): UsuarioConCredenciales[] {
  const passwordHash = hashPassword(PASSWORD_DEMO);
  const base = (u: Omit<UsuarioConCredenciales, 'passwordHash' | 'debeCambiarPassword'>): UsuarioConCredenciales => ({
    ...u,
    passwordHash,
    debeCambiarPassword: false,
  });
  return [
    base({
      id: 'U-0000',
      nombre: 'Superadmin',
      usuario: 'superadmin',
      email: 'superadmin@mas.org.ar',
      rol: 'superadmin',
      estado: 'activo',
      fechaCreacion: '2026-01-01',
      ultimoAcceso: haceDias(0, 9, 14),
    }),
    base({
      id: 'U-0001',
      nombre: 'Administrador General',
      usuario: 'admin',
      email: 'admin@mas.org.ar',
      rol: 'administrador',
      estado: 'activo',
      fechaCreacion: '2026-01-01',
      ultimoAcceso: haceDias(0, 8, 47),
    }),
    base({
      id: 'U-0002',
      nombre: 'Valeria Suárez',
      usuario: 'valeria.suarez',
      email: 'valeria.suarez@mas.org.ar',
      rol: 'administrador',
      estado: 'activo',
      fechaCreacion: '2026-09-12',
      ultimoAcceso: haceDias(1, 17, 40),
    }),
    base({
      id: 'U-0003',
      nombre: 'Martín Ibarra',
      usuario: 'martin.ibarra',
      email: 'martin.ibarra@mas.org.ar',
      rol: 'administrador',
      estado: 'activo',
      fechaCreacion: '2026-09-18',
      ultimoAcceso: '2026-09-22T14:05:00.000Z',
    }),
    base({
      id: 'U-0004',
      nombre: 'Julieta Roldán',
      usuario: 'julieta.roldan',
      email: 'julieta.roldan@mas.org.ar',
      rol: 'administrador',
      estado: 'inactivo',
      fechaCreacion: '2026-08-02',
      ultimoAcceso: '2026-09-10T11:20:00.000Z',
    }),
    base({
      id: 'U-0005',
      nombre: 'Nicolás Paredes',
      usuario: 'nicolas.paredes',
      email: 'nicolas.paredes@mas.org.ar',
      rol: 'administrador',
      estado: 'activo',
      fechaCreacion: '2026-09-22',
      ultimoAcceso: haceDias(0, 8, 2),
    }),
  ];
}
