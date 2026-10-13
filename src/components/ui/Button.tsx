import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Button.module.css';

type Variant = 'primary' | 'dark' | 'ghost' | 'approve' | 'danger' | 'warning' | 'neutral' | 'outline' | 'whatsapp';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: IconName;
  iconSize?: number;
  /** Ocupa todo el ancho disponible. */
  block?: boolean;
  /** `flex: 1` dentro de un grupo de botones. */
  grow?: boolean;
  /** Estado "hecho" (ej. "✓ Enviado"). */
  done?: boolean;
}

export function Button({
  variant = 'neutral',
  size = 'sm',
  icon,
  iconSize = 14,
  block,
  grow,
  done,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const clases = [
    styles.btn,
    styles[variant],
    size !== 'sm' && styles[size],
    block && styles.block,
    grow && styles.grow,
    done && styles.done,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={clases} {...rest}>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
    </button>
  );
}
