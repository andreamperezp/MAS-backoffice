import { filtroSolicitudesSchema } from '@/domain/schemas';
import { requerirUsuario } from '@/server/auth/session';
import { leerQuery, ruta } from '@/server/http';
import { listarSolicitudes } from '@/server/services/solicitudes';

export const GET = ruta(async (req) => {
  await requerirUsuario();
  return Response.json(await listarSolicitudes(leerQuery(req, filtroSolicitudesSchema)));
});
