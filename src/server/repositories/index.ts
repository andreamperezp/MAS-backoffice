import 'server-only';
import { crearRepositoriosMock } from './mock';
import { crearRepositoriosPortal } from './portal-api';
import type { Repositorios } from './types';

/**
 * Punto único de acceso a datos. `DATA_SOURCE` define la fuente:
 *   - `mock`   (default) datos hardcodeados en memoria.
 *   - `portal` API del Portal de afiliaciones (ver `portal-api.ts`).
 */
let instancia: Repositorios | undefined;

export function repos(): Repositorios {
  if (!instancia) {
    const fuente = process.env.DATA_SOURCE ?? 'mock';
    instancia = fuente === 'portal' ? crearRepositoriosPortal() : crearRepositoriosMock();
  }
  return instancia;
}
