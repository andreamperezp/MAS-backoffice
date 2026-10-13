import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { Icon } from '@/components/ui/Icon';
import { LoginForm } from '@/features/auth/LoginForm';
import styles from './login.module.css';

export const metadata: Metadata = { title: 'Iniciar sesión' };

const BENEFICIOS = [
  'Revisá y aprobá las solicitudes que llegan desde el Portal.',
  'Consultá el padrón de asociados activos y su estado.',
  'Exportá los datos en el formato que piden el Ministerio y la Caja.',
];

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <section className={styles.brand} aria-label="Mutual Argentina Solidaria">
        <div className={`${styles.blob} ${styles.blobTeal}`} />
        <div className={`${styles.blob} ${styles.blobDot}`} />
        <div className={`${styles.blob} ${styles.blobGlow}`} />

        <Image
          src="/brand/logo-completo.svg"
          alt="MAS - Mutual Argentina Solidaria"
          width={176}
          height={87}
          className={styles.logo}
          priority
        />

        <div className={styles.pitch}>
          <h1 className={styles.headline}>
            <span className={styles.desktopOnly}>Gestioná las afiliaciones a MAS desde un solo lugar.</span>
            <span className={styles.mobileOnly}>Gestioná las afiliaciones a MAS desde tu celular.</span>
          </h1>
          <ul className={styles.beneficios}>
            {BENEFICIOS.map((b) => (
              <li key={b}>
                <span className={styles.check}>
                  <Icon name="check" size={18} />
                </span>
                <p>{b}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className={styles.copyright}>© Mutual Argentina Solidaria | 2026</p>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formBox}>
          <div className={styles.intro}>
            <span className={styles.eyebrow}>Panel de administración</span>
            <h2 className={styles.title}>Iniciar sesión</h2>
            <p className={styles.description}>
              Ingresá con tus credenciales para gestionar las solicitudes de afiliación.
            </p>
          </div>

          {/* useSearchParams (destino post-login) es dato de request: va detrás de Suspense. */}
          <Suspense>
            <LoginForm />
          </Suspense>

          <p className={styles.footnote}>Acceso exclusivo para administradores de MAS.</p>
        </div>
      </section>
    </div>
  );
}
