import { useId, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
}

interface TabsProps {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  /** Contenu du panneau actif. */
  children: ReactNode
  ariaLabel: string
}

/** Onglets du Design System MON CAR (navigation clavier ← →). */
export function Tabs({ tabs, active, onChange, children, ariaLabel }: TabsProps) {
  const baseId = useId()
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = tabs.findIndex((tab) => tab.id === active)
    if (index === -1) return
    let next: number | null = null
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    if (next !== null) {
      event.preventDefault()
      const nextTab = tabs[next]
      if (nextTab !== undefined) {
        onChange(nextTab.id)
        tabRefs.current.get(nextTab.id)?.focus()
      }
    }
  }

  return (
    <div className="mc-tabs">
      <div role="tablist" aria-label={ariaLabel} className="mc-tabs__list">
        {tabs.map((tab) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              ref={(node) => {
                if (node === null) {
                  tabRefs.current.delete(tab.id)
                } else {
                  tabRefs.current.set(tab.id, node)
                }
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className="mc-tabs__tab"
              onKeyDown={onKeyDown}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-${active}`}
        aria-labelledby={`${baseId}-tab-${active}`}
      >
        {children}
      </div>
    </div>
  )
}
