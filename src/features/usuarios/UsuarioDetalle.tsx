'use client';

import { useState } from 'react';
import { EstadoUsuarioBadge, RolBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { detailStyles as d, InfoGrid, RadioOption, Section, Stack } from '@/components/ui/Detail';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatFecha, formatUltimoAcceso } from '@/domain/format';
import { ROL_LABEL } from '@/domain/labels';
import type { ActualizarUsuario } from '@/domain/schemas';
import type { Rol, Usuario } from '@/domain/types';
import { useSession } from '@/features/auth/session-context';
import { mensajeDeError } from '@/lib/api';
import { useActualizarUsuario, useRestablecerPassword } from './queries';
import { ResetPasswordModal } from './ResetPasswordModal';

const OPCIONES_ROL: Array<{ rol: Rol; descripcion: string }> = [
  { rol: 'administrador', descripcion: 'Administrador — gestiona solicitudes y asociados' },
  { rol: 'superadmin', descripcion: 'Superadmin — además gestiona usuarios y accesos' },
];

interface Props {
  usuario: Usuario | null;
  open: boolean;
  onClose: () => void;
  onChange: (u: Usuario) => void;
}

export function UsuarioDetalle({ usuario: u, open, onClose, onChange }: Props) {
  const toast = useToast();
  const yo = useSession();
  const actualizar = useActualizarUsuario();
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);
  const restablecer = useRestablecerPassword();
  const [passwordTemporal, setPasswordTemporal] = useState<string | null>(null);

  const esYo = u?.id === yo.id;

  const aplicar = (cambios: ActualizarUsuario, mensaje: string, alTerminar?: () => void) => {
    if (!u) return;
    actualizar.mutate(
      { id: u.id, cambios },
      {
        onSuccess: (actualizado) => {
          onChange(actualizado);
          toast.exito(mensaje);
          alTerminar?.();
        },
        onError: (e) => toast.error(mensajeDeError(e)),
      },
    );
  };

  return (
    <>
      <Drawer
        open={open && !!u}
        onClose={onClose}
        width={440}
        titulo={u?.nombre ?? ''}
        badges={
          u && (
            <>
              <RolBadge rol={u.rol} />
              <EstadoUsuarioBadge estado={u.estado} />
            </>
          )
        }
        footer={
          u && (
            <Stack>
              <h3 className={d.sectionTitle} style={{ marginBottom: 2 }}>
                Acciones
              </h3>
              <Button
                variant="approve"
                size="lg"
                block
                icon="lock"
                disabled={restablecer.isPending}
                onClick={() =>
                  restablecer.mutate(u.id, {
                    onSuccess: ({ passwordTemporal }) => setPasswordTemporal(passwordTemporal),
                    onError: (e) => toast.error(mensajeDeError(e)),
                  })
                }
              >
                {restablecer.isPending ? 'Generando…' : 'Restablecer contraseña'}
              </Button>
              {u.estado === 'activo' ? (
                <Button
                  variant="danger"
                  size="lg"
                  block
                  icon="xCircle"
                  disabled={esYo || actualizar.isPending}
                  title={esYo ? 'No podés desactivar tu propio acceso' : undefined}
                  onClick={() => setConfirmandoBaja(true)}
                >
                  Desactivar acceso
                </Button>
              ) : (
                <Button
                  variant="approve"
                  size="lg"
                  block
                  icon="check"
                  disabled={actualizar.isPending}
                  onClick={() => aplicar({ estado: 'activo' }, 'Acceso reactivado.')}
                >
                  Reactivar acceso
                </Button>
              )}
              <p className={d.hint} style={{ marginTop: 0 }}>
                Un usuario desactivado no se elimina: queda registrado para auditoría y puede reactivarse cuando haga
                falta.
              </p>
            </Stack>
          )
        }
      >
        {u && (
          <>
            <Section titulo="Datos del usuario">
              <InfoGrid
                items={[
                  ['Correo', u.email],
                  ['Último acceso', formatUltimoAcceso(u.ultimoAcceso)],
                  ['Fecha de creación', formatFecha(u.fechaCreacion)],
                  ['Rol actual', ROL_LABEL[u.rol]],
                ]}
              />
            </Section>

            <Section titulo="Rol">
              <fieldset style={{ border: 0, padding: 0, margin: 0 }} disabled={esYo || actualizar.isPending}>
                <legend className="sr-only">Rol del usuario</legend>
                <Stack>
                  {OPCIONES_ROL.map(({ rol, descripcion }) => (
                    <RadioOption
                      key={rol}
                      name={`rol-${u.id}`}
                      value={rol}
                      checked={u.rol === rol}
                      onChange={() => aplicar({ rol }, `Rol actualizado a ${ROL_LABEL[rol]}.`)}
                    >
                      {descripcion}
                    </RadioOption>
                  ))}
                </Stack>
              </fieldset>
              {esYo && <p className={d.hint}>No podés cambiar tu propio rol.</p>}
            </Section>
          </>
        )}
      </Drawer>

      <ConfirmModal
        open={confirmandoBaja}
        onClose={() => setConfirmandoBaja(false)}
        onConfirm={() =>
          aplicar({ estado: 'inactivo' }, 'Acceso desactivado. El usuario queda registrado para auditoría.', () =>
            setConfirmandoBaja(false),
          )
        }
        pending={actualizar.isPending}
        titulo={`Desactivar acceso de ${u?.nombre ?? ''}`}
        descripcion="No va a poder ingresar al backoffice. Podés reactivarlo cuando haga falta."
        confirmLabel="Desactivar acceso"
      />

      {u && (
        <ResetPasswordModal usuario={u} passwordTemporal={passwordTemporal} onClose={() => setPasswordTemporal(null)} />
      )}
    </>
  );
}
