"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Loader2, X, Trash2, RefreshCw, Shield, Mail, Calendar, LogIn, Pencil } from "lucide-react"

interface Role { id: number; name: string }

interface AppUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  role: { id: number; name: string } | null
}

interface Props { roles: Role[] }

const ROLE_COLORS: Record<string, string> = {
  Admin:     "bg-red-100 text-red-700 border-red-200",
  Consiglio: "bg-violet-100 text-violet-700 border-violet-200",
  Staff:     "bg-blue-100 text-blue-700 border-blue-200",
  Socio:     "bg-emerald-100 text-emerald-700 border-emerald-200",
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function formatDateTime(iso: string | null) {
  if (!iso) return "Mai"
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
      <p className="text-xs text-muted-foreground font-medium mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{value}</p>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} opacity-20`}></div>
      </div>
    </div>
  )
}

// ── Modal Nuovo Utente ────────────────────────────────────────────────────────
function NuovoUtenteModal({ roles, onClose, onCreated }: {
  roles: Role[]
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({ email: "", password: "", roleId: roles[0]?.id?.toString() ?? "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!form.email || !form.password || !form.roleId) {
      setError("Tutti i campi sono obbligatori"); return
    }
    if (form.password.length < 6) {
      setError("La password deve essere di almeno 6 caratteri"); return
    }
    setSaving(true); setError(null)
    try {
      const res = await fetch("/api/gestione-utenti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, roleId: parseInt(form.roleId) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Errore sconosciuto")
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto")
    } finally { setSaving(false) }
  }

  const field = "w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold">Nuovo Utente</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-all"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credenziali</h3>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email *</label>
              <input type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="utente@esempio.com" className={field} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password *</label>
              <input type="password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Minimo 6 caratteri" className={field} />
            </div>
          </div>
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ruolo</h3>
            <select value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })} className={field}>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="p-6 border-t border-border flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">Annulla</button>
          <button onClick={handleSave} disabled={saving}
            className="ocean-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Creo..." : "Crea Utente"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Modifica Ruolo ──────────────────────────────────────────────────────
function ModificaRuoloModal({ user, roles, onClose, onSaved }: {
  user: AppUser
  roles: Role[]
  onClose: () => void
  onSaved: () => void
}) {
  const [roleId, setRoleId] = useState(user.role?.id?.toString() ?? roles[0]?.id?.toString() ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const res = await fetch("/api/gestione-utenti", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, roleId: parseInt(roleId) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Errore")
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore")
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold">Modifica Ruolo</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-all"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">Utente: <span className="font-medium text-foreground">{user.email}</span></p>
          <div>
            <label className="block text-sm font-medium mb-1.5">Nuovo ruolo</label>
            <select value={roleId} onChange={e => setRoleId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="p-6 border-t border-border flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">Annulla</button>
          <button onClick={handleSave} disabled={saving}
            className="ocean-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Salvo..." : "Salva"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function GestioneClient({ roles }: Props) {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNuovo, setShowNuovo] = useState(false)
  const [editUser, setEditUser] = useState<AppUser | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<AppUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")

  const loadUsers = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/gestione-utenti")
      const text = await res.text()
      let json: any
      try {
        json = JSON.parse(text)
      } catch {
        setError(`Errore API (${res.status}): ${text.slice(0, 200)}`)
        return
      }
      if (!res.ok) throw new Error(json.error ?? "Errore")
      setUsers(json.users)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore nel caricamento")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const res = await fetch("/api/gestione-utenti", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: confirmDelete.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setConfirmDelete(null)
      loadUsers()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore nell'eliminazione")
    } finally { setDeleting(false) }
  }

  const filtered = users.filter(u =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.role?.name ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    totale: users.length,
    admin: users.filter(u => u.role?.name === "Admin").length,
    consiglio: users.filter(u => u.role?.name === "Consiglio").length,
    senzaRuolo: users.filter(u => !u.role).length,
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestione Utenti</h1>
          <p className="text-muted-foreground mt-1">Utenti e ruoli dell'applicazione</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadUsers} disabled={loading}
            className="p-2.5 rounded-xl border border-border hover:bg-secondary transition-all text-muted-foreground disabled:opacity-50" title="Ricarica">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setShowNuovo(true)}
            className="ocean-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Nuovo Utente
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Utenti Totali" value={stats.totale}    color="from-blue-500 to-cyan-500" />
        <StatCard label="Admin"         value={stats.admin}     color="from-red-500 to-rose-500" />
        <StatCard label="Consiglio"     value={stats.consiglio} color="from-violet-500 to-purple-500" />
        <StatCard label="Senza Ruolo"   value={stats.senzaRuolo} color="from-amber-500 to-orange-500" />
      </div>

      {/* Ruoli disponibili */}
      <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Ruoli configurati</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {roles.map(r => (
            <span key={r.id} className={`px-3 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[r.name] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
              {r.name}
            </span>
          ))}
        </div>
      </div>

      {/* Errore */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl border border-destructive/20">{error}</div>
      )}

      {/* Ricerca */}
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca per email o ruolo..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Caricamento utenti...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Email</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Ruolo</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Creato</span>
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1"><LogIn className="w-3.5 h-3.5" /> Ultimo accesso</span>
                  </th>
                  <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-muted-foreground">
                      <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      {search ? "Nessun utente trovato." : "Nessun utente presente."}
                    </td>
                  </tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {u.email[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {u.role
                        ? <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[u.role.name] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>{u.role.name}</span>
                        : <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200">Nessuno</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">{formatDateTime(u.last_sign_in_at)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setEditUser(u)}
                          className="p-2 rounded-xl hover:bg-secondary transition-all text-muted-foreground hover:text-foreground" title="Modifica ruolo">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(u)}
                          className="p-2 rounded-xl hover:bg-red-50 transition-all text-muted-foreground hover:text-red-500" title="Elimina utente">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border bg-secondary/30 text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "utente" : "utenti"} visualizzati
          </div>
        )}
      </div>

      {/* Modale conferma eliminazione */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Elimina utente</h3>
                <p className="text-sm text-muted-foreground">Questa azione è irreversibile.</p>
              </div>
            </div>
            <p className="text-sm">Sei sicuro di voler eliminare <span className="font-semibold">{confirmDelete.email}</span>?<br />
              <span className="text-muted-foreground text-xs">L'utente non potrà più accedere all'applicazione.</span>
            </p>
            <div className="flex gap-3 justify-end pt-1">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">
                Annulla
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-60 flex items-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? "Elimino..." : "Sì, elimina"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modali */}
      {showNuovo && (
        <NuovoUtenteModal roles={roles} onClose={() => setShowNuovo(false)}
          onCreated={() => { setShowNuovo(false); loadUsers() }} />
      )}
      {editUser && (
        <ModificaRuoloModal user={editUser} roles={roles}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); loadUsers() }} />
      )}
    </div>
  )
}
