import { useState } from 'react'
import { Input, Table } from '@/components/ui'
import { POSTES } from '@/domain/permissions'
import type { EntreeAudit } from '@/domain/types'
import { dateHeure } from '@/lib/format'
import { useAudit } from '@/services/plateforme'
import { QueryView } from './Page'

function resume(valeur: unknown): string {
  if (valeur === undefined || valeur === null) return '—'
  const texte = JSON.stringify(valeur)
  return texte.length > 120 ? `${texte.slice(0, 117)}…` : texte
}

/** Journal d'audit en lecture seule, filtré selon la permission (AUD-001). */
export function AuditPanel() {
  const [q, setQ] = useState('')
  const [recherche, setRecherche] = useState('')
  const audit = useAudit(recherche)
  return (
    <>
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault()
          setRecherche(q)
        }}
      >
        <Input label="Rechercher (auteur, action, objet)" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      <QueryView query={audit} loading="Lecture du journal…" isEmpty={(d) => d.length === 0}>
        {(data) => (
          <Table<EntreeAudit>
            caption="Journal d’audit"
            rowKey={(a) => a.id}
            rows={data}
            columns={[
              { key: 'date', header: 'Date', render: (a) => <span className="nowrap">{dateHeure(a.date)}</span> },
              { key: 'auteur', header: 'Auteur', render: (a) => <>{a.auteur}<br /><span className="muted">{POSTES[a.poste].libelle}</span></> },
              { key: 'action', header: 'Action', render: (a) => <>{a.action}<br /><span className="muted">{a.entite} · {a.entiteId}</span></> },
              { key: 'avant', header: 'Avant', render: (a) => <code>{resume(a.avant)}</code> },
              { key: 'apres', header: 'Après', render: (a) => <code>{resume(a.apres)}</code> },
            ]}
          />
        )}
      </QueryView>
    </>
  )
}
