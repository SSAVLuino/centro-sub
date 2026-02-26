"use client"

import { useState, useEffect } from "react"
import { Search, Plus, CheckCircle, XCircle, Shield, Anchor, Wind, Pencil, Trash2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { canAccess } from "@/lib/roles-client"
import type { UserRole } from "@/lib/roles-client"
import { useRouter } from "next/navigation"

const AVATAR_BASE_URL = process.env.NEXT_PUBLIC_AVATAR_BASE_URL ?? ""

type Socio = any
type Brevetto = { id: number; Nome: string | null }
type TipoSocio = { id: number; Descrizione: string | null }

const emptyForm = {
  Nome: "", Cognome: "", email: "", Telefono: "",
  "Data di Nascita": "", "Luogo di nascita": "",
  Indirizzo: "", CAP: "", Comune: "", Provincia: "", Nazione: "Italia",
  CF: "", Professione: "", Brevetto: "", "Tipo Socio New": "",
  Specializzazione: "", "Tipo Assicurazione": "", "Nota FIN": "", "Nota Patente": "",
  Attivo: true, "Addetto Ricarica": false, Assicurazione: false,
  FIN: false, "Patente Nautica": false,
}

export default function SociClient({ soci, brevetti, tipiSocio, userRole }: {
  soci: Socio[]; brevetti: Brevetto[]; tipiSocio: TipoSocio[]; userRole: UserRole
}) {
  const [search, setSearch] = useState("")
  const [filterAttivo, setFilterAttivo] = useState<"all" | "true" | "false">("all")
  const [showModal, setShowModal] = useState(false)
  const [editSocio, setEditSocio] = useState<Socio | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Socio | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const filtered = soci.filter((s) => {
    const q = search.toLowerCase()
    const matchSearch = !q || `${s.Nome} ${s.Cognome}`.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    const matchAttivo = filterAttivo === "all" || (filterAttivo === "true" && s.Attivo) || (filterAttivo === "false" && !s.Attivo)
    return matchSearch && matchAttivo
  })

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    await supabase.from("BP_soci").delete().eq("id", confirmDelete.id)
    setConfirmDelete(null)
    setDeleting(false)
    router.refresh()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Soci</h1>
          <p className="text-muted-foreground mt-1">{soci.length} soci totali</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="ocean-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> Nuovo Socio
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per nome o email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
        </div>
        <div className="flex gap-2">
          {(["all", "true", "false"] as const).map((v) => (
            <button key={v} onClick={() => setFilterAttivo(v)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterAttivo === v ? "ocean-gradient text-white shadow-sm" : "bg-white border border-border text-muted-foreground hover:bg-secondary"}`}>
              {v === "all" ? "Tutti" : v === "true" ? "Attivi" : "Inattivi"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Socio</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Contatti</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Brevetto</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Tipo</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Stato</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Badge</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Nessun socio trovato.</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full ocean-gradient flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                        {s.Avatar
                          ? <img src={`${AVATAR_BASE_URL}${s.Avatar}`} alt="" className="w-full h-full object-cover" />
                          : <>{s.Nome?.[0] ?? "?"}{s.Cognome?.[0] ?? ""}</> }
                      </div>
                      <div>
                        <p className="font-medium">{s.Nome} {s.Cognome}</p>
                        <p className="text-xs text-muted-foreground">#{s.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    <p>{s.email ?? "—"}</p>
                    <p className="text-xs">{s.Telefono ?? ""}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    {s.UT_Brevetti?.Nome
                      ? <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">{s.UT_Brevetti.Nome}</span>
                      : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-muted-foreground">{s.UT_TipoSocio?.Descrizione ?? "—"}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {s.Attivo
                      ? <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium"><CheckCircle className="w-3 h-3" /> Attivo</span>
                      : <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-medium"><XCircle className="w-3 h-3" /> Inattivo</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      {s["Addetto Ricarica"] && <span title="Addetto Ricarica"><Wind className="w-4 h-4 text-cyan-500" /></span>}
                      {s.Assicurazione && <span title="Assicurazione"><Shield className="w-4 h-4 text-emerald-500" /></span>}
                      {s.FIN && <span title="Tesserato FIN"><Anchor className="w-4 h-4 text-blue-500" /></span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {canAccess("Consiglio", userRole) && (
                        <button onClick={() => setEditSocio(s)}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all font-medium">
                          <Pencil className="w-3 h-3" /> Modifica
                        </button>
                      )}
                      {canAccess("Admin", userRole) && (
                        <button onClick={() => setConfirmDelete(s)}
                          className="inline-flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-all font-medium">
                          <Trash2 className="w-3 h-3" /> Elimina
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Conferma eliminazione</h2>
            <p className="text-sm text-muted-foreground">
              Sei sicuro di voler eliminare <strong>{confirmDelete.Nome} {confirmDelete.Cognome}</strong>? L&apos;operazione è irreversibile.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">
                Annulla
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="bg-destructive text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? "Elimino..." : "Elimina"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <SocioModal mode="add" brevetti={brevetti} tipiSocio={tipiSocio}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); router.refresh() }} />
      )}
      {editSocio && (
        <SocioModal mode="edit" socio={editSocio} brevetti={brevetti} tipiSocio={tipiSocio}
          onClose={() => setEditSocio(null)}
          onSaved={() => { setEditSocio(null); router.refresh() }} />
      )}
    </div>
  )
}

function SocioModal({ mode, socio, brevetti, tipiSocio, onClose, onSaved }: {
  mode: "add" | "edit"; socio?: Socio; brevetti: Brevetto[]; tipiSocio: TipoSocio[];
  onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState(emptyForm)
  const [tab, setTab] = useState<"anagrafica" | "sub" | "note">("anagrafica")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mode === "edit" && socio) {
      // Carica TUTTI i campi dal database
      setForm({
        Nome: socio.Nome ?? "",
        Cognome: socio.Cognome ?? "",
        email: socio.email ?? "",
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
        Brevetto: socio.Brevetto ?? "",
        "Tipo Socio New": socio["Tipo Socio New"] ?? "",
        Specializzazione: socio.Specializzazione ?? "",
        "Tipo Assicurazione": socio["Tipo Assicurazione"] ?? "",
        "Nota FIN": socio["Nota FIN"] ?? "",
        "Nota Patente": socio["Nota Patente"] ?? "",
        Attivo: socio.Attivo ?? true,
        "Addetto Ricarica": socio["Addetto Ricarica"] ?? false,
        Assicurazione: socio.Assicurazione ?? false,
        FIN: socio.FIN ?? false,
        "Patente Nautica": socio["Patente Nautica"] ?? false,
      })
    } else {
      setForm(emptyForm)
    }
    setError("")
    setTab("anagrafica")
  }, [mode, socio])

  const set = (key: keyof typeof form, value: any) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const supabase = createClient()

  const handleSave = async () => {
    if (!form.Nome?.trim() || !form.Cognome?.trim()) {
      setError("Nome e Cognome sono obbligatori")
      return
    }
    setSaving(true)
    const payload = {
      Nome: form.Nome,
      Cognome: form.Cognome,
      email: form.email,
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
      Brevetto: form.Brevetto,
      "Tipo Socio New": form["Tipo Socio New"],
      Specializzazione: form.Specializzazione,
      "Tipo Assicurazione": form["Tipo Assicurazione"],
      "Nota FIN": form["Nota FIN"],
      "Nota Patente": form["Nota Patente"],
      Attivo: form.Attivo,
      "Addetto Ricarica": form["Addetto Ricarica"],
      Assicurazione: form.Assicurazione,
      FIN: form.FIN,
      "Patente Nautica": form["Patente Nautica"],
    }
    const { error } = mode === "add"
      ? await supabase.from("BP_soci").insert([payload])
      : await supabase.from("BP_soci").update(payload).eq("id", socio!.id)
    if (error) { setError(error.message); setSaving(false) }
    else onSaved()
  }

  const tabs = [
    { key: "anagrafica" as const, label: "Anagrafica" },
    { key: "sub" as const, label: "Sub & Brevetti" },
    { key: "note" as const, label: "Note & Extra" },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col mt-4 mb-4 max-h-[calc(100vh-32px)]">
        <div className="p-6 border-b border-border shrink-0">
          <h2 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
            {mode === "add" ? "Nuovo Socio" : `Modifica — ${socio?.Nome} ${socio?.Cognome}`}
          </h2>
          <div className="flex gap-1 mt-4">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "ocean-gradient text-white" : "text-muted-foreground hover:bg-secondary"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {tab === "anagrafica" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome *" value={form.Nome} onChange={v => set("Nome", v)} />
                <Field label="Cognome *" value={form.Cognome} onChange={v => set("Cognome", v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email" value={form.email} onChange={v => set("email", v)} type="email" />
                <Field label="Telefono" value={form.Telefono} onChange={v => set("Telefono", v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Data di Nascita" value={form["Data di Nascita"]} onChange={v => set("Data di Nascita", v)} type="date" />
                <Field label="Luogo di Nascita" value={form["Luogo di nascita"]} onChange={v => set("Luogo di nascita", v)} />
              </div>
              <Field label="Codice Fiscale" value={form.CF} onChange={v => set("CF", v)} />
              <Field label="Indirizzo" value={form.Indirizzo} onChange={v => set("Indirizzo", v)} />
              <div className="grid grid-cols-3 gap-3">
                <Field label="CAP" value={form.CAP} onChange={v => set("CAP", v)} />
                <Field label="Comune" value={form.Comune} onChange={v => set("Comune", v)} />
                <Field label="Provincia" value={form.Provincia} onChange={v => set("Provincia", v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nazione" value={form.Nazione} onChange={v => set("Nazione", v)} />
                <Field label="Professione" value={form.Professione} onChange={v => set("Professione", v)} />
              </div>
            </>
          )}

          {tab === "sub" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Brevetto</label>
                  <select value={form.Brevetto} onChange={e => set("Brevetto", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">— Nessuno —</option>
                    {brevetti.map(b => <option key={b.id} value={b.id}>{b.Nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tipo Socio</label>
                  <select value={form["Tipo Socio New"]} onChange={e => set("Tipo Socio New", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">— Seleziona —</option>
                    {tipiSocio.map(t => <option key={t.id} value={t.id}>{t.Descrizione}</option>)}
                  </select>
                </div>
              </div>
              <Field label="Specializzazione" value={form.Specializzazione} onChange={v => set("Specializzazione", v)} />
              <Field label="Tipo Assicurazione" value={form["Tipo Assicurazione"]} onChange={v => set("Tipo Assicurazione", v)} />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <CheckField label="Attivo" checked={form.Attivo} onChange={v => set("Attivo", v)} />
                <CheckField label="Addetto Ricarica" checked={form["Addetto Ricarica"]} onChange={v => set("Addetto Ricarica", v)} />
                <CheckField label="Assicurazione" checked={form.Assicurazione} onChange={v => set("Assicurazione", v)} />
                <CheckField label="Tesserato FIN" checked={form.FIN} onChange={v => set("FIN", v)} />
                <CheckField label="Patente Nautica" checked={form["Patente Nautica"]} onChange={v => set("Patente Nautica", v)} />
              </div>
            </>
          )}

          {tab === "note" && (
            <>
              <TextareaField label="Nota FIN" value={form["Nota FIN"]} onChange={v => set("Nota FIN", v)} />
              <TextareaField label="Nota Patente Nautica" value={form["Nota Patente"]} onChange={v => set("Nota Patente", v)} />
            </>
          )}

          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="p-6 border-t border-border flex gap-3 justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">
            Annulla
          </button>
          <button onClick={handleSave} disabled={saving}
            className="ocean-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
            {saving ? "Salvo..." : mode === "add" ? "Salva Socio" : "Aggiorna Socio"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
    </div>
  )
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
        className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all" />
    </div>
  )
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
      <span className="text-sm">{label}</span>
    </label>
  )
}
