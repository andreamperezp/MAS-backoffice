import styles from './AppShell.module.css';

/** Esqueleto estático del shell mientras se valida la sesión (parte del static shell). */
export function ShellSkeleton() {
  return (
    <div className={styles.shell} aria-busy="true">
      <aside className={styles.sidebar} />
      <header className={styles.topbar} />
      <main className={styles.main}>
        <span className="sr-only">Cargando…</span>
      </main>
    </div>
  );
}
