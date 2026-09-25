import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Dropdown,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Skeleton,
  Spinner,
  Table,
  Tabs,
  ToastProvider,
  useToast,
} from '@/components/ui'
import { API_ERROR_MESSAGES } from '@/api/errors/messages'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { env } from '@/lib/env'

const COLOR_TOKENS = [
  'primary',
  'primary-deep',
  'primary-soft',
  'primary-tint',
  'accent',
  'accent-light',
  'accent-tint',
  'success',
  'danger',
  'danger-tint',
  'warning',
  'warning-tint',
  'info-tint',
  'surface',
  'bg',
  'text',
  'text-muted',
  'border',
] as const

interface DemoTrip {
  id: string
  ligne: string
  depart: string
  places: number
}

const DEMO_TRIPS: DemoTrip[] = [
  { id: 'v1', ligne: 'Abidjan → Yamoussoukro', depart: '07:30', places: 12 },
  { id: 'v2', ligne: 'Abidjan → Bouaké', depart: '09:00', places: 0 },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="page-section" aria-label={title}>
      <h2 className="page-section__title">{title}</h2>
      <div className="catalogue__row">{children}</div>
    </section>
  )
}

function ToastDemo() {
  const { showToast } = useToast()
  return (
    <>
      <Button variant="outline" onClick={() => showToast('Information enregistrée.')}>
        Toast info
      </Button>
      <Button variant="outline" onClick={() => showToast('Vente enregistrée.', 'success')}>
        Toast succès
      </Button>
      <Button variant="outline" onClick={() => showToast('Échec de l’impression.', 'danger')}>
        Toast erreur
      </Button>
    </>
  )
}

/**
 * Catalogue du design system web (roadmap Sprint 1) : couleurs, composants
 * et états. Réservé aux environnements dev et recette (route absente en prod).
 */
export default function CataloguePage() {
  useDocumentTitle('MON CAR — Catalogue de composants')
  const [tab, setTab] = useState('voyages')
  const [modalOpen, setModalOpen] = useState(false)
  const errorCodes = Object.keys(API_ERROR_MESSAGES)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <ToastProvider>
      <main className="catalogue">
        <Breadcrumb items={[{ label: 'Accueil', to: '/' }, { label: 'Catalogue de composants' }]} />
        <h1>Catalogue de composants</h1>
        <p className="catalogue__meta">
          {env.appName} · environnement {env.appEnvLabel} · composants <code>src/components/ui</code>
        </p>

        <Section title="Couleurs">
          {COLOR_TOKENS.map((token) => (
            <figure key={token} className="catalogue__swatch">
              <span
                className="catalogue__swatch-color"
                style={{ background: `var(--mc-color-${token})` }}
              />
              <figcaption>{token}</figcaption>
            </figure>
          ))}
        </Section>

        <Section title="Boutons">
          <Button variant="primary">Primaire</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="outline">Contour</Button>
          <Button variant="ghost">Discret</Button>
          <Button variant="danger">Danger</Button>
          <Button size="sm">Petit</Button>
          <Button isLoading>Chargement</Button>
          <Button disabled>Désactivé</Button>
        </Section>

        <Section title="Badges et avatars">
          <Badge>Neutre</Badge>
          <Badge variant="primary">Primaire</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="success">Payé</Badge>
          <Badge variant="warning">En attente</Badge>
          <Badge variant="danger">Annulé</Badge>
          <Avatar name="Kouassi Aya" size="sm" />
          <Avatar name="Marcel Alle" />
          <Avatar name="Richard Yavo" size="lg" />
        </Section>

        <Section title="Champs de formulaire">
          <Input label="Numéro de billet" placeholder="MC-2026-000125" />
          <Input label="Téléphone" defaultValue="07 00" error="Numéro incomplet." />
          <Input label="Montant encaissé" hint="En francs CFA." inputMode="numeric" />
        </Section>

        <Section title="Alertes">
          <Alert title="Information">Le manifeste est recalculé automatiquement.</Alert>
          <Alert variant="success">Clôture de caisse enregistrée.</Alert>
          <Alert variant="warning">Écart de caisse de 2 000 F à justifier.</Alert>
          <Alert variant="danger">Paiement échoué — la réservation n’est pas confirmée.</Alert>
        </Section>

        <Section title="Carte, onglets, menu, fenêtre">
          <Card
            title="Voyage du jour"
            headerAction={
              <Dropdown
                trigger="Actions"
                align="right"
                items={[{ label: 'Imprimer le manifeste', onSelect: () => setModalOpen(true) }]}
              />
            }
          >
            <Tabs
              ariaLabel="Rubriques"
              tabs={[
                { id: 'voyages', label: 'Voyages' },
                { id: 'colis', label: 'Colis' },
              ]}
              active={tab}
              onChange={setTab}
            >
              <p>Onglet actif : {tab}</p>
            </Tabs>
          </Card>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Ouvrir la fenêtre
          </Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Confirmer l’impression"
            footer={<Button onClick={() => setModalOpen(false)}>Fermer</Button>}
          >
            <p>Exemple de fenêtre modale.</p>
          </Modal>
        </Section>

        <Section title="Tableau">
          <Table<DemoTrip>
            caption="Départs du jour (démonstration)"
            rowKey={(row) => row.id}
            rows={DEMO_TRIPS}
            columns={[
              { key: 'ligne', header: 'Ligne' },
              { key: 'depart', header: 'Départ' },
              {
                key: 'places',
                header: 'Places libres',
                align: 'right',
                render: (row) =>
                  row.places === 0 ? <Badge variant="danger">Complet</Badge> : row.places,
              },
            ]}
          />
        </Section>

        <Section title="Chargement">
          <Spinner label="Chargement des voyages…" />
          <div className="catalogue__skeletons">
            <Skeleton height="1.25rem" />
            <Skeleton width="60%" />
          </div>
        </Section>

        <Section title="États vide et erreur">
          <EmptyState
            title="Aucun voyage programmé"
            message="Créez un voyage depuis le planning."
            action={<Button size="sm">Programmer un voyage</Button>}
          />
          <ErrorState
            message={API_ERROR_MESSAGES[500] ?? ''}
            incidentId="REQ-2026-000125"
            onRetry={() => undefined}
          />
        </Section>

        <Section title="Notifications (toasts)">
          <ToastDemo />
        </Section>

        <section className="page-section" aria-label="Messages d’erreur API">
          <h2 className="page-section__title">Messages d’erreur API</h2>
          <dl className="catalogue__errors">
            {errorCodes.map((code) => (
              <div key={code}>
                <dt>
                  <Badge variant={code >= 500 || code < 0 ? 'danger' : 'warning'}>
                    {code < 0 ? 'Réseau' : code}
                  </Badge>
                </dt>
                <dd>{API_ERROR_MESSAGES[code]}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p>
          <Link to="/">← Retour à l’accueil</Link>
        </p>
      </main>
    </ToastProvider>
  )
}
