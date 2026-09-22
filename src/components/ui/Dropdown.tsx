import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export interface DropdownItem {
  label: string
  onSelect: () => void
}

interface DropdownProps {
  /** Libellé du bouton déclencheur. */
  trigger: ReactNode
  items: DropdownItem[]
  /** Aligne le menu à droite (utile en fin de header). */
  align?: 'left' | 'right'
}

/**
 * Menu déroulant du Design System MON CAR.
 * Accessible au clavier : Entrée/Espace ouvre, Échap ferme, clic extérieur ferme.
 */
export function Dropdown({ trigger, items, align = 'left' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onClick = (event: MouseEvent) => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div className="mc-dropdown" ref={rootRef}>
      <button
        type="button"
        className="mc-btn mc-btn--outline"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger}
      </button>
      {open && (
        <ul id={menuId} role="menu" className={align === 'right' ? 'mc-dropdown__menu mc-dropdown__menu--right' : 'mc-dropdown__menu'}>
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                className="mc-dropdown__item"
                onClick={() => {
                  item.onSelect()
                  setOpen(false)
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
