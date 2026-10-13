import { actualizarUsuarioSchema } from '@/domain/schemas';
import { requerirUsuario } from '@/server/auth/session';
import { leerBody, ruta } from '@/server/http';
import { actualizarUsuario } from '@/server/services/usuarios';

/** Body: `{ rol?, estado? }` */
export const PATCH = ruta(async (req, ctx: RouteContext<'/api/usuarios/[id]'>) => {
  const actor = await requerirUsuario(['superadmin']);
  const { id } = await ctx.params;
  return Response.json(await actualizarUsuario(id, await leerBody(req, actualizarUsuarioSchema), actor));
});
