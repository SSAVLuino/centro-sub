"use client"

import { useState, useRef, useEffect } from "react"
import {
  User, Mail, Phone, CreditCard, MapPin, Shield, Anchor, Wind, Award,
  Calendar, Briefcase, CheckCircle, XCircle, KeyRound, Loader2, Camera,
  Pencil, FileText, Upload, Trash2, ExternalLink, Package, Wrench
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useSignedUrls, useSignedUrl } from "@/lib/useSignedUrl"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import type { User as SupabaseUser } from "@supabase/supabase-js"

type Socio = any
type Bombola = {
  id: number
  Matricola: string
  Codice: number | null
  Etichetta: string | null
  Volume: string
  Marca: string | null
  Materiale: string | null
  Attacco: string | null
  Foto: string | null
  "Stato Revisione": string | null
  "Ultima Revisione": string | null
  Dismessa: boolean | null
  Nota: string | null
}

const AVATAR_BASE_URL = process.env.NEXT_PUBLIC_AVATAR_BASE_URL ?? ""

const TABS = [
  { id: "dati",        label: "Dati",        icon: User },
  { id: "certificati", label: "Certificati", icon: FileText },
  { id: "bombole",     label: "Bombole",     icon: Package },
  { id: "noleggio",    label: "Noleggio",    icon: Wrench },
]

