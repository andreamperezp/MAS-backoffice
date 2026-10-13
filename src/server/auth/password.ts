import 'server-only';
import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

/** Hash con scrypt y salt aleatorio. Formato: `scrypt$<salt hex>$<hash hex>`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verificarPassword(password: string, almacenado: string): boolean {
  const [algoritmo, saltHex, hashHex] = almacenado.split('$');
  if (algoritmo !== 'scrypt' || !saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = scryptSync(password, Buffer.from(saltHex, 'hex'), esperado.length);
  return timingSafeEqual(esperado, calculado);
}

/** Contraseña temporal legible (sin caracteres ambiguos como 0/O o 1/I). */
export function generarPasswordTemporal(largo = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: largo }, () => chars[randomInt(chars.length)]).join('');
}
