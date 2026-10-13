'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ROL_INICIALES, ROL_LABEL } from '@/domain/labels';
import { inicioPorRol, puedeVer, seccionDeRuta } from '@/domain/permisos';
import type { SessionUser } from '@/domain/types';
import { salir } from '@/features/auth/actions';
import { SessionProvider } from '@/features/auth/session-context';
import { usePendientesCount } from '@/features/solicitudes/queries';
import { NAV, type ItemNav } from './nav';
import styles from './AppShell.module.css';

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const seccionActual = seccionDeRuta(pathname);

  // El proxy decide con el rol del JWT; si el rol cambió desde el login, corregimos acá.
  const sinPermiso = seccionActual !== null && !puedeVer(seccionActual, user.rol);
  useEffect(() => {
    if (sinPermiso) router.replace(inicioPorRol(user.rol));
  }, [sinPermiso, router, user.rol]);

  const items = NAV.filter((i) => puedeVer(i.seccion, user.rol));
  const comunes = items.filter((i) => !i.soloSuperadmin);
  const superadmin = items.filter((i) => i.soloSuperadmin);
  const pendientes = usePendientesCount();
  const esActual = (i: ItemNav) => i.seccion === seccionActual;

  return (
    <SessionProvider user={user}>
      <div className={styles.shell}>
        <aside className={styles.sidebar} aria-label="Menú principal">
          <div className={styles.sidebarTop}>
            <div className={styles.logo}>
              <Image src="/brand/isotipo.svg" alt="MAS" width={40} height={40} priority />
            </div>
            <nav className={styles.nav}>
              {comunes.map((i) => (
                <NavLink
                  key={i.href}
                  item={i}
                  actual={esActual(i)}
                  count={i.seccion === 'solicitudes' ? pendientes : undefined}
                />
              ))}
              {superadmin.length > 0 && (
                <>
                  <div className={styles.navDivider} />
                  <div className={styles.navLabel}>Superadmin</div>
                  {superadmin.map((i) => (
                    <NavLink key={i.href} item={i} actual={esActual(i)} />
                  ))}
                </>
              )}
            </nav>
          </div>
          <div className={styles.sidebarBottom}>
            <div className={styles.sidebarRule} />
            <div className={styles.user}>
              <div className={styles.avatar} aria-hidden="true">
                {ROL_INICIALES[user.rol]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className={styles.userName}>{ROL_LABEL[user.rol]}</div>
                <div className={styles.userEmail} title={user.email}>
                  {user.email}
                </div>
              </div>
            </div>
            <form action={salir}>
              <button type="submit" className={`${styles.navItem} ${styles.logout}`}>
                <Icon name="logout" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </aside>

        <header className={styles.topbar}>
          <Image src="/brand/logo.svg" alt="MAS" width={62} height={30} priority />
          <UserMenu user={user} />
        </header>

        <main className={styles.main}>{sinPermiso ? null : children}</main>

        <nav className={styles.bottomNav} aria-label="Menú principal">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={styles.bottomItem}
              aria-current={esActual(i) ? 'page' : undefined}
            >
              <Icon name={i.icon} size={18} />
              {i.label}
              {i.seccion === 'solicitudes' && !!pendientes && (
                <span className={styles.bottomCount} aria-label={`${pendientes} pendientes`}>
                  {pendientes}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </SessionProvider>
  );
}

function NavLink({ item, actual, count }: { item: ItemNav; actual: boolean; count?: number }) {
  return (
    <Link href={item.href} className={styles.navItem} aria-current={actual ? 'page' : undefined}>
      <Icon name={item.icon} />
      {item.label}
      {!!count && (
        <span className={styles.count} aria-label={`${count} pendientes`}>
          {count}
        </span>
      )}
    </Link>
  );
}

function UserMenu({ user }: { user: SessionUser }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('keydown', cerrar);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      document.removeEventListener('keydown', cerrar);
    };
  }, [abierto]);

  return (
    <div className={styles.menuWrap} ref={ref}>
      <button
        type="button"
        className={styles.avatar}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de usuario"
        onClick={() => setAbierto((v) => !v)}
      >
        {ROL_INICIALES[user.rol]}
      </button>
      {abierto && (
        <div className={styles.menu} role="menu">
          <div>
            <div className={styles.menuName}>{ROL_LABEL[user.rol]}</div>
            <div className={styles.menuEmail}>{user.email}</div>
          </div>
          <form action={salir}>
            <button type="submit" className={styles.menuLogout} role="menuitem">
              <Icon name="logout" size={15} />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
