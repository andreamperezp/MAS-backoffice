# MAS – Backoffice de afiliaciones

Panel de administración de **Mutual Argentina Solidaria** para gestionar las solicitudes de afiliación que llegan desde el [Portal de afiliaciones](https://masmutual.grupodelsud.com/): revisión y aprobación de solicitudes, padrón de asociados con carnet digital, exportación para el Ministerio / Caja de Policía y administración de usuarios del equipo.

> **Estado:** UI completa y funcional, desktop y mobile, fiel al diseño. Los datos son **mock (hardcodeados en memoria)** detrás de una capa de repositorios lista para conectar con la API del Portal. Ver [Integración con el Portal](#integración-con-el-portal).

## Inicio rápido

Requisitos: **Node.js ≥ 20.9** (recomendado 24, ver `.nvmrc`).

```bash
npm install
npm run dev
```

Abrir <http://localhost:3000>. No hace falta configurar nada para desarrollo.

### Usuarios de prueba

| Usuario      | Contraseña | Rol           | Ve                                      |
| ------------ | ---------- | ------------- | --------------------------------------- |
| `superadmin` | `mas2026`  | Superadmin    | Panel, Solicitudes, Asociados, Usuarios |
| `admin`      | `mas2026`  | Administrador | Solicitudes, Asociados                  |

También se puede ingresar con el correo (`admin@mas.org.ar`). Los datos mock se reinician al reiniciar el servidor.

## Scripts

| Comando             | Qué hace                                                   |
| ------------------- | ---------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo (Turbopack)                         |
| `npm run build`     | Build de producción                                        |
| `npm start`         | Sirve el build (requiere `AUTH_SECRET`)                    |
| `npm test`          | Tests unitarios (Vitest): dominio, reglas de negocio, auth |
| `npm run typecheck` | TypeScript estricto                                        |
| `npm run lint`      | ESLint (config de Next)                                    |
| `npm run format`    | Prettier                                                   |
| `npm run check`     | Todo lo anterior junto (lo corre la CI en cada push / PR)  |

## Variables de entorno

Copiar `.env.example` a `.env.local`.

| Variable           | Default | Descripción                                                                |
| ------------------ | ------- | -------------------------------------------------------------------------- |
| `AUTH_SECRET`      | —       | Secreto para firmar la sesión. **Obligatorio en producción** (≥ 32 chars). |
| `DATA_SOURCE`      | `mock`  | `mock` o `portal`                                                          |
| `PORTAL_API_URL`   | —       | Base URL de la API del Portal (con `DATA_SOURCE=portal`)                   |
| `PORTAL_API_TOKEN` | —       | Token server-to-server del Portal. Nunca se expone al navegador.           |
| `MOCK_LATENCY_MS`  | `200`   | Latencia simulada del mock, para ver estados de carga                      |

## Stack

- **Next.js 16** (App Router, Cache Components, `proxy.ts`) + **React 19** + **TypeScript** estricto. Mismo framework que el Portal.
- **TanStack Query** para datos en el cliente (caché, invalidación tras mutaciones, estados de carga).
- **Zod** para validar todo lo que entra (query strings, bodies, formularios), compartido cliente/servidor.
- **CSS Modules** con los tokens del diseño en `src/app/globals.css`. Fuente de marca **Liebling** vía `next/font/local`.
- **jose** (JWT de sesión), `node:crypto` scrypt (hash de contraseñas), **qrcode** (QR del carnet).
- **Vitest** + **Prettier** + **ESLint** + GitHub Actions.

## Arquitectura

```
src/
├── app/                      Rutas (App Router)
│   ├── login/                Pantalla de login (Server Action)
│   ├── (backoffice)/         Pantallas autenticadas: panel, solicitudes, asociados, usuarios
│   │   └── layout.tsx        Valida la sesión en el servidor y monta el shell
│   └── api/                  BFF: Route Handlers que consume el navegador
├── proxy.ts                  Redirecciones optimistas por sesión/rol (ex-middleware)
├── domain/                   Modelo puro, compartido cliente/servidor
│   ├── types.ts              Solicitud, Asociado, Usuario, estados, segmentos
│   ├── schemas.ts            Validaciones Zod (filtros y comandos)
│   ├── filters.ts            Filtros/búsqueda (especificación del comportamiento)
│   ├── permisos.ts           Qué rol ve qué sección
│   ├── format.ts, labels.ts  Formatos (DNI, fechas, N.° de afiliado) y textos
│   └── csv.ts                Exportación del padrón
├── server/                   Solo servidor (`server-only`)
│   ├── auth/                 Sesión (JWT en cookie httpOnly), hash de contraseñas
│   ├── services/             Reglas de negocio y transiciones de estado
│   ├── repositories/         Acceso a datos: interfaz + mock + adaptador del Portal
│   ├── mock/seed.ts          Datos hardcodeados
│   ├── notificaciones.ts     WhatsApp / correo (hoy loguea en consola)
│   └── http.ts               Helper de Route Handlers: errores, validación, CSRF
├── features/                 UI por módulo (vistas, drawers, modales, hooks de datos)
├── components/               UI reutilizable (layout + kit: Button, Badge, Drawer, Modal, DataTable…)
└── lib/                      Cliente HTTP del navegador y hooks genéricos
```

**Flujo de datos:** la UI (client components) llama a `/api/*` con TanStack Query → el Route Handler valida sesión/rol y la entrada con Zod → un **service** aplica las reglas de negocio → el **repositorio** lee/escribe. La UI nunca llama al Portal directamente.

**Responsive:** un solo árbol de componentes. Por debajo de `1024px` el shell cambia a top bar + bottom nav, las tablas a tarjetas, los drawers a bottom sheets y los modales se anclan abajo (todo por CSS, sin duplicar lógica).

## Reglas de negocio implementadas

- **Solicitudes:** cola FIFO de pendientes. _Aprobar_ crea el asociado con N.° de afiliado = año de alta + DNI, la saca de la cola y notifica por WhatsApp. No se puede aprobar un DNI que ya es asociado. _Rechazar_ deja la solicitud para seguimiento telefónico; _Volver a pendiente_ la reingresa.
- **Asociados:** _Pausar / Mora_ exige motivo (falta de pago, en revisión, otro) y notifica; _Reactivar_; _Desactivar_ pasa al histórico sin borrar (pide confirmación). Carnet digital con QR, descarga en PNG y envío por WhatsApp (abre `wa.me` con el mensaje armado).
- **Exportar:** CSV filtrable por segmento, estado y rango de fechas, con preview de la cantidad.
- **Usuarios (superadmin):** alta con invitación y contraseña temporal, cambio de rol, desactivar/reactivar acceso (sin borrar, para auditoría), restablecer contraseña. Nadie puede quitarse su propio rol/acceso y siempre queda al menos un superadmin activo.

## Seguridad

- Sesión en cookie `httpOnly` + `SameSite=Lax` + `Secure` (prod), JWT firmado HS256, 8 h.
- Autorización real en cada Route Handler y en el layout (Data Access Layer); el `proxy.ts` es solo una redirección optimista. Una sesión de un usuario desactivado deja de valer al instante.
- Contraseñas con scrypt + salt; verificación en tiempo constante y hash señuelo para no revelar si un usuario existe.
- Chequeo de `Origin` en mutaciones (CSRF), validación Zod de toda entrada, protección contra open-redirect en el login y contra inyección de fórmulas en el CSV.
- Headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Sin `X-Powered-By`.

## Integración con el Portal

1. Acordar con el equipo del Portal el contrato propuesto en **[docs/API.md](docs/API.md)** (o mapear el que exista).
2. Completar/ajustar [`src/server/repositories/portal-api.ts`](src/server/repositories/portal-api.ts).
3. Configurar `DATA_SOURCE=portal`, `PORTAL_API_URL` y `PORTAL_API_TOKEN`.

Services, rutas `/api/*` y UI no cambian. Los filtros de [`src/domain/filters.ts`](src/domain/filters.ts) documentan el comportamiento esperado de las búsquedas.

## Pendientes conocidos (TODO)

- [ ] **Persistencia real**: base de datos o API del Portal (hoy: memoria, se reinicia con el servidor).
- [ ] **Notificaciones reales**: integrar WhatsApp Business API y SMTP en `src/server/notificaciones.ts`.
- [ ] **Cambio de contraseña obligatorio** al ingresar con contraseña temporal (el flag `debeCambiarPassword` ya se guarda).
- [ ] **Formato de exportación**: confirmar columnas exactas que piden el Ministerio y la Caja (`src/domain/csv.ts`).
- [ ] **QR del carnet**: apuntar a la página pública de validación de credenciales cuando exista (`src/features/asociados/carnet-utils.ts`).
- [ ] **Documentos**: servir los archivos del Portal con URLs firmadas o vía un endpoint proxy autenticado.
- [ ] **Rate limiting** del login y **paginación** server-side cuando el padrón crezca.
- [ ] Auditoría (quién aprobó/pausó/desactivó y cuándo).

## Notas sobre el diseño

Se implementaron las 10 pantallas del diseño (5 desktop + 5 mobile). Diferencias intencionales:

- **Datos de ejemplo**: se cambiaron dos asociados del mock que repetían DNI con solicitudes pendientes, para que aprobarlas no genere duplicados. El usuario `admin` es Administrador (no Superadmin) para que coincida con el login de prueba.
- **Confirmación** antes de _Desactivar_ (asociado o acceso de usuario), por ser acciones sin deshacer desde la UI.
- **¿Olvidaste tu contraseña?** muestra cómo pedir el restablecimiento (lo hace un superadmin desde Usuarios).
- El contador de pendientes del menú se muestra en todas las pantallas.
