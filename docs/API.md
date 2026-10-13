# Contrato de datos

El backoffice es un **BFF** (backend-for-frontend): el navegador solo habla con las rutas `/api/*` de esta app, que validan la sesión y delegan en un repositorio. Hoy el repositorio es un mock en memoria; para conectar el Portal de afiliaciones hay que implementar el adaptador HTTP y poner `DATA_SOURCE=portal`.

```
Navegador ──► /api/* (Route Handlers) ──► services (reglas de negocio) ──► repositorio
                 sesión + validación                                    ├─ mock.ts        (DATA_SOURCE=mock)
                                                                        └─ portal-api.ts  (DATA_SOURCE=portal)
```

Tipos de referencia: [`src/domain/types.ts`](../src/domain/types.ts). Validaciones: [`src/domain/schemas.ts`](../src/domain/schemas.ts).

---

## 1. Lo que el backoffice espera del Portal

Es lo que hoy asume [`src/server/repositories/portal-api.ts`](../src/server/repositories/portal-api.ts). **Es una propuesta**: si el Portal expone otra forma, solo se ajusta ese archivo (o se mapea DTO → dominio ahí mismo).

Autenticación server-to-server: `Authorization: Bearer ${PORTAL_API_TOKEN}`. Fechas en ISO 8601. DNI solo dígitos.

### Solicitudes (formulario "Me afilio como…" del Portal)

| Método  | Ruta                                                 | Respuesta                                |
| ------- | ---------------------------------------------------- | ---------------------------------------- |
| `GET`   | `/solicitudes?estado=&segmento=&q=`                  | `Listado<Solicitud, ConteosSolicitudes>` |
| `GET`   | `/solicitudes/{id}`                                  | `Solicitud` (404 si no existe)           |
| `PATCH` | `/solicitudes/{id}` body `{ "estado": "rechazada" }` | `Solicitud`                              |

```jsonc
// Solicitud
{
  "id": "S-0231",
  "nombre": "María",
  "apellido": "González",
  "dni": "32456789",
  "segmento": "policia", // policia | salud | caja
  "correo": "maria.gonzalez@mail.com",
  "telefono": "+54 9 11 5544-0021",
  "fechaSolicitud": "2026-09-18",
  "estado": "pendiente", // pendiente | rechazada | aprobada
  "documentos": [
    // URLs firmadas / de corta duración: el backoffice las abre en otra pestaña.
    { "tipo": "dni_frente", "nombreArchivo": "dni-frente.jpg", "url": "https://…" },
    { "tipo": "dni_dorso", "nombreArchivo": "dni-dorso.jpg", "url": "https://…" },
    { "tipo": "recibo_sueldo", "nombreArchivo": "recibo-sueldo.pdf", "url": "https://…" },
  ],
}
```

- `estado=todas` devuelve pendientes + rechazadas (nunca aprobadas). La cola de pendientes se ordena **FIFO** (más antigua primero).
- `q` busca por nombre, apellido o DNI (con o sin puntos, sin distinguir tildes).
- `conteos`: `{ "pendiente": n, "rechazada": n, "total": n }` sobre todas las solicitudes, sin filtros.

### Asociados

| Método  | Ruta                                                 | Respuesta                                |
| ------- | ---------------------------------------------------- | ---------------------------------------- |
| `GET`   | `/asociados?estado=&segmento=&q=&desde=&hasta=&dni=` | `Listado<Asociado, ConteosAsociados>`    |
| `GET`   | `/asociados/{id}`                                    | `Asociado`                               |
| `POST`  | `/asociados`                                         | `Asociado` creado (alta desde solicitud) |
| `PATCH` | `/asociados/{id}` body `{ estado, motivoPausa }`     | `Asociado`                               |

- N.° de afiliado = **año de alta + N.° de DNI** (`2026-32456789`).
- `motivoPausa`: `falta_de_pago | en_revision | otro` (solo con `estado=pausado`).
- Las bajas no borran: pasan a `estado=inactivo` (histórico, auditoría).

### Usuarios del backoffice

`/backoffice/usuarios` (CRUD + `/{id}/credenciales`). Si el backoffice termina teniendo su propia base de datos, este repositorio se implementa contra esa base y no contra el Portal.

---

## 2. API interna del backoffice (`/api/*`)

Todas requieren sesión (cookie `mas_session`). Errores con forma `{ "error": { "codigo", "mensaje" } }`:
`401 NO_AUTENTICADO`, `403 SIN_PERMISO`, `404 NO_ENCONTRADO`, `409 CONFLICTO | TRANSICION_INVALIDA`, `422 VALIDACION`, `502 UPSTREAM`.

| Método  | Ruta                          | Rol        | Descripción                                                                       |
| ------- | ----------------------------- | ---------- | --------------------------------------------------------------------------------- |
| `GET`   | `/api/solicitudes`            | todos      | Listado filtrado                                                                  |
| `PATCH` | `/api/solicitudes/{id}`       | todos      | `{ accion: aprobar \| rechazar \| volver_a_pendiente }`. Aprobar crea el asociado |
| `GET`   | `/api/asociados`              | todos      | Listado filtrado                                                                  |
| `GET`   | `/api/asociados/exportar`     | todos      | CSV (`;`, UTF-8 con BOM) con los mismos filtros                                   |
| `PATCH` | `/api/asociados/{id}`         | todos      | `{ accion: pausar, motivo } \| { accion: reactivar } \| { accion: desactivar }`   |
| `GET`   | `/api/panel`                  | superadmin | KPIs y usuarios recientes                                                         |
| `GET`   | `/api/usuarios`               | superadmin | Listado filtrado                                                                  |
| `POST`  | `/api/usuarios`               | superadmin | Alta + invitación con contraseña temporal                                         |
| `PATCH` | `/api/usuarios/{id}`          | superadmin | `{ rol?, estado? }`                                                               |
| `POST`  | `/api/usuarios/{id}/password` | superadmin | Genera contraseña temporal (se devuelve una sola vez)                             |
| `PUT`   | `/api/usuarios/{id}/password` | superadmin | Envía por correo la contraseña temporal vigente                                   |
| `GET`   | `/api/auth/salir`             | —          | Borra la cookie y redirige al login                                               |

### Transiciones de estado válidas

```
Solicitud:  pendiente ──aprobar──► aprobada (crea Asociado)
            pendiente ──rechazar─► rechazada ──volver_a_pendiente──► pendiente

Asociado:   activo ──pausar(motivo)──► pausado ──reactivar──► activo
            activo | pausado ──desactivar──► inactivo (histórico)
```

Cualquier otra transición responde `409 TRANSICION_INVALIDA`.
