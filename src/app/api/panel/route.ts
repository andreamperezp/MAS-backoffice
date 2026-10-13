import { requerirUsuario } from '@/server/auth/session';
import { ruta } from '@/server/http';
import { obtenerResumenPanel } from '@/server/services/panel';

export const GET = ruta(async () => {
  const user = await requerirUsuario();
  return Response.json(await obtenerResumenPanel(user.rol));
});
