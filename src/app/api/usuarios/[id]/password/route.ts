import { z } from 'zod';
import { requerirUsuario } from '@/server/auth/session';
import { leerBody, ruta } from '@/server/http';
import { enviarPasswordTemporal, restablecerPassword } from '@/server/services/usuarios';

/** Genera una contraseña temporal y la devuelve una única vez. */
export const POST = ruta(async (_req, ctx: RouteContext<'/api/usuarios/[id]/password'>) => {
  await requerirUsuario(['superadmin']);
  const { id } = await ctx.params;
  const { passwordTemporal } = await restablecerPassword(id);
  return Response.json({ passwordTemporal }, { headers: { 'Cache-Control': 'no-store' } });
});

/** Envía por correo la contraseña temporal recién generada. */
export const PUT = ruta(async (req, ctx: RouteContext<'/api/usuarios/[id]/password'>) => {
  await requerirUsuario(['superadmin']);
  const { id } = await ctx.params;
  const { passwordTemporal } = await leerBody(req, z.object({ passwordTemporal: z.string().min(1).max(64) }));
  await enviarPasswordTemporal(id, passwordTemporal);
  return new Response(null, { status: 204 });
});
