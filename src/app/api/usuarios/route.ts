import { filtroUsuariosSchema, nuevoUsuarioSchema } from '@/domain/schemas';
import { requerirUsuario } from '@/server/auth/session';
import { leerBody, leerQuery, ruta } from '@/server/http';
import { crearUsuario, listarUsuarios } from '@/server/services/usuarios';

export const GET = ruta(async (req) => {
  await requerirUsuario(['superadmin']);
  return Response.json(await listarUsuarios(leerQuery(req, filtroUsuariosSchema)));
});

export const POST = ruta(async (req) => {
  await requerirUsuario(['superadmin']);
  const usuario = await crearUsuario(await leerBody(req, nuevoUsuarioSchema));
  return Response.json(usuario, { status: 201 });
});
