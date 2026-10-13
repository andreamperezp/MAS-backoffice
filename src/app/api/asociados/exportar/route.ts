import { hoyIso } from '@/domain/format';
import { filtroAsociadosSchema } from '@/domain/schemas';
import { requerirUsuario } from '@/server/auth/session';
import { leerQuery, ruta } from '@/server/http';
import { exportarAsociadosCsv } from '@/server/services/asociados';

/** Descarga el padrón filtrado como CSV (mismos filtros que `GET /api/asociados`). */
export const GET = ruta(async (req) => {
  await requerirUsuario();
  const { csv, cantidad } = await exportarAsociadosCsv(leerQuery(req, filtroAsociadosSchema));
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="asociados-mas-${hoyIso()}.csv"`,
      'Cache-Control': 'no-store',
      'X-Total-Count': String(cantidad),
    },
  });
});
