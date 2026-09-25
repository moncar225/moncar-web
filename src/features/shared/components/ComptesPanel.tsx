import { useMemo, useState } from 'react'
import { Alert, Badge, Button, Input, Modal, Select, Table, useToast } from '@/components/ui'
import { useAuth } from '@/app/providers/AuthProvider'
import { POSTES } from '@/domain/permissions'
import type { Compte, Poste } from '@/domain/types'
import { dateHeure } from '@/lib/format'
import {
  useCreerCompte,
  useGares,
  useModifierCompte,
  useReinitialiserCompte,
  useUtilisateurs,
} from '@/services/referentiels'
import { ApiErrorAlert, QueryView } from './Page'

interface ComptesPanelProps {
  /** `admin` : comptes plateforme PROSOFT ; `compagnie` : personnel de la compagnie. */
  espace: 'admin' | 'compagnie'
}

/**
 * Comptes agents (AUTH-002/003) : création avec mot de passe temporaire
 * (affiché une seule fois, changement imposé à la 1re connexion),
 * suspension, réinitialisation. Chaque action est journalisée côté serveur.
 */
export function ComptesPanel({ espace }: ComptesPanelProps) {
  const { session } = useAuth()
  const { showToast } = useToast()
  const comptes = useUtilisateurs()
  const gares = useGares()
  const modifier = useModifierCompte()
  const reinitialiser = useReinitialiserCompte()
  const [creation, setCreation] = useState(false)
  const [secret, setSecret] = useState<{ nom: string; motDePasse: string } | null>(null)
  const [filtre, setFiltre] = useState('')

  const postesDisponibles = useMemo(
    () =>
      (Object.keys(POSTES) as Poste[]).filter((p) =>
        espace === 'admin' ? POSTES[p].espace === 'admin' : POSTES[p].espace === 'compagnie' || POSTES[p].espace === 'terrain',
      ),
    [espace],
  )
  const nomGare = (id?: string) => (id === undefined ? '—' : (gares.data?.find((g) => g.id === id)?.nom ?? '—'))

  return (
    <>
      <div className="toolbar">
        <Input label="Rechercher" placeholder="Nom, téléphone, poste…" value={filtre} onChange={(e) => setFiltre(e.target.value)} />
        <Button onClick={() => setCreation(true)}>Créer un compte</Button>
      </div>
      {secret !== null && (
        <Alert variant="warning" title={`Mot de passe temporaire de ${secret.nom}`}>
          <span className="secret">{secret.motDePasse}</span> — à transmettre à l’agent. Il ne sera plus affiché et devra
          être changé à la première connexion.{' '}
          <Button size="sm" variant="ghost" onClick={() => setSecret(null)}>
            J’ai transmis le mot de passe
          </Button>
        </Alert>
      )}
      <QueryView query={comptes} loading="Chargement des comptes…">
        {(data) => {
          const q = filtre.trim().toLowerCase()
          const lignes = data
            .filter((c) => (espace === 'admin' ? c.espace === 'admin' : c.espace === 'compagnie'))
            .filter((c) => q === '' || `${c.prenom} ${c.nom} ${c.telephone} ${POSTES[c.poste].libelle}`.toLowerCase().includes(q))
          return (
            <Table<Compte>
              caption={espace === 'admin' ? 'Comptes PROSOFT' : 'Personnel de la compagnie'}
              rowKey={(c) => c.id}
              rows={lignes}
              columns={[
                {
                  key: 'nom',
                  header: 'Agent',
                  render: (c) => (
                    <>
                      <strong>{c.prenom} {c.nom}</strong>
                      <br />
                      <span className="muted">{c.telephone}</span>
                    </>
                  ),
                },
                {
                  key: 'poste',
                  header: 'Poste',
                  render: (c) => (
                    <>
                      {POSTES[c.poste].libelle}
                      {POSTES[c.poste].espace === 'terrain' && <> <Badge>App PRO</Badge></>}
                      {c.a2f && <> <Badge variant="primary">A2F</Badge></>}
                    </>
                  ),
                },
                ...(espace === 'compagnie' ? [{ key: 'gare', header: 'Gare', render: (c: Compte) => nomGare(c.gareId) }] : []),
                {
                  key: 'connexion',
                  header: 'Dernière connexion',
                  render: (c) => (c.derniereConnexion === undefined ? <span className="muted">Jamais</span> : dateHeure(c.derniereConnexion)),
                },
                {
                  key: 'statut',
                  header: 'Statut',
                  render: (c) => (
                    <>
                      <Badge variant={c.statut === 'actif' ? 'success' : 'danger'}>{c.statut === 'actif' ? 'Actif' : 'Suspendu'}</Badge>
                      {c.motDePasseTemporaire && <> <Badge variant="warning">Mot de passe temporaire</Badge></>}
                    </>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (c) =>
                    c.id === session?.id ? (
                      <span className="muted">Votre compte</span>
                    ) : (
                      <div className="row">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            modifier.mutate(
                              { id: c.id, statut: c.statut === 'actif' ? 'suspendu' : 'actif' },
                              { onSuccess: () => showToast(c.statut === 'actif' ? 'Compte suspendu.' : 'Compte réactivé.', 'success') },
                            )
                          }
                        >
                          {c.statut === 'actif' ? 'Suspendre' : 'Réactiver'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            reinitialiser.mutate(c.id, {
                              onSuccess: (r) => setSecret({ nom: `${c.prenom} ${c.nom}`, motDePasse: r.motDePasseTemporaire }),
                            })
                          }
                        >
                          Réinitialiser le mot de passe
                        </Button>
                      </div>
                    ),
                },
              ]}
            />
          )
        }}
      </QueryView>
      <ApiErrorAlert error={modifier.error ?? reinitialiser.error} />
      {creation && (
        <CreationCompteModal
          espace={espace}
          postes={postesDisponibles}
          onClose={() => setCreation(false)}
          onCree={(nom, motDePasse) => {
            setCreation(false)
            setSecret({ nom, motDePasse })
          }}
        />
      )}
    </>
  )
}

