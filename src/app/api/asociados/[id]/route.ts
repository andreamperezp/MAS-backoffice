import { accionAsociadoSchema } from '@/domain/schemas';
import { requerirUsuario } from '@/server/auth/session';
import { leerBody, ruta } from '@/server/http';
import { ejecutarAccionAsociado } from '@/server/services/asociados';

/** Body: `{ accion: 'pausar', motivo } | { accion: 'reactivar' } | { accion: 'desactivar' }` */
export const PATCH = ruta(async (req, ctx: RouteContext<'/api/asociados/[id]'>) => {
  await requerirUsuario();
  const { id } = await ctx.params;
  return Response.json(await ejecutarAccionAsociado(id, await leerBody(req, accionAsociadoSchema)));
});
