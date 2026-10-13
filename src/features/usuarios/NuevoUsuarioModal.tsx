'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { detailStyles as d, RadioOption, Stack } from '@/components/ui/Detail';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ROL_LABEL } from '@/domain/labels';
import { nuevoUsuarioSchema } from '@/domain/schemas';
import type { Rol } from '@/domain/types';
import { mensajeDeError } from '@/lib/api';
import { useCrearUsuario } from './queries';
import styles from './Usuarios.module.css';

const FORM_ID = 'form-nuevo-usuario';
const ORDEN_ROLES: Rol[] = ['administrador', 'superadmin'];

export function NuevoUsuarioModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <Formulario onClose={onClose} /> : null;
}

function Formulario({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const crear = useCrearUsuario();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<Rol>('administrador');
  const [error, setError] = useState<string | null>(null);

  const completo = nombre.trim() !== '' && email.trim() !== '';

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const datos = nuevoUsuarioSchema.safeParse({ nombre, email, rol });
    if (!datos.success) {
      setError(datos.error.issues[0]?.message ?? 'Revisá los datos.');
      return;
    }
    crear.mutate(datos.data, {
      onSuccess: () => {
        toast.exito('Usuario creado. Se envió la invitación por correo.');
        onClose();
      },
      onError: (err) => setError(mensajeDeError(err)),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      titulo="Nuevo usuario"
      descripcion="Se envía una invitación por correo con una contraseña temporal."
      acciones={
        <>
          <Button variant="ghost" size="md" grow onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" size="md" grow disabled={!completo || crear.isPending}>
            {crear.isPending ? 'Creando…' : 'Crear e invitar'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} noValidate className={styles.formFields}>
        <div className={d.field}>
          <label htmlFor="usr-nombre">Nombre y apellido</label>
          <input
            id="usr-nombre"
            type="text"
            placeholder="Ej. Valeria Suárez"
            autoComplete="off"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setError(null);
            }}
          />
        </div>
        <div className={d.field}>
          <label htmlFor="usr-email">Correo</label>
          <input
            id="usr-email"
            type="email"
            placeholder="nombre@mas.org.ar"
            autoComplete="off"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
          />
        </div>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="sr-only">Rol</legend>
          <Stack>
            {ORDEN_ROLES.map((r) => (
              <RadioOption key={r} name="rol-nuevo" value={r} checked={rol === r} onChange={() => setRol(r)}>
                {ROL_LABEL[r]}
              </RadioOption>
            ))}
          </Stack>
        </fieldset>
        {error && (
          <p className={d.formError} role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
