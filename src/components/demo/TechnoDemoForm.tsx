import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

/**
 * ⚠️ DÉMONSTRATION TECHNIQUE — pas une fonctionnalité MON CAR.
 * Vérifie que React Hook Form + Zod + TypeScript travaillent ensemble.
 * Aucune donnée n'est envoyée : tout reste local au composant.
 */
const demoFormSchema = z.object({
  email: z
    .string()
    .min(1, 'L\u2019adresse e-mail est obligatoire.')
    .pipe(z.email('Adresse e-mail invalide.')),
  message: z
    .string()
    .min(10, 'Le message doit contenir au moins 10 caractères.')
    .max(500, 'Le message ne peut pas dépasser 500 caractères.'),
})

interface DemoFormValues {
  email: string
  message: string
}

export function TechnoDemoForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DemoFormValues>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: { email: '', message: '' },
  })

  const onSubmit = (values: DemoFormValues) => {
    setSubmittedEmail(values.email)
    reset()
  }

  return (
    <section className="demo-form" aria-labelledby="demo-form-title">
      <h2 id="demo-form-title">Démonstration technique</h2>
      <p className="demo-form__note">
        React Hook Form + Zod + TypeScript — cette démonstration n&rsquo;est pas
        une fonctionnalité MON CAR.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-field">
          <label htmlFor="demo-email">Adresse e-mail</label>
          <input
            id="demo-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email !== undefined}
            aria-describedby={errors.email !== undefined ? 'demo-email-error' : undefined}
            {...register('email')}
          />
          {errors.email !== undefined && (
            <p className="form-field__error" id="demo-email-error" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="demo-message">Message</label>
          <textarea
            id="demo-message"
            rows={4}
            aria-invalid={errors.message !== undefined}
            aria-describedby={errors.message !== undefined ? 'demo-message-error' : undefined}
            {...register('message')}
          />
          {errors.message !== undefined && (
            <p className="form-field__error" id="demo-message-error" role="alert">
              {errors.message.message}
            </p>
          )}
        </div>

        <button type="submit">Envoyer la démonstration</button>
      </form>

      {submittedEmail !== null && (
        <p className="demo-form__success" role="status">
          Formulaire validé pour {submittedEmail} — démonstration technique réussie.
        </p>
      )}
    </section>
  )
}
