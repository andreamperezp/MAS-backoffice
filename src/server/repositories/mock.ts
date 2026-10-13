import 'server-only';
import { contarPor, filtrarAsociados, filtrarSolicitudes, filtrarUsuarios, porFechaDesc } from '@/domain/filters';
import { ESTADOS_ASOCIADO, ESTADOS_USUARIO, type Asociado, type Solicitud } from '@/domain/types';
import { noEncontrado } from '../errors';
import { seedAsociados, seedSolicitudes, seedUsuarios } from '../mock/seed';
import type { Repositorios, UsuarioConCredenciales } from './types';

/**
 * Repositorios en memoria. El estado vive en `globalThis` para sobrevivir al
 * hot-reload de desarrollo; se reinicia al reiniciar el servidor.
 */

interface MockDb {
  solicitudes: Solicitud[];
  asociados: Asociado[];
  usuarios: UsuarioConCredenciales[];
  secuencia: number;
}

const globalParaMock = globalThis as typeof globalThis & { __masMockDb?: MockDb };

function db(): MockDb {
  globalParaMock.__masMockDb ??= {
    solicitudes: seedSolicitudes(),
    asociados: seedAsociados(),
    usuarios: seedUsuarios(),
    secuencia: 100,
  };
  return globalParaMock.__masMockDb;
}

const latencia = Number(process.env.MOCK_LATENCY_MS ?? 200);
const esperar = () => (latencia > 0 ? new Promise((r) => setTimeout(r, latencia)) : Promise.resolve());

/** Copia defensiva: el llamador nunca recibe referencias al estado interno. */
const clonar = <T>(v: T): T => structuredClone(v);

function siguienteId(prefijo: string): string {
  const d = db();
  d.secuencia += 1;
  return `${prefijo}-${String(d.secuencia).padStart(4, '0')}`;
}

function sinCredenciales({ passwordHash: _h, debeCambiarPassword: _d, ...usuario }: UsuarioConCredenciales) {
  return usuario;
}

export function crearRepositoriosMock(): Repositorios {
  return {
    solicitudes: {
      async listar(filtro) {
        await esperar();
        const todas = db().solicitudes;
        // Cola de revisión FIFO: primero las más antiguas.
        const items = filtrarSolicitudes(todas, filtro).sort((a, b) =>
          a.fechaSolicitud.localeCompare(b.fechaSolicitud),
        );
        const pendiente = todas.filter((s) => s.estado === 'pendiente').length;
        const rechazada = todas.filter((s) => s.estado === 'rechazada').length;
        return {
          items: clonar(items),
          total: items.length,
          conteos: { pendiente, rechazada, total: pendiente + rechazada },
        };
      },
      async obtener(id) {
        await esperar();
        const s = db().solicitudes.find((x) => x.id === id);
        return s ? clonar(s) : null;
      },
      async actualizarEstado(id, estado) {
        const s = db().solicitudes.find((x) => x.id === id);
        if (!s) throw noEncontrado('Solicitud');
        s.estado = estado;
        return clonar(s);
      },
    },

    asociados: {
      async listar(filtro) {
        await esperar();
        const todos = db().asociados;
        const items = filtrarAsociados(todos, filtro).sort(porFechaDesc((a) => a.fechaAlta));
        return {
          items: clonar(items),
          total: items.length,
          conteos: contarPor(todos, (a) => a.estado, ESTADOS_ASOCIADO),
        };
      },
      async obtener(id) {
        const a = db().asociados.find((x) => x.id === id);
        return a ? clonar(a) : null;
      },
      async buscarPorDni(dni) {
        const a = db().asociados.find((x) => x.dni === dni);
        return a ? clonar(a) : null;
      },
      async crear(datos) {
        const asociado: Asociado = { ...datos, id: siguienteId('A') };
        db().asociados.push(asociado);
        return clonar(asociado);
      },
      async actualizar(id, cambios) {
        const a = db().asociados.find((x) => x.id === id);
        if (!a) throw noEncontrado('Asociado');
        Object.assign(a, cambios);
        return clonar(a);
      },
    },

    usuarios: {
      async listar(filtro) {
        await esperar();
        const todos = db().usuarios;
        const items = filtrarUsuarios(todos, filtro)
          .sort(porFechaDesc((u) => u.fechaCreacion))
          .map(sinCredenciales);
        return {
          items: clonar(items),
          total: items.length,
          conteos: contarPor(todos, (u) => u.estado, ESTADOS_USUARIO),
        };
      },
      async obtener(id) {
        const u = db().usuarios.find((x) => x.id === id);
        return u ? clonar(sinCredenciales(u)) : null;
      },
      async buscarConCredenciales(usuarioOEmail) {
        const clave = usuarioOEmail.trim().toLowerCase();
        const u = db().usuarios.find((x) => x.usuario.toLowerCase() === clave || x.email.toLowerCase() === clave);
        return u ? clonar(u) : null;
      },
      async obtenerConCredenciales(id) {
        const u = db().usuarios.find((x) => x.id === id);
        return u ? clonar(u) : null;
      },
      async crear(datos) {
        const usuario: UsuarioConCredenciales = { ...datos, id: siguienteId('U'), ultimoAcceso: null };
        db().usuarios.push(usuario);
        return clonar(sinCredenciales(usuario));
      },
      async actualizar(id, cambios) {
        const u = db().usuarios.find((x) => x.id === id);
        if (!u) throw noEncontrado('Usuario');
        Object.assign(u, cambios);
        return clonar(sinCredenciales(u));
      },
    },
  };
}
