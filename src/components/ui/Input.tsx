import { useId, forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Message d'erreur en français, affiché sous le champ. */
  error?: string
  /** Texte d'aide sous le champ quand il n'y a pas d'erreur. */
  hint?: ReactNode
}

/** Champ texte du Design System MON CAR (label + input + erreur/aide). */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  return (
    <div className={['mc-input', className].filter(Boolean).join(' ')}>
      <label className="mc-input__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className="mc-input__field"
        aria-invalid={error !== undefined || undefined}
        aria-describedby={
          [error !== undefined ? errorId : null, hint !== undefined ? hintId : null]
            .filter(Boolean)
            .join(' ') || undefined
        }
        {...rest}
      />
      {error !== undefined ? (
        <p className="mc-input__error" id={errorId} role="alert">
          {error}
        </p>
      ) : hint !== undefined ? (
        <p className="mc-input__error" id={hintId} style={{ color: 'var(--mc-color-text-muted)' }}>
          {hint}
        </p>
      ) : null}
    </div>
  )
})
