import { initialsOf } from './initials'

interface AvatarProps {
  /** Nom complet dont on tire les initiales (utilisé si pas d'image). */
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
}

/** Avatar MON CAR : image ou initiales sur fond bleu teinté. */
export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  return (
    <span
      className={`mc-avatar mc-avatar--${size}`}
      role="img"
      aria-label={src === undefined ? `Avatar de ${name}` : `Photo de ${name}`}
    >
      {src !== undefined ? <img src={src} alt="" /> : initialsOf(name)}
    </span>
  )
}
