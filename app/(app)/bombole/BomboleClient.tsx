"use client"

import { useState, useRef } from "react"
import {
  Plus, Search, Pencil, Trash2, Loader2, X, CheckCircle,
  Package, Camera, ExternalLink, AlertTriangle, Filter
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { canAccess } from "@/lib/roles-client"
import type { UserRole } from "@/lib/roles-client"
import { useRouter } from "next/navigation"
import { useSignedUrls, useSignedUrl } from "@/lib/useSignedUrl"

type Bombola = {
  id: number
  created_at: string
  Proprietario: number | null
  Matricola: string
  Codice: number | null
  Etichetta: string | null
  Volume: string
  Marca: string | null
  Attacco: string | null
  Rubinetto: string | null
  Nota: string | null
  Materiale: string | null
  Foto: string | null
  "Stato Revisione": string | null
  Dismessa: boolean | null
  "Ultima Revisione": string | null
}
type Socio = { id: number; Nome: string | null; Cognome: string | null }

const emptyForm = {
  Proprietario: "" as string,
  Matricola: "",
  Codice: "",
  Etichetta: "",
  Volume: "",
  Marca: "",
  Attacco: "",
  Rubinetto: "",
  Materiale: "",
  "Stato Revisione": "",
  "Ultima Revisione": "",
  Nota: "",
  Dismessa: false,
}

export default function BomboleClient({
  bombole, soci, userRole,
}: {
  bombole: Bombola[]; soci: Socio[]; userRole: UserRole
}) {
  const [search, setSearch]               = useState("")
  const [filterDismessa, setFilterDismessa] = useState<"tutte" | "attive" | "dismesse">("attive")
  const [showModal, setShowModal]         = useState(false)
  const [editBombola, setEditBombola]     = useState<Bombola | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Bombola | null>(null)
  const [deleting, setDeleting]           = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const sociMap = new Map(soci.map(s => [s.id, s]))

  // Signed URL per le foto delle bombole nella tabella
  const fotoUrls = useSignedUrls("Bombole", bombole.map(b => b.Foto))

  const filtered = bombole.filter(b => {
    const socio = b.Proprietario ? sociMap.get(b.Proprietario) : null
    const q = search.toLowerCase()
    const matchSearch = !q ||
      b.Matricola.toLowerCase().includes(q) ||
      (b.Etichetta ?? "").toLowerCase().includes(q) ||
      (b.Marca ?? "").toLowerCase().includes(q) ||
      (socio ? `${socio.Nome} ${socio.Cognome}`.toLowerCase().includes(q) : false)
    const matchDismessa =
      filterDismessa === "tutte" ||
      (filterDismessa === "attive"   && !b.Dismessa) ||
      (filterDismessa === "dismesse" && !!b.Dismessa)
    return matchSearch && matchDismessa
  })

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    if (confirmDelete.Foto) {
      await supabase.storage.from("Bombole").remove([confirmDelete.Foto])
    }
    await supabase.from("AT_Bombole").delete().eq("id", confirmDelete.id)
    setConfirmDelete(null)
    setDeleting(false)
    router.refresh()
  }

  const stats = {
    totale:   bombole.length,
    attive:   bombole.filter(b => !b.Dismessa).length,
    dismesse: bombole.filter(b => !!b.Dismessa).length,
    daRevisionare: bombole.filter(b => {
      if (!b["Ultima Revisione"] || b.Dismessa) return false
      const rev = new Date(b["Ultima Revisione"])
      const anni2 = new Date(); anni2.setFullYear(anni2.getFullYear() - 2)
      return rev < anni2
    }).length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bombole</h1>
          <p className="text-muted-foreground mt-1">Gestione inventario bombole del club</p>
        </div>
        {canAccess("Consiglio", userRole) && (
          <button
            onClick={() => { setEditBombola(null); setShowModal(true) }}
            className="ocean-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Nuova Bombola
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Totale"        value={stats.totale}       sub="bombole registrate"   color="from-blue-500 to-cyan-500"    icon={<Package className="w-4 h-4 text-white" />} />
        <StatCard label="Attive"        value={stats.attive}       sub="in uso"                color="from-emerald-500 to-green-500" icon={<CheckCircle className="w-4 h-4 text-white" />} />
        <StatCard label="Dismesse"      value={stats.dismesse}     sub="fuori uso"             color="from-gray-400 to-gray-500"    icon={<X className="w-4 h-4 text-white" />} />
        <StatCard label="Da revisionare" value={stats.daRevisionare} sub="revisione >2 anni"  color="from-amber-500 to-orange-500" icon={<AlertTriangle className="w-4 h-4 text-white" />} />
      </div>

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per matricola, etichetta, marca, proprietario..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(["attive", "tutte", "dismesse"] as const).map(f => (
            <button key={f} onClick={() => setFilterDismessa(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
                filterDismessa === f
                  ? "ocean-gradient text-white shadow-sm"
                  : "bg-white border border-border hover:bg-secondary text-muted-foreground"
              }`}>
              {f === "attive" ? "Attive" : f === "dismesse" ? "Dismesse" : "Tutte"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Bombola</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Proprietario</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Volume / Materiale</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Revisione</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Stato</th>
                {canAccess("Consiglio", userRole) && (
                  <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Azioni</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Nessuna bombola trovata.</td></tr>
              ) : filtered.map(b => {
                const socio = b.Proprietario ? sociMap.get(b.Proprietario) : null
                const daRevisionare = (() => {
                  if (!b["Ultima Revisione"] || b.Dismessa) return false
                  const rev = new Date(b["Ultima Revisione"])
                  const anni2 = new Date(); anni2.setFullYear(anni2.getFullYear() - 2)
                  return rev < anni2
                })()
                return (
                  <tr key={b.id} className={`hover:bg-secondary/30 transition-colors ${b.Dismessa ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {b.Foto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={fotoUrls.get(b.Foto) ?? ""} alt=""
                            className={`w-10 h-10 rounded-xl object-cover border border-border shrink-0 ${!fotoUrls.get(b.Foto) ? "opacity-0" : ""}`} />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{b.Etichetta ?? b.Matricola}</p>
                          <p className="text-xs text-muted-foreground">Mat: {b.Matricola}{b.Codice ? ` · Cod: ${b.Codice}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {socio
                        ? <span className="text-sm font-medium">{socio.Nome} {socio.Cognome}</span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium">{b.Volume}</p>
                      <p className="text-xs text-muted-foreground">{[b.Materiale, b.Marca].filter(Boolean).join(" · ") || "—"}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {b["Ultima Revisione"] ? (
                        <div>
                          <p className={`text-sm font-medium ${daRevisionare ? "text-amber-600" : "text-foreground"}`}>
                            {new Date(b["Ultima Revisione"]).toLocaleDateString("it-IT")}
                          </p>
                          {daRevisionare && <p className="text-xs text-amber-500">⚠ Scaduta</p>}
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {b.Dismessa
                        ? <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">Dismessa</span>
                        : <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium"><CheckCircle className="w-3 h-3" /> Attiva</span>}
                    </td>
                    {canAccess("Consiglio", userRole) && (
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditBombola(b); setShowModal(true) }}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-all font-medium">
                            <Pencil className="w-3 h-3" /> Modifica
                          </button>
                          {canAccess("Admin", userRole) && (
                            <button onClick={() => setConfirmDelete(b)}
                              className="inline-flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 px-2.5 py-1.5 rounded-lg transition-all font-medium">
                              <Trash2 className="w-3 h-3" /> Elimina
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border bg-secondary/30 text-xs text-muted-foreground">
            {filtered.length} bombole visualizzate
          </div>
        )}
      </div>

      {/* Modal aggiungi/modifica */}
      {showModal && (
        <BombolaModal
          bombola={editBombola}
          soci={soci}
          onClose={() => { setShowModal(false); setEditBombola(null) }}
          onSaved={() => { setShowModal(false); setEditBombola(null); router.refresh() }}
        />
      )}

      {/* Modal conferma elimina */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Conferma eliminazione</h2>
            <p className="text-sm text-muted-foreground">
              Sei sicuro di voler eliminare la bombola <strong>{confirmDelete.Etichetta ?? confirmDelete.Matricola}</strong>? L&apos;operazione è irreversibile.
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
    </div>
  )
}

// ── StatCard ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }: { label: string; value: number; sub: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  )
}

// ── Modal Aggiungi / Modifica ───────────────────────────────────────────────
function BombolaModal({
  bombola, soci, onClose, onSaved,
}: {
  bombola: Bombola | null; soci: Socio[]; onClose: () => void; onSaved: () => void
}) {
  const supabase = createClient()
  const [form, setForm] = useState({
    Proprietario:      bombola?.Proprietario?.toString() ?? "",
    Matricola:         bombola?.Matricola ?? "",
    Codice:            bombola?.Codice?.toString() ?? "",
    Etichetta:         bombola?.Etichetta ?? "",
    Volume:            bombola?.Volume ?? "",
    Marca:             bombola?.Marca ?? "",
    Attacco:           bombola?.Attacco ?? "",
    Rubinetto:         bombola?.Rubinetto ?? "",
    Materiale:         bombola?.Materiale ?? "",
    "Stato Revisione": bombola?.["Stato Revisione"] ?? "",
    "Ultima Revisione": bombola?.["Ultima Revisione"] ?? "",
    Nota:              bombola?.Nota ?? "",
    Dismessa:          bombola?.Dismessa ?? false,
  })
  const [fotoFile, setFotoFile]         = useState<File | null>(null)
  const [fotoLocalPreview, setFotoLocalPreview] = useState<string | null>(null)
  const existingSignedUrl = useSignedUrl(bombola?.Foto ? "Bombole" : null, bombola?.Foto ?? null)
  const fotoPreview = fotoLocalPreview ?? existingSignedUrl
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const fileInputRef    = useRef<HTMLInputElement>(null)
  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const [showFotoMenu, setShowFotoMenu] = useState(false)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { setError("Seleziona un file immagine"); return }
    if (file.size > 5 * 1024 * 1024) { setError("Immagine max 5MB"); return }
    setFotoFile(file)
    setFotoLocalPreview(URL.createObjectURL(file))
    setError(null)
  }

  async function handleSave() {
    if (!form.Matricola.trim()) { setError("La matricola è obbligatoria"); return }
    if (!form.Volume.trim())    { setError("Il volume è obbligatorio"); return }
    setSaving(true); setError(null)

    let fotoPath = bombola?.Foto ?? null

    // Upload nuova foto se selezionata
    if (fotoFile) {
      const ext = fotoFile.name.split(".").pop()?.toLowerCase() ?? "jpg"
      const prefix = form.Proprietario ? form.Proprietario : "club"
      const fileName = `${prefix}_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from("Bombole")
        .upload(fileName, fotoFile, { upsert: false, contentType: fotoFile.type })
      if (uploadErr) { setError(`Errore upload foto: ${uploadErr.message}`); setSaving(false); return }
      // Elimina vecchia foto se esistente
      if (bombola?.Foto) await supabase.storage.from("Bombole").remove([bombola.Foto])
      fotoPath = fileName
    }

    const payload = {
      Proprietario:      form.Proprietario ? Number(form.Proprietario) : null,
      Matricola:         form.Matricola,
      Codice:            form.Codice ? Number(form.Codice) : null,
      Etichetta:         form.Etichetta || null,
      Volume:            form.Volume,
      Marca:             form.Marca || null,
      Attacco:           form.Attacco || null,
      Rubinetto:         form.Rubinetto || null,
      Materiale:         form.Materiale || null,
      "Stato Revisione": form["Stato Revisione"] || null,
      "Ultima Revisione": form["Ultima Revisione"] || null,
      Nota:              form.Nota || null,
      Dismessa:          form.Dismessa,
      Foto:              fotoPath,
    }

    const { error: dbErr } = bombola
      ? await supabase.from("AT_Bombole").update(payload).eq("id", bombola.id)
      : await supabase.from("AT_Bombole").insert(payload)

    if (dbErr) { setError(dbErr.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col mt-4 mb-4">
        <div className="p-6 border-b border-border shrink-0 flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
            {bombola ? "Modifica Bombola" : "Nuova Bombola"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-all text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">

          {/* Foto */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Foto</label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  onClick={() => setShowFotoMenu(v => !v)}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-all overflow-hidden bg-secondary/30 flex items-center justify-center shrink-0"
                >
                  {fotoPreview
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={fotoPreview} alt="" className="w-full h-full object-cover" />
                    : <Camera className="w-8 h-8 text-muted-foreground" />}
                </div>
                {showFotoMenu && (
                  <div className="absolute z-20 mt-1 left-0 bg-white border border-border rounded-xl shadow-lg overflow-hidden w-48">
                    <button onClick={() => { setShowFotoMenu(false); cameraInputRef.current?.click() }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors flex items-center gap-2">
                      <Camera className="w-4 h-4 text-primary" /> Scatta foto
                    </button>
                    <button onClick={() => { setShowFotoMenu(false); fileInputRef.current?.click() }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors flex items-center gap-2">
                      <span className="text-base">🖼️</span> Scegli dalla galleria
                    </button>
                  </div>
                )}
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFotoChange} />
                <input ref={fileInputRef}   type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Tocca per aggiungere una foto</p>
                <p className="text-xs mt-0.5">JPG, PNG, WEBP · Max 5MB</p>
              </div>
            </div>
          </div>

          {/* Dati principali */}
          <ModalSection title="Dati Principali">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Matricola *" value={form.Matricola} onChange={v => set("Matricola", v)} />
              <Field label="Codice"      value={form.Codice}    onChange={v => set("Codice", v)} type="number" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Etichetta" value={form.Etichetta} onChange={v => set("Etichetta", v)} />
              <SelectField label="Volume *" value={form.Volume} onChange={v => set("Volume", v)} options={["1 L","3 L","5 L","7 L","8.5 L","10 L","12 L","15 L","18 L"]} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Proprietario</label>
              <select
                value={form.Proprietario}
                onChange={e => set("Proprietario", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                <option value="">— Nessuno / Club —</option>
                {soci.map(s => (
                  <option key={s.id} value={s.id}>{s.Cognome} {s.Nome}</option>
                ))}
              </select>
            </div>
          </ModalSection>

          {/* Caratteristiche */}
          <ModalSection title="Caratteristiche">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Marca"     value={form.Marca}     onChange={v => set("Marca", v)} />
              <SelectField label="Materiale" value={form.Materiale} onChange={v => set("Materiale", v)} options={["Acciaio","Alluminio"]} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Attacco" value={form.Attacco} onChange={v => set("Attacco", v)} options={["3/4 Gas","M25X2"]} />
              <SelectField label="Tipo Rubinetto" value={form.Rubinetto} onChange={v => set("Rubinetto", v)} options={["Mono Attacco","Bi Attacco","Bibo","Altro"]} />
            </div>
          </ModalSection>

          {/* Revisione */}
          <ModalSection title="Revisione">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ultima Revisione" value={form["Ultima Revisione"]} onChange={v => set("Ultima Revisione", v)} type="date" />
              <SelectField label="Stato Revisione" value={form["Stato Revisione"]} onChange={v => set("Stato Revisione", v)} options={["OK","Non Revisionata"]} />
            </div>
          </ModalSection>

          {/* Note e stato */}
          <ModalSection title="Note e Stato">
            <TextareaField label="Note" value={form.Nota} onChange={v => set("Nota", v)} />
            <CheckField label="Bombola dismessa" value={form.Dismessa} onChange={v => set("Dismessa", v)} />
          </ModalSection>

          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="p-6 border-t border-border flex gap-3 justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">
            Annulla
          </button>
          <button onClick={handleSave} disabled={saving}
            className="ocean-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Salvo..." : bombola ? "Aggiorna" : "Salva"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Form helpers ────────────────────────────────────────────────────────────
function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white transition-all">
        <option value="">— Seleziona —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
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
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
        className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all" />
    </div>
  )
}
function CheckField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all w-full ${value ? "border-primary bg-primary/5 text-primary" : "border-border bg-white text-muted-foreground hover:bg-secondary"}`}>
      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${value ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
        {value && <CheckCircle className="w-3 h-3 text-white" />}
      </span>
      {label}
    </button>
  )
}
