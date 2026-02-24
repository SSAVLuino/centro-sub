"use client"

import { useState, useRef } from "react"
import { User, Mail, Phone, CreditCard, MapPin, Shield, Anchor, Wind, Award, Calendar, Briefcase, CheckCircle, XCircle, KeyRound, Loader2, Camera } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import type { User as SupabaseUser } from "@supabase/supabase-js"

type Socio = any

const AVATAR_BASE_URL = process.env.NEXT_PUBLIC_AVATAR_BASE_URL ?? ""

export default function ProfiloClient({
  user,
  socio,
  ricaricheCount,
}: {
  user: SupabaseUser
  socio: Socio | null
  ricaricheCount: number
}) {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    socio?.Avatar ? `${AVATAR_BASE_URL}${socio.Avatar}` : null
  )
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const displayName = socio ? `${socio.Nome} ${socio.Cognome}` : user.email
  const initials = socio
    ? `${socio.Nome?.[0] ?? ""}${socio.Cognome?.[0] ?? ""}`
    : user.email?.[0]?.toUpperCase() ?? "?"

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !socio) return

    // Valida tipo e dimensione (max 2MB)
    if (!file.type.startsWith("image/")) {
      setUploadError("Seleziona un file immagine (jpg, png, webp...)")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("L'immagine non può superare i 2MB.")
      return
    }

    setUploading(true)
    setUploadError(null)

    // Genera nome univoco: {id_socio}_{timestamp}.{ext}
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    const fileName = `${socio.id}_${Date.now()}.${ext}`

    // Upload su Supabase Storage bucket "Avatar"
    const { error: uploadErr } = await supabase.storage
      .from("Avatar")
      .upload(fileName, file, { upsert: false, contentType: file.type })

    if (uploadErr) {
      setUploadError(`Errore upload: ${uploadErr.message}`)
      setUploading(false)
      return
    }

    // Aggiorna il campo Avatar nel DB con il nuovo nome file
    const { error: dbErr } = await supabase
      .from("BP_soci")
      .update({ Avatar: fileName })
      .eq("id", socio.id)

    if (dbErr) {
      setUploadError(`Errore salvataggio: ${dbErr.message}`)
      setUploading(false)
      return
    }

    // Aggiorna preview con cache-busting
    setAvatarUrl(`${AVATAR_BASE_URL}${fileName}?t=${Date.now()}`)
    setUploading(false)
    router.refresh()
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Il mio profilo</h1>
        <p className="text-muted-foreground mt-1">I tuoi dati personali e le tue informazioni</p>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="h-24 ocean-gradient relative" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">

            {/* Avatar con overlay upload */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarUrl(null)}
                  />
                ) : (
                  <span className="text-white text-2xl font-bold select-none"
                    style={{ fontFamily: "'Syne', sans-serif" }}>
                    {initials}
                  </span>
                )}
              </div>

              {/* Overlay cambio foto — visibile solo se c'è un socio */}
              {socio && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Cambia foto profilo"
                  className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer disabled:cursor-wait"
                >
                  {uploading
                    ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                    : <Camera className="w-6 h-6 text-white" />}
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Azioni */}
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-1.5 text-xs border border-border px-3 py-2 rounded-xl hover:bg-secondary transition-all font-medium">
                <KeyRound className="w-3.5 h-3.5" /> Cambia password
              </button>
            </div>
          </div>

          <h2 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{displayName}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {socio?.UT_TipoSocio?.Descrizione && (
            <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
              {socio.UT_TipoSocio.Descrizione}
            </span>
          )}

          {uploadError && (
            <p className="mt-3 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              {uploadError}
            </p>
          )}
          {socio && (
            <p className="mt-2 text-xs text-muted-foreground">
              Passa il mouse sulla foto per cambiarla · Max 2MB · jpg/png/webp
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      {socio && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Stato" value={socio.Attivo ? "Attivo" : "Inattivo"}
            icon={socio.Attivo ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
            color={socio.Attivo ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"} />
          <StatCard label="Brevetto" value={socio.UT_Brevetti?.Nome ?? "—"}
            icon={<Award className="w-4 h-4 text-blue-500" />}
            color="bg-blue-50 text-blue-700" />
          <StatCard label="Ricariche" value={`${ricaricheCount}`}
            icon={<Wind className="w-4 h-4 text-cyan-500" />}
            color="bg-cyan-50 text-cyan-700" />
          <StatCard label="Iscritto dal" value={socio.created_at ? format(new Date(socio.created_at), "MMM yyyy", { locale: it }) : "—"}
            icon={<Calendar className="w-4 h-4 text-purple-500" />}
            color="bg-purple-50 text-purple-700" />
        </div>
      )}

      {/* Dati */}
      {socio ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Dati Anagrafici">
            <InfoRow icon={<User className="w-4 h-4" />} label="Nome completo" value={`${socio.Nome ?? ""} ${socio.Cognome ?? ""}`.trim()} />
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={socio.email} />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Telefono" value={socio.Telefono} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Data di nascita"
              value={socio["Data di Nascita"] ? format(new Date(socio["Data di Nascita"]), "dd MMMM yyyy", { locale: it }) : null} />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Luogo di nascita" value={socio["Luogo di nascita"]} />
            <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Codice Fiscale" value={socio.CF} />
            <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Professione" value={socio.Professione} />
          </Section>

          <Section title="Residenza">
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Indirizzo" value={socio.Indirizzo} />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Comune"
              value={[socio.Comune, socio.CAP ? `(${socio.CAP})` : null].filter(Boolean).join(" ") || null} />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Provincia" value={socio.Provincia} />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Nazione" value={socio.Nazione} />
          </Section>

          <Section title="Attività Sub">
            <InfoRow icon={<Award className="w-4 h-4" />} label="Brevetto" value={socio.UT_Brevetti?.Nome} />
            {socio.UT_Brevetti?.Didattica && (
              <InfoRow icon={<Award className="w-4 h-4" />} label="Didattica" value={socio.UT_Brevetti.Didattica} />
            )}
            <InfoRow icon={<Award className="w-4 h-4" />} label="Specializzazione" value={socio.Specializzazione} />
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge active={socio["Addetto Ricarica"]} label="Addetto Ricarica" icon={<Wind className="w-3 h-3" />} />
              <Badge active={socio.FIN} label="Tesserato FIN" icon={<Anchor className="w-3 h-3" />} />
              <Badge active={socio["Patente Nautica"]} label="Patente Nautica" icon={<Shield className="w-3 h-3" />} />
              <Badge active={socio.Assicurazione} label="Assicurazione" icon={<Shield className="w-3 h-3" />} />
            </div>
          </Section>

          {(socio["Nota FIN"] || socio["Nota Patente"] || socio["Tipo Assicurazione"]) && (
            <Section title="Note & Extra">
              <InfoRow icon={<Anchor className="w-4 h-4" />} label="Tipo Assicurazione" value={socio["Tipo Assicurazione"]} />
              <InfoRow icon={<Anchor className="w-4 h-4" />} label="Nota FIN" value={socio["Nota FIN"]} />
              <InfoRow icon={<Shield className="w-4 h-4" />} label="Nota Patente" value={socio["Nota Patente"]} />
            </Section>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <User className="w-5 h-5" />
            <p className="text-sm">
              Nessun profilo socio associato a <strong>{user.email}</strong>.
              Chiedi all&apos;amministratore di collegare il tuo account.
            </p>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <PasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>{value}</span>
    </div>
  )
}

function Badge({ active, label, icon }: { active: boolean | null; label: string; icon: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${active ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-muted-foreground line-through"}`}>
      {icon} {label}
    </span>
  )
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const supabase = createClient()
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSave() {
    if (newPassword.length < 6) { setError("La password deve essere di almeno 6 caratteri."); return }
    if (newPassword !== confirm) { setError("Le password non coincidono."); return }
    setSaving(true); setError(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setError(error.message); setSaving(false) }
    else { setSuccess(true); setTimeout(() => { onClose(); router.refresh() }, 1500) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Cambia password</h2>
        </div>
        <div className="p-6 space-y-4">
          {success ? (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Password aggiornata!</span>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nuova password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimo 6 caratteri"
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Conferma password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Ripeti la nuova password"
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
            </>
          )}
        </div>
        {!success && (
          <div className="p-6 border-t border-border flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">
              Annulla
            </button>
            <button onClick={handleSave} disabled={saving}
              className="ocean-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Salvo..." : "Aggiorna"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
