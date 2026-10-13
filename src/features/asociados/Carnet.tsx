import Image from 'next/image';
import { useMemo } from 'react';
import { formatDni } from '@/domain/format';
import type { Asociado } from '@/domain/types';
import { contenidoQr, matrizQr } from './carnet-utils';
import styles from './Carnet.module.css';

/** Credencial digital del asociado (misma composición que el diseño). */
export function Carnet({ asociado: a }: { asociado: Asociado }) {
  const matriz = useMemo(() => matrizQr(contenidoQr(a)), [a]);
  const n = matriz.length;

  return (
    <div className={styles.card} aria-label={`Carnet digital de ${a.nombre} ${a.apellido}`} role="img">
      <div className={`${styles.decor} ${styles.decorYellow}`} />
      <div className={`${styles.decor} ${styles.decorTeal}`} />
      <div className={styles.content}>
        <div className={styles.top}>
          <Image src="/brand/logo-gris.svg" alt="MAS" width={66} height={32} className={styles.logo} />
          <span className={styles.badge}>Asociado</span>
        </div>
        <div className={styles.body}>
          <Dato label="Nombre y apellido" valor={`${a.nombre} ${a.apellido}`} />
          <Dato label="DNI" valor={formatDni(a.dni)} />
          <Dato label="N.° de afiliado" valor={a.numeroAfiliado} />
        </div>
        <div className={styles.footer}>
          <svg viewBox={`0 0 ${n} ${n}`} width={36} height={36} shapeRendering="crispEdges" className={styles.qr}>
            <rect width={n} height={n} fill="#fff" />
            {matriz.flatMap((fila, y) =>
              fila.map((on, x) =>
                on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#3d3d3b" /> : null,
              ),
            )}
          </svg>
          <div className={styles.divider} />
          <span className={styles.footerText}>Credencial digital</span>
        </div>
      </div>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <span className={styles.label}>{label}</span>
      <br />
      <span className={styles.value}>{valor}</span>
    </div>
  );
}
