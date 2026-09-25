import { forwardRef, useId } from 'react'
import type { ReactNode, SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: ReactNode
  children: ReactNode
}

/** Liste déroulante du Design System MON CAR (même anatomie que `Input`). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, id, children, ...rest },
  ref,
) {
  const autoId = useId()
  const selectId = id ?? autoId
  const errorId = `${selectId}-error`
  const hintId = `${selectId}-hint`
  return (
    <div className={['mc-input', className].filter(Boolean).join(' ')}>
      <label className="mc-input__label" htmlFor={selectId}>
        {label}
      </label>
      <select
        ref={ref}
        id={selectId}
        className="mc-input__field"
        aria-invalid={error !== undefined || undefined}
        aria-describedby={
          [error !== undefined ? errorId : null, hint !== undefined ? hintId : null].filter(Boolean).join(' ') ||
          undefined
        }
        {...rest}
      >
        {children}
      </select>
      {error !== undefined ? (
        <p className="mc-input__error" id={errorId} role="alert">
          {error}
        </p>
      ) : hint !== undefined ? (
        <p className="mc-input__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  )
})
