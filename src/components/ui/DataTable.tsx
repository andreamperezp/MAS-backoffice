'use client';

import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { Icon } from './Icon';
import styles from './DataTable.module.css';

export interface Columna<T> {
  titulo: string;
  celda: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  items: T[] | undefined;
  columnas: Columna<T>[];
  /** `grid-template-columns` de desktop (sin contar el chevron final). */
  plantilla: string;
  /** Contenido de cada tarjeta en mobile. */
  tarjeta: (item: T) => ReactNode;
  getId: (item: T) => string;
  /** Texto accesible de la fila (ej. "Ver detalle de María González"). */
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
  cargando: boolean;
  error?: string | null;
  vacio: string;
}

const FILAS_SKELETON = 5;

/**
 * Listado que se muestra como tabla en desktop y como tarjetas en mobile.
 * Cada fila es clickeable/navegable por teclado y abre el detalle.
 */
export function DataTable<T>(props: DataTableProps<T>) {
  const { items, columnas, plantilla, tarjeta, getId, getLabel, onSelect, cargando, error, vacio } = props;
  const cols = { '--cols': `${plantilla} .5fr` } as CSSProperties;

  const onKey = (e: KeyboardEvent, item: T) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(item);
    }
  };

  const estadoVacio = error ?? (items && items.length === 0 ? vacio : null);

  return (
    <>
      <div className={styles.table} role="table" style={cols} aria-busy={cargando}>
        <div className={`${styles.row} ${styles.headRow}`} role="row">
          {columnas.map((c) => (
            <span key={c.titulo} className={styles.th} role="columnheader">
              {c.titulo}
            </span>
          ))}
          <span role="columnheader" aria-label="Acciones" />
        </div>

        {cargando && !items
          ? Array.from({ length: FILAS_SKELETON }, (_, i) => (
              <div key={i} className={styles.row} aria-hidden="true">
                {columnas.map((c) => (
                  <div key={c.titulo} className={styles.skeleton} style={{ width: `${55 + ((i * 17) % 35)}%` }} />
                ))}
              </div>
            ))
          : items?.map((item) => (
              <div
                key={getId(item)}
                className={`${styles.row} ${styles.bodyRow}`}
                role="row"
                tabIndex={0}
                aria-label={getLabel(item)}
                onClick={() => onSelect(item)}
                onKeyDown={(e) => onKey(e, item)}
              >
                {columnas.map((c) => (
                  <div key={c.titulo} className={styles.cell} role="cell">
                    {c.celda(item)}
                  </div>
                ))}
                <div className={styles.chevron} role="cell">
                  <Icon name="chevronRight" size={16} />
                </div>
              </div>
            ))}

        {estadoVacio && <p className={error ? styles.error : styles.empty}>{estadoVacio}</p>}
      </div>

      <ul className={styles.cards} aria-busy={cargando}>
        {items?.map((item) => (
          <li key={getId(item)}>
            <div
              className={styles.card}
              role="button"
              tabIndex={0}
              aria-label={getLabel(item)}
              onClick={() => onSelect(item)}
              onKeyDown={(e) => onKey(e, item)}
            >
              {tarjeta(item)}
            </div>
          </li>
        ))}
        {cargando && !items && <li className={styles.cardEmpty}>Cargando…</li>}
        {estadoVacio && <li className={styles.cardEmpty}>{estadoVacio}</li>}
      </ul>
    </>
  );
}
