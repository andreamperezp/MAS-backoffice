import { requerirUsuario } from '@/server/auth/session';
import { ruta } from '@/server/http';
import { obtenerResumenPanel } from '@/server/services/panel';

export const GET = ruta(async () => {
  await requerirUsuario(['superadmin']);
  return Response.json(await obtenerResumenPanel());
});