function CreationCompteModal({
  espace,
  postes,
  onClose,
  onCree,
}: {
  espace: 'admin' | 'compagnie'
  postes: Poste[]
  onClose: () => void
  onCree: (nom: string, motDePasse: string) => void
}) {
  const creer = useCreerCompte()
  const gares = useGares()
  const [f, setF] = useState({ prenom: '', nom: '', telephone: '', email: '', poste: postes[0] ?? '', gareId: '' })
  const maj = (cle: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [cle]: e.target.value })
  const posteGare = f.poste === 'chef_gare' || f.poste === 'caisse' || f.poste === 'colis' || f.poste === 'controleur'
  const complet = f.prenom !== '' && f.nom !== '' && f.telephone !== '' && (!posteGare || f.gareId !== '')

  return (
    <Modal
      open
      onClose={onClose}
      title="Nouveau compte agent"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            disabled={!complet}
            isLoading={creer.isPending}
            onClick={() =>
              creer.mutate(
                { ...f, poste: f.poste as Poste, gareId: f.gareId === '' ? undefined : f.gareId },
                { onSuccess: (r) => onCree(`${f.prenom} ${f.nom}`, r.motDePasseTemporaire) },
              )
            }
          >
            Créer le compte
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Input label="Prénom" value={f.prenom} onChange={maj('prenom')} />
        <Input label="Nom" value={f.nom} onChange={maj('nom')} />
        <Input label="Téléphone" inputMode="tel" value={f.telephone} onChange={maj('telephone')} hint="Identifiant de connexion" />
        <Input label="E-mail (facultatif)" type="email" value={f.email} onChange={maj('email')} />
        <Select label="Poste" value={f.poste} onChange={maj('poste')}>
          {postes.map((p) => (
            <option key={p} value={p}>
              {POSTES[p].libelle}
              {POSTES[p].espace === 'terrain' ? ' (app PRO)' : ''}
            </option>
          ))}
        </Select>
        {espace === 'compagnie' && (
          <Select label={posteGare ? 'Gare de rattachement' : 'Gare (facultatif)'} value={f.gareId} onChange={maj('gareId')}>
            <option value="">—</option>
            {gares.data?.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </Select>
        )}
      </div>
      <ApiErrorAlert error={creer.error} />
    </Modal>
  )
}
