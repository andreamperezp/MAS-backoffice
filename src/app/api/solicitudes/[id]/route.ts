import { accionSolicitudSchema } from '@/domain/schemas';
import { requerirUsuario } from '@/server/auth/session';
import { leerBody, ruta } from '@/server/http';
import { ejecutarAccionSolicitud } from '@/server/services/solicitudes';

/** Body: `{ accion: 'aprobar' | 'rechazar' | 'volver_a_pendiente' }` */
export const PATCH = ruta(async (req, ctx: RouteContext<'/api/solicitudes/[id]'>) => {
  await requerirUsuario();
  const { id } = await ctx.params;
  const { accion } = await leerBody(req, accionSolicitudSchema);
  return Response.json(await ejecutarAccionSolicitud(id, accion));
});
