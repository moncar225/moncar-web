import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * Modale du Design System MON CAR, basée sur l'élément natif <dialog>
 * (focus piégé et fermeture Échap gérés par le navigateur).
 */
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return createPortal(
    <dialog
      ref={dialogRef}
      className="mc-modal"
      aria-label={title}
      onCancel={onClose}
      onClose={onClose}
    >
      <header className="mc-modal__header">
        <h2 className="mc-modal__title">{title}</h2>
        <button type="button" className="mc-modal__close" aria-label="Fermer la fenêtre" onClick={onClose}>
          ×
        </button>
      </header>
      <div className="mc-modal__body">{children}</div>
      {footer !== undefined && <footer className="mc-modal__footer">{footer}</footer>}
    </dialog>,
    document.body,
  )
}
