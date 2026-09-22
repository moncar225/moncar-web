interface SkeletonProps {
  width?: string
  height?: string
}

/** Squelette de chargement du Design System MON CAR (shimmer léger). */
export function Skeleton({ width = '100%', height = '1rem' }: SkeletonProps) {
  return <span className="mc-skeleton" style={{ width, height }} aria-hidden="true" />
}
