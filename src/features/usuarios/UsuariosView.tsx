'use client';

import { useState } from 'react';
import { EstadoUsuarioBadge, RolBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type Columna } from '@/components/ui/DataTable';
import { detailStyles as d, PageHeader } from '@/components/ui/Detail';
import { PillGroup, SearchInput, Toolbar, ToolbarDivider, type Opcion } from '@/components/ui/Filters';
import { Icon } from '@/components/ui/Icon';
import { formatFecha, formatUltimoAcceso } from '@/domain/format';
import type { FiltroUsuarios } from '@/domain/schemas';
import type { Usuario } from '@/domain/types';
import { mensajeDeError } from '@/lib/api';
import { useDebouncedValue } from '@/lib/hooks';
import { NuevoUsuarioModal } from './NuevoUsuarioModal';
import { useUsuarios } from './queries';
import { UsuarioDetalle } from './UsuarioDetalle';
import styles from './Usuarios.module.css';

const ESTADOS: Opcion<FiltroUsuarios['estado']>[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'activo', label: 'Activos' },
  { valor: 'inactivo', label: 'Inactivos' },
];

const ROLES: Opcion<FiltroUsuarios['rol']>[] = [
  { valor: 'todos', label: 'Todos los roles' },
  { valor: 'superadmin', label: 'Superadmin' },
  { valor: 'administrador', label: 'Administrador' },
];

const COLUMNAS: Columna<Usuario>[] = [
  {
    titulo: 'Usuario',
    celda: (u) => (
      <>
        <div className={d.primary}>{u.nombre}</div>
        <div className={d.secondary}>{u.email}</div>
      </>
    ),
  },
  { titulo: 'Rol', celda: (u) => <RolBadge rol={u.rol} /> },
  { titulo: 'Estado', celda: (u) => <EstadoUsuarioBadge estado={u.estado} /> },
  { titulo: 'Último acceso', celda: (u) => <span className={d.muted}>{formatUltimoAcceso(u.ultimoAcceso)}</span> },
  { titulo: 'Creado', celda: (u) => <span className={d.muted}>{formatFecha(u.fechaCreacion)}</span> },
];

function Tarjeta({ u }: { u: Usuario }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div className={d.primary}>{u.nombre}</div>
          <div className={d.secondary}>{u.email}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--chevron)' }}>
          <EstadoUsuarioBadge estado={u.estado} />
          <Icon name="chevronRight" size={15} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <RolBadge rol={u.rol} />
        <span className={d.secondary} style={{ fontSize: 11 }}>
          Último acceso: {formatUltimoAcceso(u.ultimoAcceso)}
        </span>
      </div>
    </>
  );
}

export function UsuariosView() {
  const [estado, setEstado] = useState<FiltroUsuarios['estado']>('todos');
  const [rol, setRol] = useState<FiltroUsuarios['rol']>('todos');
  const [busqueda, setBusqueda] = useState('');
  const q = useDebouncedValue(busqueda.trim()) || undefined;
  const { data, isPending, error } = useUsuarios({ estado, rol, q });

  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [creando, setCreando] = useState(false);

  return (
    <>
      <PageHeader
        titulo="Usuarios"
        subtitulo={
          data ? (
            <>
              {data.conteos.activo} activos · {data.conteos.inactivo} inactivos
              <span className={styles.desktopOnly}> · acceso al backoffice</span>.
            </>
          ) : (
            'Cargando usuarios…'
          )
        }
        accion={
          <Button variant="primary" size="md" icon="userPlus" className={styles.nuevo} onClick={() => setCreando(true)}>
            <span className={styles.desktopOnly}>Nuevo usuario</span>
            <span className={styles.mobileOnly}>Nuevo</span>
          </Button>
        }
      />

      <Toolbar>
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o correo" />
        <ToolbarDivider />
        <PillGroup label="Filtrar por estado" opciones={ESTADOS} valor={estado} onChange={setEstado} />
        <ToolbarDivider />
        <PillGroup label="Filtrar por rol" opciones={ROLES} valor={rol} onChange={setRol} />
      </Toolbar>

      <DataTable
        items={data?.items}
        columnas={COLUMNAS}
        plantilla="1.6fr 1fr .9fr 1.1fr 1fr"
        tarjeta={(u) => <Tarjeta u={u} />}
        getId={(u) => u.id}
        getLabel={(u) => `Ver usuario ${u.nombre}`}
        onSelect={(u) => {
          setSeleccionado(u);
          setAbierto(true);
        }}
        cargando={isPending}
        error={error ? mensajeDeError(error) : null}
        vacio="No hay usuarios que coincidan con la búsqueda o los filtros."
      />

      <UsuarioDetalle
        usuario={seleccionado}
        open={abierto}
        onClose={() => setAbierto(false)}
        onChange={setSeleccionado}
      />
      <NuevoUsuarioModal open={creando} onClose={() => setCreando(false)} />
    </>
  );
}
