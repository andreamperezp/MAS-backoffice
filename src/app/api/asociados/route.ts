import { filtroAsociadosSchema } from '@/domain/schemas';
import { requerirUsuario } from '@/server/auth/session';
import { leerQuery, ruta } from '@/server/http';
import { listarAsociados } from '@/server/services/asociados';

export const GET = ruta(async (req) => {
  await requerirUsuario();
  return Response.json(await listarAsociados(leerQuery(req, filtroAsociadosSchema)));
});
