interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  /** Libellé annoncé aux lecteurs d'écran. */
  label?: string
}

/** Indicateur de chargement du Design System MON CAR. */
export function Spinner({ size = 'md', label }: SpinnerProps) {
  return (
    <span
      className={`mc-spinner${size === 'md' ? '' : ` mc-spinner--${size}`}`}
      role="status"
      aria-label={label ?? 'Chargement en cours'}
      aria-hidden={label === undefined ? true : undefined}
    />
  )
}
