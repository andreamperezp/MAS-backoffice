# Plan de pruebas manuales (QA)

Guía para validar el **Backoffice de afiliaciones de MAS** de punta a punta, sobre todo cuando esté conectado al Portal de afiliaciones, a WhatsApp y al correo.

## 1. Cómo encarar la validación

El backoffice no vive solo: es el **eslabón del medio** de un circuito. Por eso conviene probar en tres capas:

```
[Portal]  persona completa el formulario y sube DNI + recibo
    │
    ▼
[Backoffice]  administrativa revisa → aprueba / rechaza → gestiona el asociado
    │
    ▼
[Salidas]  WhatsApp al asociado · correo a usuarios · CSV al Ministerio/Caja · carnet digital
```

1. **Pantalla por pantalla** (funcional): cada botón, filtro y mensaje hace lo que dice.
2. **Por rol** (permisos): lo que ve y puede hacer un Superadmin vs. un Administrador.
3. **De punta a punta** (integración): un dato que nace en el Portal tiene que llegar bien al backoffice, y lo que se hace en el backoffice tiene que llegar bien a la persona (WhatsApp, carnet) y a los reportes (CSV).

> La capa 3 es la más importante cuando esté todo conectado: la mayoría de los errores reales aparecen en los **traspasos** entre sistemas, no dentro de una pantalla.

### Ambiente y datos necesarios

