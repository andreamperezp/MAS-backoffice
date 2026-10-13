import { formatDni } from './format';
import { ESTADO_ASOCIADO_LABEL, MOTIVO_PAUSA_LABEL, SEGMENTO_LABEL } from './labels';
import type { Asociado } from './types';

/**
 * Exportación del padrón de asociados.
 *
 * TODO(MAS): confirmar con el Ministerio / Caja de Policía el layout exacto que
 * requieren (columnas, separador, codificación). Se entrega CSV con `;` como
 * separador y BOM UTF-8, que es lo que Excel en es-AR abre sin configuración.
 */

const SEPARADOR = ';';
/** Byte order mark: hace que Excel detecte UTF-8 (tildes y ñ). */
const BOM_UTF8 = String.fromCharCode(0xfeff);

function celda(valor: string): string {
  const v = valor ?? '';
  // Neutraliza inyección de fórmulas en Excel/Sheets (CSV injection).
  const seguro = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[";\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

const COLUMNAS: Array<[string, (a: Asociado) => string]> = [
  ['N.° de afiliado', (a) => a.numeroAfiliado],
  ['Apellido', (a) => a.apellido],
  ['Nombre', (a) => a.nombre],
  ['DNI', (a) => formatDni(a.dni)],
  ['Segmento', (a) => SEGMENTO_LABEL[a.segmento]],
  ['Estado', (a) => ESTADO_ASOCIADO_LABEL[a.estado]],
  ['Motivo de pausa', (a) => (a.motivoPausa ? MOTIVO_PAUSA_LABEL[a.motivoPausa] : '')],
  ['Fecha de alta', (a) => a.fechaAlta],
  ['Correo', (a) => a.correo],
  // Sin el '+' inicial: Excel lo interpretaría como fórmula.
  ['Teléfono', (a) => a.telefono.replace(/^\+/, '')],
];

export function asociadosACsv(asociados: Asociado[]): string {
  const encabezado = COLUMNAS.map(([titulo]) => celda(titulo)).join(SEPARADOR);
  const filas = asociados.map((a) => COLUMNAS.map(([, valor]) => celda(valor(a))).join(SEPARADOR));
  return BOM_UTF8 + [encabezado, ...filas].join('\r\n') + '\r\n';
}
