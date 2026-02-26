"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Waves, Loader2, CheckCircle } from "lucide-react"

export const dynamic = "force-dynamic"

type Mode = "login" | "register" | "reset"

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  function resetForm() {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setError(null)
    setSuccess(null)
  }

  function switchMode(m: Mode) {
    setMode(m)
    resetForm()
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError("Credenziali non valide. Riprova.")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError("La password deve essere di almeno 6 caratteri."); return }
    if (password !== confirmPassword) { setError("Le password non coincidono."); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess("Registrazione completata! Controlla la tua email per confermare l'account, poi accedi.")
      setLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess("Email inviata! Controlla la tua casella di posta e segui il link per reimpostare la password.")
      setLoading(false)
    }
  }

  const titles: Record<Mode, { title: string; sub: string }> = {
    login: { title: "Salvataggio Sub Alto Verbano", sub: "a Luino dal 1978" },
    register: { title: "Registrati", sub: "Crea il tuo account" },
    reset: { title: "Password dimenticata?", sub: "Ti invieremo un link di recupero" },
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full ocean-gradient opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent opacity-10 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl ocean-gradient shadow-lg mb-4">
            <Waves className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            {titles[mode].title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{titles[mode].sub}</p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-xl">
          {success ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{success}</p>
              </div>
              <button
                onClick={() => switchMode("login")}
                className="w-full ocean-gradient text-white font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-all shadow-md text-sm"
              >
                Torna al login
              </button>
            </div>
          ) : (
            <>
              {mode === "login" && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <EmailField value={email} onChange={setEmail} />
                  <PasswordField label="Password" value={password} onChange={setPassword} />
                  {error && <ErrorMsg msg={error} />}
                  <SubmitButton loading={loading} label="Accedi" loadingLabel="Accesso in corso..." />
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button type="button" onClick={() => switchMode("reset")}
                      className="text-primary hover:underline">
                      Password dimenticata?
                    </button>
                    <button type="button" onClick={() => switchMode("register")}
                      className="text-primary hover:underline">
                      Crea un account
                    </button>
                  </div>
                </form>
              )}

              {mode === "register" && (
                <form onSubmit={handleRegister} className="space-y-5">
                  <EmailField value={email} onChange={setEmail} />
                  <PasswordField label="Password" value={password} onChange={setPassword} placeholder="Minimo 6 caratteri" />
                  <PasswordField label="Conferma password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Ripeti la password" />
                  {error && <ErrorMsg msg={error} />}
                  <SubmitButton loading={loading} label="Registrati" loadingLabel="Registrazione..." />
                  <p className="text-center text-xs text-muted-foreground pt-1">
                    Hai già un account?{" "}
                    <button type="button" onClick={() => switchMode("login")} className="text-primary hover:underline">
                      Accedi
                    </button>
                  </p>
                </form>
              )}

              {mode === "reset" && (
                <form onSubmit={handleReset} className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    Inserisci l&apos;email del tuo account e ti invieremo un link per reimpostare la password.
                  </p>
                  <EmailField value={email} onChange={setEmail} />
                  {error && <ErrorMsg msg={error} />}
                  <SubmitButton loading={loading} label="Invia link di recupero" loadingLabel="Invio in corso..." />
                  <p className="text-center text-xs text-muted-foreground pt-1">
                    <button type="button" onClick={() => switchMode("login")} className="text-primary hover:underline">
                      ← Torna al login
                    </button>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EmailField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
      <input id="email" type="email" value={value} onChange={e => onChange(e.target.value)} required
        placeholder="nome@example.com"
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
    </div>
  )
}

function PasswordField({ label, value, onChange, placeholder = "••••••••" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type="password" value={value} onChange={e => onChange(e.target.value)} required
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
    </div>
  )
}

function ErrorMsg({ msg }: { msg: string }) {
  return <div className="text-sm text-destructive bg-destructive/10 px-4 py-2.5 rounded-lg">{msg}</div>
}

function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full ocean-gradient text-white font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md">
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {loading ? loadingLabel : label}
    </button>
  )
}
