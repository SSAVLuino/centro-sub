"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Waves, Loader2, CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError("La password deve essere di almeno 6 caratteri."); return }
    if (password !== confirm) { setError("Le password non coincidono."); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push("/dashboard"), 2500)
    }
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
            Nuova password
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Scegli una nuova password per il tuo account</p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-xl">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Password aggiornata! Reindirizzamento...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nuova password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Minimo 6 caratteri"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Conferma password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  placeholder="Ripeti la nuova password"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 px-4 py-2.5 rounded-lg">{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full ocean-gradient text-white font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Salvataggio..." : "Salva nuova password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