| Necesito                                                                                         | Para qué                                      |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| Ambiente de pruebas (staging) del Portal y del Backoffice, conectados                            | No probar con afiliados reales                |
| 1 usuario **Superadmin** y 2 **Administradores**                                                 | Probar permisos y acciones simultáneas        |
| 2 celulares con WhatsApp de prueba                                                               | Recibir notificaciones y el carnet            |
| 2 casillas de correo de prueba                                                                   | Invitaciones y contraseñas temporales         |
| Archivos de prueba: DNI (jpg/png), recibo (pdf), un archivo pesado (>5 MB) y uno con nombre raro | Probar la carga y visualización de documentos |
| Nombres con tildes, ñ y apóstrofes (ej. _Iñaki D'Angelo Núñez_)                                  | Detectar problemas de codificación            |
| Navegadores: Chrome, Edge, Safari (iPhone) y Chrome (Android)                                    | Compatibilidad                                |

### Cómo registrar los resultados

Por cada caso: **ID · Resultado (OK / Falla / Bloqueado) · Evidencia (captura o video) · Navegador/dispositivo · Observaciones**. Una falla se reporta con: pasos exactos, qué esperaba, qué pasó, captura, hora y usuario usado (para buscar en los logs).

**Prioridad:** 🔴 Crítica (bloquea el circuito o afecta datos/seguridad) · 🟠 Alta · 🟢 Media.

---

## 2. Casos de prueba

### A. Acceso y sesión

| ID   | Prioridad | Caso                           | Pasos                                                                                            | Resultado esperado                                                        |
| ---- | --------- | ------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| A-01 | 🔴        | Login correcto Superadmin      | Ingresar usuario y contraseña válidos de un Superadmin                                           | Entra al **Panel** del superadmin (con Usuarios en el menú)               |
| A-02 | 🔴        | Login correcto Administrador   | Ingresar con un Administrador                                                                    | Entra a **su Panel** (sin la sección Usuarios en el menú)                 |
| A-03 | 🟠        | Login con correo               | Ingresar con el correo en vez del usuario                                                        | Ingresa igual                                                             |
| A-04 | 🔴        | Contraseña incorrecta          | Usuario válido + contraseña errónea                                                              | Mensaje "Usuario o contraseña incorrectos". No dice cuál de los dos falló |
| A-05 | 🟠        | Campos vacíos                  | Tocar _Ingresar_ sin completar                                                                   | Avisa "Ingresá tu usuario" / "Ingresá tu contraseña" debajo de cada campo |
| A-06 | 🔴        | Usuario desactivado            | Desactivar un usuario y luego intentar ingresar con él                                           | No puede ingresar                                                         |
| A-07 | 🔴        | Desactivado con sesión abierta | Usuario B logueado; el Superadmin lo desactiva; B toca cualquier botón o recarga                 | B es enviado al login inmediatamente                                      |
| A-08 | 🔴        | Cerrar sesión                  | _Cerrar sesión_ (desktop) o avatar → _Cerrar sesión_ (mobile); luego tocar "Atrás" del navegador | Vuelve al login; con "Atrás" no se ve información                         |
| A-09 | 🟠        | Link directo sin sesión        | Pegar `/asociados` en una ventana de incógnito                                                   | Va al login; al ingresar, vuelve a `/asociados`                           |
| A-10 | 🟠        | Sesión vencida                 | Dejar la sesión abierta más de 8 h y operar                                                      | Pide login de nuevo, sin errores raros                                    |
| A-11 | 🟢        | Olvidé mi contraseña           | Tocar "¿Olvidaste tu contraseña?"                                                                | Explica que la restablece un superadmin                                   |

### B. Permisos por rol

| ID   | Prioridad | Caso                                          | Pasos                                                                         | Resultado esperado                                                                      |
| ---- | --------- | --------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| B-01 | 🔴        | Administrador no accede a Usuarios            | Logueado como Administrador, escribir `/usuarios` en la barra                 | Lo devuelve a su Panel                                                                  |
| B-02 | 🔴        | Panel del Administrador sin datos de usuarios | Abrir el Panel como Administrador                                             | Ve _Altas del mes_ en lugar de _Usuarios_; no aparece ningún nombre o correo del equipo |
| B-03 | 🟠        | Cambio de rol en caliente                     | Superadmin pasa a B de Superadmin → Administrador mientras B está en Usuarios | Al operar, B pierde el acceso a Usuarios                                                |
| B-04 | 🔴        | Nadie se quita su propio acceso               | Superadmin abre su propio usuario                                             | No puede cambiarse el rol ni desactivarse (opciones bloqueadas)                         |
| B-05 | 🔴        | Siempre queda un Superadmin                   | Con un solo Superadmin activo, otro intenta desactivarlo o bajarle el rol     | Lo impide con mensaje claro                                                             |

### C. Circuito principal: Portal → Solicitud → Asociado ⭐ (integración)

| ID   | Prioridad | Caso                                  | Pasos                                                                                                 | Resultado esperado                                                                                                     |
| ---- | --------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| C-01 | 🔴        | La solicitud llega desde el Portal    | En el Portal, completar el formulario (segmento Policía) con DNI frente, dorso y recibo               | Aparece en **Solicitudes → Pendientes** con nombre, DNI, segmento, correo, teléfono y fecha **idénticos** a lo cargado |
| C-02 | 🔴        | Documentos visibles                   | Abrir la solicitud → _Ver_ en cada documento                                                          | Se abren los 3 archivos correctos de **esa** persona (no de otra), legibles                                            |
| C-03 | 🟠        | Documento pesado o formato poco común | Cargar en el Portal un PDF grande o una foto HEIC/PNG                                                 | Se ve en el backoffice o, si no se puede previsualizar, se descarga                                                    |
| C-04 | 🔴        | Caracteres especiales                 | Solicitud a nombre de _Iñaki D'Angelo Núñez_                                                          | Se ve bien en lista, detalle, carnet, búsqueda y CSV (sin símbolos raros)                                              |
| C-05 | 🔴        | Aprobar                               | Abrir una pendiente → _Aprobar_                                                                       | Desaparece de Pendientes; aparece en **Asociados** como _Activo_ con N.° de afiliado = **año actual + DNI**            |
| C-06 | 🔴        | WhatsApp de bienvenida                | Después de C-05, revisar el celular de prueba                                                         | Llega el mensaje con el **nombre** y el **N.° de afiliado correctos**                                                  |
| C-07 | 🔴        | Carnet digital                        | En Asociados, abrir el aprobado → ver carnet → _Descargar_ y _Enviar por WhatsApp_                    | Carnet con nombre, DNI y N.° correctos; el PNG se descarga; WhatsApp abre el chat con el número correcto               |
| C-08 | 🟠        | QR del carnet                         | Escanear el QR con un celular                                                                         | Muestra/valida el N.° de afiliado de esa persona                                                                       |
| C-09 | 🔴        | Rechazar                              | Rechazar una pendiente                                                                                | Queda en _Rechazadas_; no se crea asociado ni carnet                                                                   |
| C-10 | 🔴        | Reenvío tras rechazo                  | La persona reenvía lo que faltaba (según el proceso acordado) → en el backoffice _Volver a pendiente_ | Vuelve a Pendientes **con los documentos nuevos**                                                                      |
| C-11 | 🔴        | DNI ya afiliado                       | Enviar desde el Portal una solicitud con el DNI de un asociado existente → intentar aprobar           | No permite aprobar; avisa que ya existe ese asociado                                                                   |
| C-12 | 🔴        | Dos administrativas a la vez          | Dos usuarios abren la **misma** solicitud; uno aprueba y el otro, sin recargar, rechaza (o aprueba)   | La segunda acción falla con un mensaje claro; **no** se crean dos asociados                                            |
| C-13 | 🟠        | Orden de la cola                      | Cargar 3 solicitudes en días distintos                                                                | Pendientes muestra primero la **más antigua**                                                                          |
| C-14 | 🟠        | Fecha de alta en el límite del día    | Aprobar a las 23:50 (hora Argentina) y a las 00:05                                                    | La fecha de alta y el año del N.° de afiliado corresponden a la fecha **argentina**                                    |
| C-15 | 🟠        | El Portal no responde                 | Con el Portal caído o lento, abrir Solicitudes o aprobar                                              | Mensaje "No se pudo comunicar con el Portal…"; no queda nada a medio hacer (ni solicitud aprobada sin asociado)        |

### D. Asociados

| ID   | Prioridad | Caso               | Pasos                                                                               | Resultado esperado                                                                        |
| ---- | --------- | ------------------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| D-01 | 🔴        | Pausar / Mora      | Asociado activo → _Pausar / Mora_ → elegir motivo → _Confirmar_                     | Pasa a _Pausado_ con el motivo visible; el botón _Confirmar_ no se habilita sin motivo    |
| D-02 | 🔴        | WhatsApp de pausa  | Revisar el celular tras D-01                                                        | Llega el aviso con el motivo correcto                                                     |
| D-03 | 🔴        | Reactivar          | Asociado pausado → _Reactivar_                                                      | Vuelve a _Activo_, se borra el motivo y llega WhatsApp de reactivación                    |
| D-04 | 🔴        | Desactivar         | _Desactivar_ → confirmar                                                            | Pide confirmación; pasa a _Histórico_; **no se borra** (se encuentra filtrando Histórico) |
| D-05 | 🟠        | Búsqueda           | Buscar por DNI con puntos, sin puntos, por N.° de afiliado y por apellido sin tilde | Encuentra al asociado en todos los casos                                                  |
| D-06 | 🟠        | Filtros combinados | Combinar estado + segmento + rango de fechas                                        | La lista y los contadores coinciden con lo esperado; _Limpiar fechas_ restablece          |
| D-07 | 🟢        | Volumen            | Con el padrón real (cientos/miles de asociados)                                     | La lista carga en pocos segundos y la búsqueda responde fluida                            |

### E. Exportación (Ministerio / Caja)

| ID   | Prioridad | Caso                  | Pasos                                                          | Resultado esperado                                                         |
| ---- | --------- | --------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| E-01 | 🔴        | Exportar con filtros  | _Exportar_ → elegir segmento, estado y fechas → _Exportar_     | La cantidad anunciada coincide con las filas del archivo                   |
| E-02 | 🔴        | Abrir en Excel        | Abrir el CSV con doble clic en Excel                           | Columnas separadas, tildes y ñ correctas, DNI con puntos, teléfono legible |
| E-03 | 🔴        | Formato del organismo | Comparar con la planilla modelo del Ministerio / Caja          | Columnas, orden y formatos exactamente como lo pide cada organismo         |
| E-04 | 🟠        | Seguridad del archivo | Asociado con apellido `=SUMA(1;1)` → exportar → abrir en Excel | Se ve como texto, **no** se ejecuta como fórmula                           |
| E-05 | 🟢        | Sin resultados        | Filtros que no traen nadie                                     | Muestra 0 y no permite exportar un archivo vacío                           |

### F. Usuarios del equipo (solo Superadmin)

| ID   | Prioridad | Caso                          | Pasos                                                     | Resultado esperado                                                                             |
| ---- | --------- | ----------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| F-01 | 🔴        | Alta e invitación             | _Nuevo usuario_ → nombre, correo, rol → _Crear e invitar_ | Aparece en la lista; llega un correo con la contraseña temporal                                |
| F-02 | 🔴        | Primer ingreso                | Ingresar con la contraseña temporal recibida              | Ingresa y le pide cambiar la contraseña _(pendiente de desarrollo: verificar cuando esté)_     |
| F-03 | 🟠        | Correo duplicado              | Crear un usuario con un correo ya existente               | Lo impide con mensaje claro                                                                    |
| F-04 | 🟠        | Correo inválido               | Ingresar `nombre@` como correo                            | Avisa que el correo es inválido                                                                |
| F-05 | 🔴        | Restablecer contraseña        | _Restablecer contraseña_ → _Enviar por correo_            | Se muestra una contraseña temporal; llega por correo; la contraseña anterior deja de funcionar |
| F-06 | 🟠        | Cambiar rol                   | Pasar un usuario a Superadmin y volver                    | Cambia el badge y lo que ese usuario ve al ingresar                                            |
| F-07 | 🟠        | Desactivar / Reactivar acceso | Desactivar → confirmar → reactivar                        | No puede ingresar mientras está inactivo; al reactivar, sí                                     |

### G. Panel

| ID   | Prioridad | Caso                   | Pasos                                            | Resultado esperado                                                                                   |
| ---- | --------- | ---------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| G-01 | 🟠        | Números consistentes   | Comparar cada tarjeta del Panel con los listados | Activos, pendientes, rechazadas, altas del mes y usuarios coinciden con lo que se ve en cada sección |
| G-02 | 🟠        | Se actualiza al operar | Aprobar una solicitud y volver al Panel          | Pendientes baja en 1, Activos y Altas del mes suben en 1                                             |
| G-03 | 🟢        | Días de espera         | Ver la tarjeta _Pendientes_ del Administrador    | "La más antigua espera N días" coincide con la fecha de la solicitud más vieja                       |
| G-04 | 🟢        | Accesos rápidos        | Tocar cada acceso                                | Lleva a la sección correcta; _Seguimiento de rechazadas_ abre Solicitudes ya filtrado en Rechazadas  |

### H. Mobile, navegadores y usabilidad

| ID   | Prioridad | Caso                     | Pasos                                            | Resultado esperado                                                                                     |
| ---- | --------- | ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| H-01 | 🟠        | Celular                  | Recorrer todas las pantallas en Android y iPhone | Menú inferior, tarjetas y paneles que suben desde abajo; nada se corta ni obliga a deslizar de costado |
| H-02 | 🟠        | Aprobar desde el celular | Hacer C-05 completo desde el celular             | Funciona igual que en desktop                                                                          |
| H-03 | 🟢        | Navegadores              | Repetir los casos 🔴 en Chrome, Edge y Safari    | Mismo comportamiento                                                                                   |
| H-04 | 🟢        | Teclado                  | Recorrer con _Tab_ / _Enter_ / _Esc_             | Se puede abrir y cerrar el detalle y los modales sin mouse                                             |
| H-05 | 🟢        | Mensajes                 | Revisar los avisos (toasts) y errores            | En español, claros, sin códigos técnicos                                                               |

---

## 3. Recorrido de humo (antes de cada entrega)

Si hay poco tiempo, estos 10 pasos cubren lo esencial (~20 min):

1. Login como Administrador → ve su Panel (A-02).
2. Enviar una solicitud desde el Portal (C-01) y verla con sus 3 documentos (C-02).
3. Aprobarla (C-05) → llega el WhatsApp (C-06) → carnet correcto (C-07).
4. Rechazar otra (C-09) y volverla a pendiente (C-10).
5. Pausar un asociado y reactivarlo (D-01, D-03).
6. Exportar y abrir en Excel (E-01, E-02).
7. Login como Superadmin → crear usuario y recibir la invitación (F-01).
8. Como Administrador, intentar entrar a `/usuarios` (B-01).
9. Revisar que el Panel refleje todo lo anterior (G-02).
10. Repetir los pasos 2–3 desde el celular (H-02).

## 4. Preguntas a cerrar con el negocio antes de probar

- ¿Qué columnas y formato exacto exige cada organismo para la exportación? (E-03)
- Tras un rechazo, ¿cómo reenvía la persona los documentos: nueva solicitud en el Portal o actualiza la existente? (C-10)
- ¿Qué tiene que mostrar el QR del carnet al escanearlo? (C-08)
- ¿Qué formatos y tamaño máximo de archivo acepta el Portal? (C-03)
- Textos definitivos de los mensajes de WhatsApp y correo.
