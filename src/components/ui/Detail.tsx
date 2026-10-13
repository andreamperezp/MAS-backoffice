import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './Detail.module.css';

export { styles as detailStyles };

export function PageHeader({
  titulo,
  subtitulo,
  accion,
}: {
  titulo: string;
  subtitulo: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageTitle}>{titulo}</h1>
        <p className={styles.pageSubtitle} aria-live="polite">
          {subtitulo}
        </p>
      </div>
      {accion}
    </header>
  );
}

export function Section({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className={styles.sectionTitle}>{titulo}</h3>
      {children}
    </section>
  );
}

/** Grilla de 2 columnas: valor destacado arriba, etiqueta abajo (como el diseño). */
export function InfoGrid({ items }: { items: Array<[label: string, valor: ReactNode]> }) {
  return (
    <dl className={styles.infoGrid}>
      {items.map(([label, valor]) => (
        <div key={label} className={styles.infoItem}>
          <dt className={styles.infoLabel}>{label}</dt>
          <dd className={styles.infoValue}>{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

interface RadioOptionProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  children: ReactNode;
}

/** Radio nativo (accesible) con la apariencia de tarjeta del diseño. */
export function RadioOption({ children, ...input }: RadioOptionProps) {
  return (
    <label className={styles.option}>
      <input type="radio" className="sr-only" {...input} />
      <span className={styles.radioDot} aria-hidden="true" />
      {children}
    </label>
  );
}

export function Stack({ children, gap }: { children: ReactNode; gap?: number }) {
  return (
    <div className={styles.stack} style={gap ? { gap } : undefined}>
      {children}
    </div>
  );
}
