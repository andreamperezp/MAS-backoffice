'use client';

import { useSearchParams } from 'next/navigation';
import { useActionState, useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { iniciarSesion, type EstadoLogin } from './actions';
import styles from './LoginForm.module.css';

type Campo = 'usuario' | 'contrasena';
const MENSAJES: Record<Campo, string> = { usuario: 'Ingresá tu usuario', contrasena: 'Ingresá tu contraseña' };

export function LoginForm() {
  const volver = useSearchParams().get('volver') ?? '';
  const [estado, formAction, pending] = useActionState<EstadoLogin, FormData>(iniciarSesion, {});
  const [ayudaVisible, setAyudaVisible] = useState(false);

  // Errores visibles: se reinician con cada respuesta del servidor y se van
  // limpiando a medida que la persona corrige los campos.
  const [vista, setVista] = useState({ origen: estado, errores: estado.errores ?? {}, general: estado.error });
  if (vista.origen !== estado) {
    setVista({ origen: estado, errores: estado.errores ?? {}, general: estado.error });
  }

  // Validación inmediata en el cliente; el servidor vuelve a validar igual.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const datos = new FormData(e.currentTarget);
    const faltantes: Partial<Record<Campo, string>> = {};
    for (const campo of ['usuario', 'contrasena'] as const) {
      if (!String(datos.get(campo) ?? '').trim()) faltantes[campo] = MENSAJES[campo];
    }
    if (Object.keys(faltantes).length > 0) {
      e.preventDefault();
      setVista((v) => ({ ...v, errores: faltantes, general: undefined }));
    }
  };

  const limpiar = (campo: Campo) =>
    setVista((v) =>
      v.errores[campo] || v.general ? { ...v, errores: { ...v.errores, [campo]: undefined }, general: undefined } : v,
    );

  const errores = vista.errores;

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className={styles.form}>
      {vista.general && (
        <div className={styles.banner} role="alert">
          <Icon name="alertCircle" size={18} />
          <span>{vista.general}</span>
        </div>
      )}

      <input type="hidden" name="volver" value={volver} />

      <div className={styles.fields}>
        <Campo
          id="bo-usuario"
          name="usuario"
          label="Usuario"
          type="text"
          placeholder="tu.usuario"
          autoComplete="username"
          defaultValue={estado.usuario}
          error={errores.usuario}
          onInput={() => limpiar('usuario')}
        />
        <Campo
          id="bo-contrasena"
          name="contrasena"
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errores.contrasena}
          onInput={() => limpiar('contrasena')}
        />

        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? 'Ingresando…' : 'Ingresar'}
        </button>

        <button
          type="button"
          className={styles.forgot}
          onClick={() => setAyudaVisible((v) => !v)}
          aria-expanded={ayudaVisible}
        >
          ¿Olvidaste tu contraseña?
        </button>
        {ayudaVisible && (
          <p className={styles.help}>
            Pedile a un superadmin que la restablezca desde <b>Usuarios</b>. Vas a recibir una contraseña temporal por
            correo.
          </p>
        )}
      </div>
    </form>
  );
}

interface CampoProps {
  id: string;
  name: Campo;
  label: string;
  type: 'text' | 'password';
  placeholder: string;
  autoComplete: string;
  defaultValue?: string;
  error?: string;
  onInput: () => void;
}

function Campo({ id, name, label, error, ...input }: CampoProps) {
  const errorId = `${id}-error`;
  return (
    <div className={styles.field} data-error={!!error}>
      <label htmlFor={id}>{label}</label>
      <input id={id} name={name} aria-invalid={!!error} aria-describedby={error ? errorId : undefined} {...input} />
      {error && (
        <span id={errorId} className={styles.fieldError}>
          ⚠ {error}
        </span>
      )}
    </div>
  );
}