export default function ProfiloClient({
  user, socio, ricaricheCount, bombole,
}: {
  user: SupabaseUser; socio: Socio | null; ricaricheCount: number; bombole: Bombola[]
}) {
  const [activeTab, setActiveTab]                 = useState("dati")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showEditModal, setShowEditModal]         = useState(false)
  const [avatarUrl, setAvatarUrl]                 = useState<string | null>(
    socio?.Avatar ? `${AVATAR_BASE_URL}${socio.Avatar}` : null
  )
  const [uploading, setUploading]     = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router   = useRouter()

  const displayName = socio ? `${socio.Nome} ${socio.Cognome}` : user.email
  const initials    = socio
    ? `${socio.Nome?.[0] ?? ""}${socio.Cognome?.[0] ?? ""}`
    : user.email?.[0]?.toUpperCase() ?? "?"

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !socio) return
    if (!file.type.startsWith("image/")) { setUploadError("Seleziona un file immagine (jpg, png, webp...)"); return }
    if (file.size > 2 * 1024 * 1024)    { setUploadError("L'immagine non può superare i 2MB."); return }
    setUploading(true); setUploadError(null)
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    const fileName = `${socio.id}_${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from("Avatar").upload(fileName, file, { upsert: false, contentType: file.type })
    if (uploadErr) { setUploadError(`Errore upload: ${uploadErr.message}`); setUploading(false); return }
    const { error: dbErr } = await supabase.from("BP_soci").update({ Avatar: fileName }).eq("id", socio.id)
    if (dbErr) { setUploadError(`Errore salvataggio: ${dbErr.message}`); setUploading(false); return }
    setAvatarUrl(`${AVATAR_BASE_URL}${fileName}?t=${Date.now()}`)
    setUploading(false); router.refresh()
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Il mio profilo</h1>
        <p className="text-muted-foreground mt-1">I tuoi dati personali e le tue informazioni</p>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="h-24 ocean-gradient relative px-6 flex items-center justify-end">
          <div className="text-right min-w-0">
            <h2 className="text-xl font-bold text-white truncate drop-shadow-sm" style={{ fontFamily: "'Syne', sans-serif" }}>{displayName}</h2>
            <p className="text-sm text-white/75 truncate">{user.email}</p>
            {socio?.UT_TipoSocio?.Descrizione && (
              <span className="inline-block mt-1 text-xs bg-white/20 text-white px-3 py-0.5 rounded-full font-medium backdrop-blur-sm">
                {socio.UT_TipoSocio.Descrizione}
              </span>
            )}
          </div>
        </div>
        <div className="px-6 pb-5">
          {/* Avatar */}
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                {avatarUrl
                  ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-white">{initials}</span>
                }
              </div>
              {socio && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="flex gap-2 pb-1">
              {socio && (
                <button onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-xl hover:bg-secondary transition-all font-medium">
                  <Pencil className="w-3.5 h-3.5" /> Modifica
                </button>
              )}
              <button onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-xl hover:bg-secondary transition-all font-medium">
                <KeyRound className="w-3.5 h-3.5" /> Password
              </button>
            </div>
          </div>
          {uploadError && <p className="text-xs text-destructive mb-3">{uploadError}</p>}
        </div>
      </div>

      {/* Stat cards */}
      {socio && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Stato" value={socio.Attivo ? "Attivo" : "Inattivo"}
            icon={socio.Attivo ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
            color={socio.Attivo ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"} />
          <StatCard label="Brevetto"    value={socio.UT_Brevetti?.Nome ?? "—"}
            icon={<Award className="w-4 h-4 text-blue-500" />} color="bg-blue-50 text-blue-700" />
          <StatCard label="Ricariche"   value={`${ricaricheCount}`}
            icon={<Wind className="w-4 h-4 text-cyan-500" />} color="bg-cyan-50 text-cyan-700" />
          <StatCard label="Iscritto dal" value={socio.created_at ? format(new Date(socio.created_at), "MMM yyyy", { locale: it }) : "—"}
            icon={<Calendar className="w-4 h-4 text-purple-500" />} color="bg-purple-50 text-purple-700" />
        </div>
      )}

      {/* Tab panel */}
      {socio && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex border-b border-border overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                  activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === "dati"        && <TabDati socio={socio} />}
            {activeTab === "certificati" && <TabCertificati socioId={socio.id} />}
            {activeTab === "bombole"     && <TabBombole bombole={bombole} />}
            {activeTab === "noleggio"    && <TabNoleggi socioId={socio.id} />}
          </div>
        </div>
      )}

      {!socio && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <User className="w-5 h-5" />
            <p className="text-sm">Nessun profilo socio associato a <strong>{user.email}</strong>. Chiedi all&apos;amministratore di collegare il tuo account.</p>
          </div>
        </div>
      )}

      {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}
      {showEditModal && socio && (
        <EditProfiloModal socio={socio} onClose={() => setShowEditModal(false)} onSaved={() => { setShowEditModal(false); router.refresh() }} />
      )}
    </div>
  )
}

// ── Tab: Dati ──────────────────────────────────────────────────────────────
function TabDati({ socio }: { socio: Socio }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Section title="Dati Anagrafici">
        <InfoRow icon={<User className="w-4 h-4" />}       label="Nome completo"    value={`${socio.Nome ?? ""} ${socio.Cognome ?? ""}`.trim()} />
        <InfoRow icon={<Mail className="w-4 h-4" />}       label="Email"            value={socio.email} />
        <InfoRow icon={<Phone className="w-4 h-4" />}      label="Telefono"         value={socio.Telefono} />
        <InfoRow icon={<Calendar className="w-4 h-4" />}   label="Data di nascita"
          value={socio["Data di Nascita"] ? format(new Date(socio["Data di Nascita"]), "dd MMMM yyyy", { locale: it }) : null} />
        <InfoRow icon={<MapPin className="w-4 h-4" />}     label="Luogo di nascita" value={socio["Luogo di nascita"]} />
        <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Codice Fiscale"   value={socio.CF} />
        <InfoRow icon={<Briefcase className="w-4 h-4" />}  label="Professione"      value={socio.Professione} />
      </Section>
      <Section title="Residenza">
        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Indirizzo" value={socio.Indirizzo} />
        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Comune"
          value={[socio.Comune, socio.CAP ? `(${socio.CAP})` : null].filter(Boolean).join(" ") || null} />
        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Provincia" value={socio.Provincia} />
        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Nazione"   value={socio.Nazione} />
      </Section>
      <Section title="Attività Sub">
        <InfoRow icon={<Award className="w-4 h-4" />} label="Brevetto"         value={socio.UT_Brevetti?.Nome} />
        {socio.UT_Brevetti?.Didattica && <InfoRow icon={<Award className="w-4 h-4" />} label="Didattica" value={socio.UT_Brevetti.Didattica} />}
        <InfoRow icon={<Award className="w-4 h-4" />} label="Specializzazione" value={socio.Specializzazione} />
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge active={socio["Addetto Ricarica"]} label="Addetto Ricarica" icon={<Wind className="w-3 h-3" />} />
          <Badge active={socio.FIN}                 label="Tesserato FIN"    icon={<Anchor className="w-3 h-3" />} />
          <Badge active={socio["Patente Nautica"]}  label="Patente Nautica"  icon={<Shield className="w-3 h-3" />} />
          <Badge active={socio.Assicurazione}       label="Assicurazione"    icon={<Shield className="w-3 h-3" />} />
        </div>
      </Section>
      {(socio["Nota FIN"] || socio["Nota Patente"] || socio["Tipo Assicurazione"]) && (
        <Section title="Note & Extra">
          <InfoRow icon={<Anchor className="w-4 h-4" />} label="Tipo Assicurazione" value={socio["Tipo Assicurazione"]} />
          <InfoRow icon={<Anchor className="w-4 h-4" />} label="Nota FIN"           value={socio["Nota FIN"]} />
          <InfoRow icon={<Shield className="w-4 h-4" />} label="Nota Patente"       value={socio["Nota Patente"]} />
        </Section>
      )}
    </div>
  )
}

// ── Tab: Certificati ───────────────────────────────────────────────────────
type Certificato = {
  id: number; created_at: string; socio: number | null
  "Attività subacquea": boolean | null; "Data visita": string
  "Data scadenza": string | null; PDF: string | null
}
const CERT_BUCKET = "Certificati"

function TabCertificati({ socioId }: { socioId: number }) {
  const supabase = createClient()
  const [certificati, setCertificati] = useState<Certificato[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ "Data visita": "", "Data scadenza": "", "Attività subacquea": false, pdfFile: null as File | null })

  useEffect(() => { loadCertificati() }, []) // eslint-disable-line

  async function loadCertificati() {
    setLoading(true)
    const { data } = await supabase.from("BP_certificati").select("*").eq("socio", socioId).order("Data visita", { ascending: false })
    setCertificati((data ?? []) as Certificato[])
    setLoading(false)
  }

  function handleDataVisitaChange(val: string) {
    let scadenza = ""
    if (val) { const d = new Date(val); d.setFullYear(d.getFullYear() + 1); scadenza = d.toISOString().split("T")[0] }
    setForm(f => ({ ...f, "Data visita": val, "Data scadenza": scadenza }))
  }

  async function handleSubmit() {
    if (!form["Data visita"]) { setError("La data di visita è obbligatoria"); return }
    setUploading(true); setError(null)
    let pdfPath: string | null = null
    if (form.pdfFile) {
      const ext = form.pdfFile.name.split(".").pop()?.toLowerCase() ?? "pdf"
      const fileName = `${socioId}_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from(CERT_BUCKET).upload(fileName, form.pdfFile, { upsert: false, contentType: "application/pdf" })
      if (uploadErr) { setError(`Errore upload PDF: ${uploadErr.message}`); setUploading(false); return }
      pdfPath = fileName
    }
    const { error: dbErr } = await supabase.from("BP_certificati").insert({
      socio: socioId, "Data visita": form["Data visita"],
      "Data scadenza": form["Data scadenza"] || null,
      "Attività subacquea": form["Attività subacquea"], PDF: pdfPath
    })
    if (dbErr) { setError(`Errore salvataggio: ${dbErr.message}`); setUploading(false); return }
    setForm({ "Data visita": "", "Data scadenza": "", "Attività subacquea": false, pdfFile: null })
    setShowForm(false); setUploading(false); loadCertificati()
  }

  async function handleDelete(cert: Certificato) {
    setDeleting(cert.id)
    if (cert.PDF) await supabase.storage.from(CERT_BUCKET).remove([cert.PDF])
    await supabase.from("BP_certificati").delete().eq("id", cert.id)
    setDeleting(null); loadCertificati()
  }

  function isScaduto(s: string | null) { return s ? new Date(s) < new Date() : false }
  function inScadenzaPresto(s: string | null) { return s && !isScaduto(s) && (new Date(s).getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000 }
  function formatDate(d: string | null) { return d ? new Date(d).toLocaleDateString("it-IT") : "—" }

  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{certificati.length} certificat{certificati.length === 1 ? "o" : "i"}</p>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 text-xs ocean-gradient text-white px-3 py-1.5 rounded-xl font-medium hover:opacity-90 transition-all">
          <Upload className="w-3.5 h-3.5" /> {showForm ? "Annulla" : "Aggiungi"}
        </button>
      </div>

      {showForm && (
        <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
          <Field label="Data visita *" value={form["Data visita"]} onChange={handleDataVisitaChange} type="date" />
          <Field label="Data scadenza" value={form["Data scadenza"]} onChange={v => setForm(f => ({...f, "Data scadenza": v}))} type="date" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form["Attività subacquea"]} onChange={e => setForm(f => ({...f, "Attività subacquea": e.target.checked}))} className="w-4 h-4 rounded" />
            Idoneità attività subacquea
          </label>
          <div>
            <label className="block text-sm font-medium mb-1.5">PDF (opzionale)</label>
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-3 cursor-pointer hover:border-primary/40 transition-all bg-white text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 shrink-0" />
              {form.pdfFile ? form.pdfFile.name : "Clicca per selezionare un PDF"}
            </div>
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) setForm(prev => ({...prev, pdfFile: f})) }} />
          </div>
          {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
          <button onClick={handleSubmit} disabled={uploading}
            className="w-full ocean-gradient text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? "Salvo..." : "Salva Certificato"}
          </button>
        </div>
      )}

      {certificati.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
          <FileText className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium text-foreground">Nessun certificato</p>
          <p className="text-xs mt-1">Aggiungi il tuo certificato medico</p>
        </div>
      ) : (
        <div className="space-y-2">
          {certificati.map(cert => (
            <CertRow key={cert.id} cert={cert} onDelete={handleDelete} deleting={deleting === cert.id}
              isScaduto={isScaduto(cert["Data scadenza"])}
              inScadenza={!!inScadenzaPresto(cert["Data scadenza"])}
              formatDate={formatDate} />
          ))}
        </div>
      )}
    </div>
  )
}

