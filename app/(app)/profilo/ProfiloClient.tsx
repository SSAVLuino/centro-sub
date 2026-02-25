"use client"

import { useState, useRef, useEffect } from "react"
import { User, Mail, Phone, CreditCard, MapPin, Shield, Anchor, Wind, Award, Calendar, Briefcase, CheckCircle, XCircle, KeyRound, Loader2, Camera, Pencil, FileText, Upload, Trash2, ExternalLink } from "lucide-react"
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCertificatiModal, setShowCertificatiModal] = useState(false)
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
            <div className="flex gap-2 mt-2 flex-wrap">
              {socio && (
                <button onClick={() => setShowCertificatiModal(true)}
                  className="flex items-center gap-1.5 text-xs border border-border px-3 py-2 rounded-xl hover:bg-secondary transition-all font-medium">
                  <FileText className="w-3.5 h-3.5" /> Certificati Medici
                </button>
              )}
              {socio && (
                <button onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1.5 text-xs border border-border px-3 py-2 rounded-xl hover:bg-secondary transition-all font-medium">
                  <Pencil className="w-3.5 h-3.5" /> Modifica dati
                </button>
              )}
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
            color={socio.Attivo ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"} />
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

      {showEditModal && socio && (
        <EditProfiloModal socio={socio} onClose={() => setShowEditModal(false)} onSaved={() => { setShowEditModal(false); router.refresh() }} />
      )}

      {showCertificatiModal && socio && (
        <CertificatiModal socioId={socio.id} onClose={() => setShowCertificatiModal(false)} />
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl mt-4 mb-4">
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

function EditProfiloModal({ socio, onClose, onSaved }: { socio: Socio; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient()
  const [form, setForm] = useState({
    Nome: socio.Nome ?? "",
    Cognome: socio.Cognome ?? "",
    Telefono: socio.Telefono ?? "",
    "Data di Nascita": socio["Data di Nascita"] ?? "",
    "Luogo di nascita": socio["Luogo di nascita"] ?? "",
    Indirizzo: socio.Indirizzo ?? "",
    CAP: socio.CAP ?? "",
    Comune: socio.Comune ?? "",
    Provincia: socio.Provincia ?? "",
    Nazione: socio.Nazione ?? "Italia",
    CF: socio.CF ?? "",
    Professione: socio.Professione ?? "",
    Specializzazione: socio.Specializzazione ?? "",
    "Tipo Assicurazione": socio["Tipo Assicurazione"] ?? "",
    "Nota FIN": socio["Nota FIN"] ?? "",
    "Nota Patente": socio["Nota Patente"] ?? "",
    "Addetto Ricarica": socio["Addetto Ricarica"] ?? false,
    FIN: socio.FIN ?? false,
    "Patente Nautica": socio["Patente Nautica"] ?? false,
    Assicurazione: socio.Assicurazione ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: string, value: any) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!form.Nome?.trim() || !form.Cognome?.trim()) {
      setError("Nome e Cognome sono obbligatori")
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      Nome: form.Nome,
      Cognome: form.Cognome,
      Telefono: form.Telefono,
      "Data di Nascita": form["Data di Nascita"],
      "Luogo di nascita": form["Luogo di nascita"],
      Indirizzo: form.Indirizzo,
      CAP: form.CAP,
      Comune: form.Comune,
      Provincia: form.Provincia,
      Nazione: form.Nazione,
      CF: form.CF,
      Professione: form.Professione,
      Specializzazione: form.Specializzazione,
      "Tipo Assicurazione": form["Tipo Assicurazione"],
      "Nota FIN": form["Nota FIN"],
      "Nota Patente": form["Nota Patente"],
      "Addetto Ricarica": form["Addetto Ricarica"],
      FIN: form.FIN,
      "Patente Nautica": form["Patente Nautica"],
      Assicurazione: form.Assicurazione,
    }

    const { error } = await supabase
      .from("BP_soci")
      .update(payload)
      .eq("id", socio.id)

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      onSaved()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col mt-4 mb-4">
        <div className="p-6 border-b border-border shrink-0">
          <h2 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
            Modifica i tuoi dati
          </h2>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Anagrafica */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Dati Anagrafici</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome *" value={form.Nome} onChange={v => set("Nome", v)} />
                <Field label="Cognome *" value={form.Cognome} onChange={v => set("Cognome", v)} />
              </div>
              <Field label="Telefono" value={form.Telefono} onChange={v => set("Telefono", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Data di Nascita" value={form["Data di Nascita"]} onChange={v => set("Data di Nascita", v)} type="date" />
                <Field label="Luogo di Nascita" value={form["Luogo di nascita"]} onChange={v => set("Luogo di nascita", v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Codice Fiscale" value={form.CF} onChange={v => set("CF", v)} />
                <Field label="Professione" value={form.Professione} onChange={v => set("Professione", v)} />
              </div>
            </div>
          </div>

          {/* Residenza */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Residenza</h3>
            <div className="space-y-3">
              <Field label="Indirizzo" value={form.Indirizzo} onChange={v => set("Indirizzo", v)} />
              <div className="grid grid-cols-3 gap-3">
                <Field label="CAP" value={form.CAP} onChange={v => set("CAP", v)} />
                <Field label="Comune" value={form.Comune} onChange={v => set("Comune", v)} />
                <Field label="Provincia" value={form.Provincia} onChange={v => set("Provincia", v)} />
              </div>
              <Field label="Nazione" value={form.Nazione} onChange={v => set("Nazione", v)} />
            </div>
          </div>

          {/* Sub & Specializzazioni */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sub & Specializzazioni</h3>
            <div className="space-y-3">
              <Field label="Specializzazione" value={form.Specializzazione} onChange={v => set("Specializzazione", v)} />
              <Field label="Tipo Assicurazione" value={form["Tipo Assicurazione"]} onChange={v => set("Tipo Assicurazione", v)} />
              <div className="grid grid-cols-2 gap-3 pt-1">
                <CheckField label="Addetto Ricarica" value={form["Addetto Ricarica"]} onChange={v => set("Addetto Ricarica", v)} icon={<Wind className="w-3.5 h-3.5" />} />
                <CheckField label="Tesserato FIN" value={form.FIN} onChange={v => set("FIN", v)} icon={<Anchor className="w-3.5 h-3.5" />} />
                <CheckField label="Patente Nautica" value={form["Patente Nautica"]} onChange={v => set("Patente Nautica", v)} icon={<Shield className="w-3.5 h-3.5" />} />
                <CheckField label="Assicurazione" value={form.Assicurazione} onChange={v => set("Assicurazione", v)} icon={<Shield className="w-3.5 h-3.5" />} />
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Note & Extra</h3>
            <div className="space-y-3">
              <TextareaField label="Nota FIN" value={form["Nota FIN"]} onChange={v => set("Nota FIN", v)} />
              <TextareaField label="Nota Patente Nautica" value={form["Nota Patente"]} onChange={v => set("Nota Patente", v)} />
            </div>
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="p-6 border-t border-border flex gap-3 justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">
            Annulla
          </button>
          <button onClick={handleSave} disabled={saving}
            className="ocean-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Salvo..." : "Aggiorna Profilo"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${disabled ? "bg-secondary text-muted-foreground cursor-not-allowed" : ""}`} 
      />
    </div>
  )
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
        className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all" />
    </div>
  )
}

function CheckField({ label, value, onChange, icon }: { label: string; value: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all w-full ${value ? "border-primary bg-primary/5 text-primary" : "border-border bg-white text-muted-foreground hover:bg-secondary"}`}
    >
      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${value ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
        {value && <CheckCircle className="w-3 h-3 text-white" />}
      </span>
      {icon && <span className="opacity-60">{icon}</span>}
      {label}
    </button>
  )
}

// ── Certificati Modal ──────────────────────────────────────────────────────

type Certificato = {
  id: number
  created_at: string
  socio: number | null
  "Attività subacquea": boolean | null
  "Data visita": string
  "Data scadenza": string | null
  PDF: string | null
}

const CERT_BUCKET = "Certificati"
const CERT_BASE_URL = process.env.NEXT_PUBLIC_CERTIFICATI_BASE_URL ?? ""

function CertificatiModal({ socioId, onClose }: { socioId: number; onClose: () => void }) {
  const supabase = createClient()
  const [certificati, setCertificati] = useState<Certificato[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    "Data visita": "",
    "Data scadenza": "",
    "Attività subacquea": false,
    pdfFile: null as File | null,
  })

  useEffect(() => {
    loadCertificati()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadCertificati() {
    setLoading(true)
    const { data } = await supabase
      .from("BP_certificati")
      .select("*")
      .eq("socio", socioId)
      .order("Data visita", { ascending: false })
    setCertificati((data ?? []) as Certificato[])
    setLoading(false)
  }

  function handleDataVisitaChange(val: string) {
    // Calcola automaticamente data scadenza = data visita + 1 anno
    let scadenza = ""
    if (val) {
      const d = new Date(val)
      d.setFullYear(d.getFullYear() + 1)
      scadenza = d.toISOString().split("T")[0]
    }
    setForm(f => ({ ...f, "Data visita": val, "Data scadenza": scadenza }))
  }

  async function handleSubmit() {
    if (!form["Data visita"]) { setError("La data di visita è obbligatoria"); return }
    setUploading(true)
    setError(null)

    let pdfPath: string | null = null

    if (form.pdfFile) {
      const ext = form.pdfFile.name.split(".").pop()?.toLowerCase() ?? "pdf"
      const fileName = `${socioId}_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from(CERT_BUCKET)
        .upload(fileName, form.pdfFile, { upsert: false, contentType: "application/pdf" })
      if (uploadErr) {
        setError(`Errore upload PDF: ${uploadErr.message}`)
        setUploading(false)
        return
      }
      pdfPath = fileName
    }

    const { error: dbErr } = await supabase.from("BP_certificati").insert({
      socio: socioId,
      "Data visita": form["Data visita"],
      "Data scadenza": form["Data scadenza"] || null,
      "Attività subacquea": form["Attività subacquea"],
      PDF: pdfPath,
    })

    if (dbErr) {
      setError(`Errore salvataggio: ${dbErr.message}`)
      setUploading(false)
      return
    }

    setForm({ "Data visita": "", "Data scadenza": "", "Attività subacquea": false, pdfFile: null })
    setShowForm(false)
    setUploading(false)
    loadCertificati()
  }

  async function handleDelete(cert: Certificato) {
    setDeleting(cert.id)
    if (cert.PDF) {
      await supabase.storage.from(CERT_BUCKET).remove([cert.PDF])
    }
    await supabase.from("BP_certificati").delete().eq("id", cert.id)
    setDeleting(null)
    loadCertificati()
  }

  function isScaduto(scadenza: string | null) {
    if (!scadenza) return false
    return new Date(scadenza) < new Date()
  }

  function formatDate(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col mt-4 mb-4">
        {/* Header */}
        <div className="p-6 border-b border-border shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
              Certificati Medici
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Gestisci i tuoi certificati di idoneità</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Bottone aggiungi */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="ocean-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:opacity-90 transition-all"
            >
              <Upload className="w-4 h-4" /> Carica nuovo certificato
            </button>
          )}

          {/* Form nuovo certificato */}
          {showForm && (
            <div className="bg-secondary/40 rounded-2xl p-5 space-y-4 border border-border">
              <h3 className="text-sm font-semibold">Nuovo certificato</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Data visita *</label>
                  <input
                    type="date"
                    value={form["Data visita"]}
                    onChange={e => handleDataVisitaChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Data scadenza</label>
                  <input
                    type="date"
                    value={form["Data scadenza"]}
                    onChange={e => setForm(f => ({ ...f, "Data scadenza": e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Calcolata automaticamente (+1 anno)</p>
                </div>
              </div>

              <CheckField
                label="Attività subacquea"
                value={form["Attività subacquea"]}
                onChange={v => setForm(f => ({ ...f, "Attività subacquea": v }))}
                icon={<Anchor className="w-3.5 h-3.5" />}
              />

              <div>
                <label className="block text-sm font-medium mb-1.5">PDF certificato</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-all bg-white"
                >
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">
                    {form.pdfFile ? form.pdfFile.name : "Clicca per selezionare un PDF"}
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={e => setForm(f => ({ ...f, pdfFile: e.target.files?.[0] ?? null }))}
                />
              </div>

              {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowForm(false); setError(null) }} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">
                  Annulla
                </button>
                <button onClick={handleSubmit} disabled={uploading}
                  className="ocean-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2">
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploading ? "Salvo..." : "Salva certificato"}
                </button>
              </div>
            </div>
          )}

          {/* Lista certificati */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : certificati.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nessun certificato caricato</p>
            </div>
          ) : (
            <div className="space-y-3">
              {certificati.map(cert => {
                const scaduto = isScaduto(cert["Data scadenza"])
                const inScadenza = cert["Data scadenza"] && !scaduto &&
                  (new Date(cert["Data scadenza"]).getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000
                return (
                  <div key={cert.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border ${scaduto ? "border-red-200 bg-red-50" : inScadenza ? "border-amber-200 bg-amber-50" : "border-border bg-white"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${scaduto ? "bg-red-100" : inScadenza ? "bg-amber-100" : "bg-emerald-50"}`}>
                        <FileText className={`w-4 h-4 ${scaduto ? "text-red-500" : inScadenza ? "text-amber-500" : "text-emerald-500"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">Visita: {formatDate(cert["Data visita"])}</p>
                          {cert["Attività subacquea"] && (
                            <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full font-medium">Subacquea</span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${scaduto ? "text-red-600 font-medium" : inScadenza ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                          {scaduto ? "⚠ Scaduto il " : inScadenza ? "⏳ Scade il " : "✓ Scade il "}
                          {formatDate(cert["Data scadenza"])}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cert.PDF && (
                        <a
                          href={`${CERT_BASE_URL}${cert.PDF}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
                          title="Apri PDF"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(cert)}
                        disabled={deleting === cert.id}
                        className="p-2 rounded-xl hover:bg-red-50 transition-all text-muted-foreground hover:text-red-500"
                        title="Elimina"
                      >
                        {deleting === cert.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border shrink-0 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}
