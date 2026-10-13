'use client';

import { useId, type ReactNode } from 'react';
import { Icon } from './Icon';
import styles from './Filters.module.css';

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbar}>{children}</div>;
}

export function ToolbarDivider() {
  return <div className={styles.divider} aria-hidden="true" />;
}

export function ToolbarPush({ children }: { children: ReactNode }) {
  return <div className={styles.push}>{children}</div>;
}

export interface Opcion<T extends string> {
  valor: T;
  label: string;
}

interface PillGroupProps<T extends string> {
  /** Nombre accesible del grupo (ej. "Filtrar por estado"). */
  label: string;
  opciones: readonly Opcion<T>[];
  valor: T;
  onChange: (valor: T) => void;
}

/** Grupo de filtros excluyentes con apariencia de pills. */
export function PillGroup<T extends string>({ label, opciones, valor, onChange }: PillGroupProps<T>) {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          className={styles.pill}
          aria-pressed={o.valor === valor}
          onClick={() => onChange(o.valor)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function FilterRow({ children }: { children: ReactNode }) {
  return <div className={styles.group}>{children}</div>;
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <label className={styles.search}>
      <Icon name="search" size={15} />
      <span className="sr-only">{placeholder}</span>
      <input type="search" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}

export function DateField({ label, value, onChange, min, max }: DateFieldProps) {
  const id = useId();
  return (
    <div className={styles.dateField}>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="date" value={value} min={min} max={max} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function LinkButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className={styles.linkButton} onClick={onClick}>
      {children}
    </button>
  );
}