function CertRow({ cert, onDelete, deleting, isScaduto, inScadenza, formatDate }: {
  cert: Certificato; onDelete: (c: Certificato) => void; deleting: boolean
  isScaduto: boolean; inScadenza: boolean; formatDate: (d: string | null) => string
}) {
  const supabase = createClient()
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!cert.PDF) return
    supabase.storage.from("Certificati").createSignedUrl(cert.PDF, 3600)
      .then(({ data }) => { if (data?.signedUrl) setPdfUrl(data.signedUrl) })
  }, [cert.PDF]) // eslint-disable-line
  return (
    <div className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 ${
      isScaduto ? "bg-red-50 border-red-200" : inScadenza ? "bg-amber-50 border-amber-200" : "bg-white border-border"
    }`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium">Visita: {formatDate(cert["Data visita"])}</p>
          {isScaduto
            ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Scaduto</span>
            : inScadenza
              ? <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">In scadenza</span>
              : <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Valido</span>
          }
          {cert["Attività subacquea"] && <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full font-medium">Subacquea</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Scadenza: {formatDate(cert["Data scadenza"])}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-secondary transition-all text-muted-foreground hover:text-primary" title="Apri PDF">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <button onClick={() => onDelete(cert)} disabled={deleting}
          className="p-1.5 rounded-lg hover:bg-red-100 transition-all text-muted-foreground hover:text-red-500 disabled:opacity-50">
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

// ── Tab: Bombole ───────────────────────────────────────────────────────────
function TabBombole({ bombole }: { bombole: Bombola[] }) {
  const fotoUrls = useSignedUrls("Bombole", bombole.map(b => b.Foto))

  if (bombole.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center text-muted-foreground">
        <div className="w-16 h-16 rounded-2xl ocean-gradient flex items-center justify-center text-white mb-4 opacity-60">
          <Package className="w-8 h-8" />
        </div>
        <p className="text-base font-semibold text-foreground mb-1">Nessuna bombola</p>
        <p className="text-sm max-w-xs">Non hai ancora bombole registrate a tuo nome.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bombole.map(b => {
        const fotoUrl = b.Foto ? fotoUrls.get(b.Foto) : null
        const daRevisionare = (() => {
          if (!b["Ultima Revisione"] || b.Dismessa) return false
          const rev = new Date(b["Ultima Revisione"])
          const anni2 = new Date(); anni2.setFullYear(anni2.getFullYear() - 2)
          return rev < anni2
        })()
        return (
          <div key={b.id} className={`flex gap-3 p-3.5 rounded-xl border ${b.Dismessa ? "opacity-50 bg-secondary/30 border-border" : daRevisionare ? "bg-amber-50 border-amber-200" : "bg-white border-border"}`}>
            {fotoUrl
              ? <img src={fotoUrl} alt="" className="w-14 h-14 rounded-xl object-cover border border-border shrink-0" />
              : <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center shrink-0"><Package className="w-6 h-6 text-muted-foreground" /></div>
            }
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{b.Etichetta ?? b.Matricola}</p>
                {b.Dismessa && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Dismessa</span>}
                {daRevisionare && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Da revisionare</span>}
                {b["Stato Revisione"] && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{b["Stato Revisione"]}</span>}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                <span>{b.Volume}{b.Materiale ? ` · ${b.Materiale}` : ""}</span>
                {b.Marca && <span>{b.Marca}</span>}
                {b.Attacco && <span>Attacco: {b.Attacco}</span>}
                {b["Ultima Revisione"] && (
                  <span className={daRevisionare ? "text-amber-600 font-medium" : ""}>
                    Revisione: {new Date(b["Ultima Revisione"]).toLocaleDateString("it-IT")}
                  </span>
                )}
              </div>
              {b.Nota && <p className="text-xs text-muted-foreground mt-1 italic">{b.Nota}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Tab: Noleggi ───────────────────────────────────────────────────────────
type NoleggioItem = {
  id: number
  "Data Inizio": string
  "Data Fine Prevista": string
  "Data Restituzione": string | null
  "Stato": string
  "Note": string | null
}
type NoleggioDettaglioItem = {
  id: number
  "Noleggio": number
  "Quantità": number
  AT_Inventario?: { id: number; Nome: string | null; Categoria: string | null } | null
}

function TabNoleggi({ socioId }: { socioId: number }) {
  const supabase = createClient()
  const [noleggi, setNoleggi] = useState<NoleggioItem[]>([])
  const [dettagli, setDettagli] = useState<NoleggioDettaglioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => { loadNoleggi() }, []) // eslint-disable-line

  async function loadNoleggi() {
    setLoading(true)
    // Usa * per evitare problemi di escaping con colonne quotate in Supabase
    const { data: nData, error: nErr } = await supabase
      .from("AT_Noleggi")
      .select("*")
      .eq("Socio", socioId)
      .order("created_at", { ascending: false })

    if (nErr) console.error("Errore caricamento noleggi:", nErr)

    const noleggioIds = (nData ?? []).map((n: any) => n.id)
    let dData: NoleggioDettaglioItem[] = []
    if (noleggioIds.length > 0) {
      const { data, error: dErr } = await supabase
        .from("AT_Noleggi_Dettaglio")
        .select("*, AT_Inventario(id, Nome, Categoria)")
        .in("Noleggio", noleggioIds)
      if (dErr) console.error("Errore caricamento dettagli:", dErr)
      dData = (data ?? []) as NoleggioDettaglioItem[]
    }

    setNoleggi((nData ?? []) as NoleggioItem[])
    setDettagli(dData)
    setLoading(false)
  }

  function formatDate(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  function getStatoBadge(stato: string) {
    switch (stato) {
      case "Attivo":     return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Attivo</span>
      case "Completato": return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">Completato</span>
      case "Scaduto":    return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Scaduto</span>
      default:           return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700">{stato}</span>
    }
  }

  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>

  if (noleggi.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center text-muted-foreground">
        <div className="w-16 h-16 rounded-2xl ocean-gradient flex items-center justify-center text-white mb-4 opacity-60">
          <Wrench className="w-8 h-8" />
        </div>
        <p className="text-base font-semibold text-foreground mb-1">Nessun noleggio</p>
        <p className="text-sm max-w-xs">Non hai ancora effettuato noleggi di attrezzatura.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{noleggi.length} noleggi totali</p>
      {noleggi.map(n => {
        const nDettagli = dettagli.filter(d => d["Noleggio"] === n.id)
        const isOpen = expanded === n.id
        return (
          <div key={n.id} className={`rounded-xl border overflow-hidden transition-all ${
            n["Stato"] === "Attivo" ? "border-blue-200 bg-blue-50/50" :
            n["Stato"] === "Scaduto" ? "border-red-200 bg-red-50/50" :
            "border-border bg-white"
          }`}>
            {/* Header riga */}
            <button
              onClick={() => setExpanded(isOpen ? null : n.id)}
              className="w-full flex items-center justify-between gap-3 p-3.5 text-left hover:bg-black/5 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{formatDate(n["Data Inizio"])} → {formatDate(n["Data Fine Prevista"])}</span>
                    {getStatoBadge(n["Stato"])}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {nDettagli.length} {nDettagli.length === 1 ? "materiale" : "materiali"}
                    {n["Data Restituzione"] ? ` · Restituito: ${formatDate(n["Data Restituzione"])}` : ""}
                  </p>
                </div>
              </div>
              <span className="text-muted-foreground shrink-0 text-xs">{isOpen ? "▲" : "▼"}</span>
            </button>

            {/* Dettaglio espandibile */}
            {isOpen && (
              <div className="px-3.5 pb-3.5 space-y-2 border-t border-border/50 pt-3">
                {nDettagli.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nessun materiale registrato.</p>
                ) : (
                  nDettagli.map(d => (
                    <div key={d.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-border">
                      <div>
                        <p className="text-sm font-medium">{d.AT_Inventario?.Nome ?? "—"}</p>
                        {d.AT_Inventario?.Categoria && (
                          <p className="text-xs text-muted-foreground">{d.AT_Inventario.Categoria}</p>
                        )}
                      </div>
                      <span className="text-xs font-medium bg-secondary px-2 py-0.5 rounded-full">x{d["Quantità"]}</span>
                    </div>
                  ))
                )}
                {n["Note"] && (
                  <p className="text-xs text-muted-foreground italic px-1">Note: {n["Note"]}</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-secondary/30 rounded-2xl border border-border p-5 space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
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
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
      active ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-muted-foreground line-through"
    }`}>
      {icon} {label}
    </span>
  )
}
function Field({ label, value, onChange, type = "text", disabled = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className={`w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${disabled ? "bg-secondary text-muted-foreground cursor-not-allowed" : ""}`} />
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
function CheckField({ label, value, onChange, icon }: {
  label: string; value: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode
}) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all w-full ${
        value ? "border-primary bg-primary/5 text-primary" : "border-border bg-white text-muted-foreground hover:bg-secondary"
      }`}>
      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${value ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
        {value && <CheckCircle className="w-3 h-3 text-white" />}
      </span>
      {icon && <span className="opacity-60">{icon}</span>}
      {label}
    </button>
  )
}

// ── Password Modal ─────────────────────────────────────────────────────────
function PasswordModal({ onClose }: { onClose: () => void }) {
  const supabase = createClient(); const router = useRouter()
  const [newPassword, setNewPassword] = useState(""); const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null); const [success, setSuccess] = useState(false)
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
        <div className="p-6 border-b border-border"><h2 className="text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Cambia password</h2></div>
        <div className="p-6 space-y-4">
          {success ? (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl"><CheckCircle className="w-5 h-5" /><span className="text-sm font-medium">Password aggiornata!</span></div>
          ) : (
            <>
              <Field label="Nuova password"    value={newPassword} onChange={setNewPassword} type="password" />
              <Field label="Conferma password" value={confirm}     onChange={setConfirm}     type="password" />
              {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
            </>
          )}
        </div>
        {!success && (
          <div className="p-6 border-t border-border flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">Annulla</button>
            <button onClick={handleSave} disabled={saving} className="ocean-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? "Salvo..." : "Aggiorna"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Edit Profilo Modal ─────────────────────────────────────────────────────
function EditProfiloModal({ socio, onClose, onSaved }: { socio: Socio; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient()
  const [form, setForm] = useState({
    Nome: socio.Nome ?? "", Cognome: socio.Cognome ?? "", Telefono: socio.Telefono ?? "",
    "Data di Nascita": socio["Data di Nascita"] ?? "", "Luogo di nascita": socio["Luogo di nascita"] ?? "",
    Indirizzo: socio.Indirizzo ?? "", CAP: socio.CAP ?? "", Comune: socio.Comune ?? "",
    Provincia: socio.Provincia ?? "", Nazione: socio.Nazione ?? "Italia", CF: socio.CF ?? "",
    Professione: socio.Professione ?? "", Specializzazione: socio.Specializzazione ?? "",
    "Tipo Assicurazione": socio["Tipo Assicurazione"] ?? "", "Nota FIN": socio["Nota FIN"] ?? "",
    "Nota Patente": socio["Nota Patente"] ?? "",
    FIN: socio.FIN ?? false, Assicurazione: socio.Assicurazione ?? false,
    "Addetto Ricarica": socio["Addetto Ricarica"] ?? false, "Patente Nautica": socio["Patente Nautica"] ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.Nome || !form.Cognome) { setError("Nome e Cognome sono obbligatori"); return }
    setSaving(true); setError(null)
    const { error: err } = await supabase.from("BP_soci").update({
      Nome: form.Nome, Cognome: form.Cognome, Telefono: form.Telefono || null,
      "Data di Nascita": form["Data di Nascita"] || null, "Luogo di nascita": form["Luogo di nascita"] || null,
      Indirizzo: form.Indirizzo || null, CAP: form.CAP || null, Comune: form.Comune || null,
      Provincia: form.Provincia || null, Nazione: form.Nazione || null, CF: form.CF || null,
      Professione: form.Professione || null, Specializzazione: form.Specializzazione || null,
      "Tipo Assicurazione": form["Tipo Assicurazione"] || null, "Nota FIN": form["Nota FIN"] || null,
      "Nota Patente": form["Nota Patente"] || null,
      FIN: form.FIN, Assicurazione: form.Assicurazione,
      "Addetto Ricarica": form["Addetto Ricarica"], "Patente Nautica": form["Patente Nautica"],
    }).eq("id", socio.id)
    if (err) { setError(err.message); setSaving(false) } else { onSaved() }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col mt-4 mb-4">
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold">Modifica Profilo</h2>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[calc(100vh-200px)]">
          <Section title="Dati Anagrafici">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome *" value={form.Nome} onChange={v => set("Nome", v)} />
              <Field label="Cognome *" value={form.Cognome} onChange={v => set("Cognome", v)} />
            </div>
            <Field label="Telefono" value={form.Telefono} onChange={v => set("Telefono", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data di Nascita" value={form["Data di Nascita"]} onChange={v => set("Data di Nascita", v)} type="date" />
              <Field label="Luogo di nascita" value={form["Luogo di nascita"]} onChange={v => set("Luogo di nascita", v)} />
            </div>
            <Field label="Codice Fiscale" value={form.CF} onChange={v => set("CF", v)} />
            <Field label="Professione" value={form.Professione} onChange={v => set("Professione", v)} />
          </Section>
          <Section title="Residenza">
            <Field label="Indirizzo" value={form.Indirizzo} onChange={v => set("Indirizzo", v)} />
            <div className="grid grid-cols-3 gap-3">
              <Field label="CAP" value={form.CAP} onChange={v => set("CAP", v)} />
              <div className="col-span-2"><Field label="Comune" value={form.Comune} onChange={v => set("Comune", v)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Provincia" value={form.Provincia} onChange={v => set("Provincia", v)} />
              <Field label="Nazione" value={form.Nazione} onChange={v => set("Nazione", v)} />
            </div>
          </Section>
          <Section title="Attività Sub">
            <Field label="Specializzazione" value={form.Specializzazione} onChange={v => set("Specializzazione", v)} />
            <div className="grid grid-cols-2 gap-2">
              <CheckField label="Addetto Ricarica" value={form["Addetto Ricarica"]} onChange={v => set("Addetto Ricarica", v)} icon={<Wind className="w-3.5 h-3.5" />} />
              <CheckField label="Tesserato FIN"    value={form.FIN}                 onChange={v => set("FIN", v)}                icon={<Anchor className="w-3.5 h-3.5" />} />
              <CheckField label="Patente Nautica"  value={form["Patente Nautica"]}  onChange={v => set("Patente Nautica", v)}   icon={<Shield className="w-3.5 h-3.5" />} />
              <CheckField label="Assicurazione"    value={form.Assicurazione}       onChange={v => set("Assicurazione", v)}     icon={<Shield className="w-3.5 h-3.5" />} />
            </div>
          </Section>
          <Section title="Note & Extra">
            <TextareaField label="Nota FIN"             value={form["Nota FIN"]}    onChange={v => set("Nota FIN", v)} />
            <TextareaField label="Nota Patente Nautica" value={form["Nota Patente"]} onChange={v => set("Nota Patente", v)} />
          </Section>
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="p-6 border-t border-border flex gap-3 justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">Annulla</button>
          <button onClick={handleSave} disabled={saving} className="ocean-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? "Salvo..." : "Aggiorna Profilo"}
          </button>
        </div>
      </div>
    </div>
  )
}
