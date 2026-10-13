import { describe, expect, it } from 'vitest';
import { asociadosACsv } from '@/domain/csv';
import { filtrarAsociados, filtrarSolicitudes } from '@/domain/filters';
import { formatDni, formatFecha, formatUltimoAcceso, numeroAfiliado } from '@/domain/format';
import { inicioPorRol, puedeVer, seccionDeRuta } from '@/domain/permisos';
import { filtroAsociadosSchema, filtroSolicitudesSchema } from '@/domain/schemas';
import type { Asociado, Solicitud } from '@/domain/types';

const solicitud = (s: Partial<Solicitud>): Solicitud => ({
  id: 'S-1',
  nombre: 'Carlos',
  apellido: 'Fernández',
  dni: '28901234',
  segmento: 'salud',
  correo: 'c@mail.com',
  telefono: '+54 9 11 4432-7788',
  fechaSolicitud: '2026-09-18',
  estado: 'pendiente',
  documentos: [],
  ...s,
});

const asociado = (a: Partial<Asociado>): Asociado => ({
  id: 'A-1',
  solicitudId: null,
  nombre: 'Ana',
  apellido: 'Benítez',
  dni: '34556120',
  segmento: 'salud',
  correo: 'ana@mail.com',
  telefono: '+54 9 11 3871-6620',
  numeroAfiliado: '2026-34556120',
  fechaAlta: '2026-09-20',
  estado: 'activo',
  motivoPausa: null,
  ...a,
});

describe('format', () => {
  it('formatea DNI con puntos', () => {
    expect(formatDni('32456789')).toBe('32.456.789');
    expect(formatDni('5123456')).toBe('5.123.456');
  });

  it('arma el N.° de afiliado como año de alta + DNI', () => {
    expect(numeroAfiliado('2026-09-18', '32.456.789')).toBe('2026-32456789');
  });

  it('formatea fechas ISO sin corrimiento de huso horario', () => {
    expect(formatFecha('2026-09-01')).toBe('01 sep 2026');
  });

  it('describe el último acceso de forma relativa', () => {
    const ahora = new Date(2026, 9, 13, 12, 0);
    expect(formatUltimoAcceso(new Date(2026, 9, 13, 9, 14).toISOString(), ahora)).toBe('Hoy, 09:14');
    expect(formatUltimoAcceso(new Date(2026, 9, 12, 17, 40).toISOString(), ahora)).toBe('Ayer, 17:40');
    expect(formatUltimoAcceso(new Date(2026, 8, 22, 11, 5).toISOString(), ahora)).toBe('22 sep 2026, 11:05');
    expect(formatUltimoAcceso(null, ahora)).toBe('Sin accesos todavía');
  });
});

describe('filtros', () => {
  const base = filtroSolicitudesSchema.parse({});

  it('por defecto muestra pendientes y nunca las aprobadas', () => {
    const items = [
      solicitud({ id: '1' }),
      solicitud({ id: '2', estado: 'rechazada' }),
      solicitud({ id: '3', estado: 'aprobada' }),
    ];
    expect(filtrarSolicitudes(items, base).map((s) => s.id)).toEqual(['1']);
    expect(filtrarSolicitudes(items, { ...base, estado: 'todas' }).map((s) => s.id)).toEqual(['1', '2']);
  });

  it('busca sin distinguir tildes ni mayúsculas', () => {
    expect(filtrarSolicitudes([solicitud({})], { ...base, q: 'FERNANDEZ' })).toHaveLength(1);
  });

  it('busca DNI con o sin puntos', () => {
    expect(filtrarSolicitudes([solicitud({})], { ...base, q: '28.901' })).toHaveLength(1);
    expect(filtrarSolicitudes([solicitud({})], { ...base, q: '28901234' })).toHaveLength(1);
  });

  it('filtra asociados por rango de fechas y N.° de afiliado', () => {
    const f = filtroAsociadosSchema.parse({ desde: '2026-09-19', hasta: '2026-09-30' });
    expect(filtrarAsociados([asociado({}), asociado({ id: 'A-2', fechaAlta: '2026-08-01' })], f)).toHaveLength(1);
    expect(filtrarAsociados([asociado({})], filtroAsociadosSchema.parse({ q: '2026-34556120' }))).toHaveLength(1);
  });

  it('ignora valores inválidos del query string y aplica defaults', () => {
    expect(filtroAsociadosSchema.parse({ estado: 'cualquiera', q: '' })).toEqual({
      estado: 'todos',
      segmento: 'todos',
    });
  });
});

describe('csv', () => {
  it('incluye BOM, usa ; y neutraliza fórmulas', () => {
    const csv = asociadosACsv([asociado({ nombre: '=HYPERLINK("x")' })]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const [encabezado, fila] = csv.slice(1).split('\r\n');
    expect(encabezado.split(';')[0]).toBe('N.° de afiliado');
    expect(fila).toContain(`"'=HYPERLINK(""x"")"`);
    expect(fila.endsWith('54 9 11 3871-6620')).toBe(true);
  });
});

describe('permisos', () => {
  it('el administrador no ve Panel ni Usuarios', () => {
    expect(puedeVer('panel', 'administrador')).toBe(false);
    expect(puedeVer('usuarios', 'administrador')).toBe(false);
    expect(puedeVer('solicitudes', 'administrador')).toBe(true);
  });

  it('resuelve la sección de una ruta y el inicio por rol', () => {
    expect(seccionDeRuta('/asociados')).toBe('asociados');
    expect(seccionDeRuta('/asociadosx')).toBeNull();
    expect(inicioPorRol('superadmin')).toBe('/panel');
    expect(inicioPorRol('administrador')).toBe('/solicitudes');
  });
});
