// src/pages/LoginPage.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const loginSchema = z.object({
  email:    z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
})
type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true })
    })
  }, [navigate])

  async function onSubmit({ email, password }: LoginForm) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('root', {
        message: error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : error.message,
      })
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-clinical-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-clinical-text">Mentality Admin</h1>
          <p className="text-sm text-clinical-muted mt-1">
            Interface réservée aux praticiens partenaires
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-xl border border-clinical-border shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              type="email"
              label="Adresse email"
              placeholder="praticien@institution.fr"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              type="password"
              label="Mot de passe"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />

            {errors.root && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5">
                <p className="text-sm text-red-700">{errors.root.message}</p>
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
              Se connecter
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-clinical-muted mt-6">
          Accès sur invitation uniquement. Contactez l'administrateur Mentality
          si vous n'avez pas reçu votre invitation.
        </p>
      </div>
    </div>
  )
}
