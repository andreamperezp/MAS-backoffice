import QRCode from 'qrcode';
import { formatDni, telefonoWhatsapp } from '@/domain/format';
import type { Asociado } from '@/domain/types';

/**
 * Contenido del QR de la credencial.
 * TODO(MAS): cuando exista la página pública de validación de credenciales en
 * el Portal, codificar su URL (ej. `${PORTAL}/credencial/${numeroAfiliado}`).
 */
export const contenidoQr = (a: Asociado) => `MAS-AFILIADO:${a.numeroAfiliado}`;

/** Matriz de módulos del QR (true = módulo oscuro). */
export function matrizQr(texto: string): boolean[][] {
  const qr = QRCode.create(texto, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size;
  return Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => qr.modules.get(y, x) === 1));
}

export function linkWhatsapp(a: Asociado): string {
  const mensaje =
    `¡Hola ${a.nombre}! Te damos la bienvenida a MAS – Mutual Argentina Solidaria. ` +
    `Tu N.° de afiliado es ${a.numeroAfiliado}. Te compartimos tu carnet digital.`;
  return `https://wa.me/${telefonoWhatsapp(a.telefono)}?text=${encodeURIComponent(mensaje)}`;
}

// ── Exportación a PNG ────────────────────────────────────────────────────────

const ESCALA = 3; // nitidez para impresión / pantallas de alta densidad
const ANCHO = 400;
const ALTO = 250;

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function blob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number,
  color: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Dibuja la credencial en un canvas y la descarga como PNG. */
export async function descargarCarnetPng(a: Asociado): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = ANCHO * ESCALA;
  canvas.height = ALTO * ESCALA;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no soporta canvas.');
  ctx.scale(ESCALA, ESCALA);

  const fuente = getComputedStyle(document.body).fontFamily;
  await document.fonts.ready;

  // Fondo con bordes redondeados y formas de marca.
  ctx.beginPath();
  ctx.roundRect(0, 0, ANCHO, ALTO, 18);
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ANCHO, ALTO);
  blob(ctx, ANCHO - 2, 10, 50, 44, -8, '#f4a721');
  blob(ctx, ANCHO - 40, ALTO + 2, 78, 48, 6, '#56a5a1');

  const logo = await cargarImagen('/brand/logo-gris.svg');
  ctx.drawImage(logo, 24, 22, 66, 32);

  ctx.fillStyle = '#eaf5f4';
  ctx.beginPath();
  ctx.roundRect(ANCHO - 120, 28, 76, 20, 10);
  ctx.fill();
  ctx.fillStyle = '#357572';
  ctx.font = `700 9px ${fuente}`;
  ctx.textAlign = 'center';
  ctx.fillText('ASOCIADO', ANCHO - 82, 41.5);
  ctx.textAlign = 'left';

  const campos: Array<[string, string]> = [
    ['NOMBRE Y APELLIDO', `${a.nombre} ${a.apellido}`],
    ['DNI', formatDni(a.dni)],
    ['N.° DE AFILIADO', a.numeroAfiliado],
  ];
  let y = 78;
  for (const [label, valor] of campos) {
    ctx.fillStyle = '#6f6f71';
    ctx.font = `400 8.5px ${fuente}`;
    ctx.fillText(label, 24, y);
    ctx.fillStyle = '#3d3d3b';
    ctx.font = `700 13px ${fuente}`;
    ctx.fillText(valor, 24, y + 16);
    y += 38;
  }

  // Pie: QR + leyenda.
  ctx.strokeStyle = '#e2e2e2';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(24, 192);
  ctx.lineTo(ANCHO * 0.75, 192);
  ctx.stroke();
  ctx.setLineDash([]);

  const matriz = matrizQr(contenidoQr(a));
  const tam = 44;
  const modulo = tam / matriz.length;
  ctx.fillStyle = '#3d3d3b';
  matriz.forEach((fila, my) =>
    fila.forEach((on, mx) => on && ctx.fillRect(24 + mx * modulo, 198 + my * modulo, modulo + 0.2, modulo + 0.2)),
  );
  ctx.fillStyle = '#e2e2e2';
  ctx.fillRect(78, 202, 1, 36);
  ctx.fillStyle = '#6f6f71';
  ctx.font = `500 10px ${fuente}`;
  ctx.fillText('Credencial digital', 88, 224);

  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = `carnet-mas-${a.numeroAfiliado}.png`;
  link.click();
}
