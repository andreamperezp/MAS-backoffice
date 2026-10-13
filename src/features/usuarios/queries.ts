'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActualizarUsuario, FiltroUsuarios, NuevoUsuario } from '@/domain/schemas';
import type { ConteosUsuarios, Listado, Usuario } from '@/domain/types';
import { aQueryString, api } from '@/lib/api';

export const usuariosKeys = {
  todos: ['usuarios'] as const,
  lista: (f: FiltroUsuarios) => ['usuarios', 'lista', f] as const,
};

export function useUsuarios(filtro: FiltroUsuarios) {
  return useQuery({
    queryKey: usuariosKeys.lista(filtro),
    queryFn: ({ signal }) => api<Listado<Usuario, ConteosUsuarios>>(`/api/usuarios${aQueryString(filtro)}`, { signal }),
    placeholderData: keepPreviousData,
  });
}

function useInvalidarUsuarios() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: usuariosKeys.todos });
    void qc.invalidateQueries({ queryKey: ['panel'] });
  };
}

export function useCrearUsuario() {
  const invalidar = useInvalidarUsuarios();
  return useMutation({
    mutationFn: (datos: NuevoUsuario) => api<Usuario>('/api/usuarios', { method: 'POST', json: datos }),
    onSuccess: invalidar,
  });
}

export function useActualizarUsuario() {
  const invalidar = useInvalidarUsuarios();
  return useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: ActualizarUsuario }) =>
      api<Usuario>(`/api/usuarios/${encodeURIComponent(id)}`, { method: 'PATCH', json: cambios }),
    onSuccess: invalidar,
  });
}

export function useRestablecerPassword() {
  return useMutation({
    mutationFn: (id: string) =>
      api<{ passwordTemporal: string }>(`/api/usuarios/${encodeURIComponent(id)}/password`, { method: 'POST' }),
  });
}

export function useEnviarPassword() {
  return useMutation({
    mutationFn: ({ id, passwordTemporal }: { id: string; passwordTemporal: string }) =>
      api<void>(`/api/usuarios/${encodeURIComponent(id)}/password`, { method: 'PUT', json: { passwordTemporal } }),
  });
}
