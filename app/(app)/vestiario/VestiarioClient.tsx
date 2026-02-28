"use client"

import { useState, useRef } from "react"
import { Plus, Search, Trash2, Loader2, X, Camera, Shirt } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { canAccess } from "@/lib/roles-client"
import type { UserRole } from "@/lib/roles-client"
import type { Vestiario } from "@/types/database"

const VESTIARIO_BASE_URL = process.env.NEXT_PUBLIC_VESTIARIO_BASE_URL ?? ""

interface Props {
  vestiario: Vestiario[]
  userRole: UserRole
}

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

function FotoThumb({ foto, desc }: { foto: string | null; desc: string }) {
  if (!foto) return (
    <div className="w-12 h-12 rounded-lg bg-secondary/30 flex items-center justify-center text-muted-foreground">
      <Shirt className="w-5 h-5" />
    </div>
  )
  return (
    <img
      src={`${VESTIARIO_BASE_URL}${foto}`}
      alt={desc}
      className="w-12 h-12 rounded-lg object-cover border border-border"
    />
  )
}

function FotoUploader({
  label, fotoPath, fotoFile, onFileChange,
}: {
  label: string; fotoPath: string | null; fotoFile: File | null; onFileChange: (f: File) => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileChange(file)
  }

  const previewSrc = fotoFile
    ? URL.createObjectURL(fotoFile)
    : fotoPath ? `${VESTIARIO_BASE_URL}${fotoPath}` : null

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      {previewSrc && (
        <img src={previewSrc} alt={label} className="w-full h-32 object-cover rounded-xl border border-border" />
      )}
      <div className="relative">
        <div onClick={() => setShowMenu(v => !v)}
          className="border-2 border-dashed border-border rounded-xl p-3 hover:border-primary/40 transition-all cursor-pointer bg-white flex items-center gap-2">
          <Camera className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground truncate">
            {fotoFile ? fotoFile.name : fotoPath ? "Foto caricata — clicca per cambiare" : "Aggiungi foto..."}
          </p>
        </div>
        {showMenu && (
          <div className="absolute z-20 mt-1 left-0 bg-white border border-border rounded-xl shadow-lg overflow-hidden w-48">
            <button onClick={() => { setShowMenu(false); cameraRef.current?.click() }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" /> Scatta foto
            </button>
            <button onClick={() => { setShowMenu(false); fileRef.current?.click() }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors flex items-center gap-2">
              <span className="text-base">🖼️</span> Scegli dalla galleria
            </button>
          </div>
        )}
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleChange} className="hidden" />
      <input ref={fileRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  )
}

function VestiarioModal({ item, onClose, onSaved }: {
  item: Vestiario | null; onClose: () => void; onSaved: (v: Vestiario) => void
}) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fotoFile1, setFotoFile1] = useState<File | null>(null)
  const [fotoFile2, setFotoFile2] = useState<File | null>(null)
  const [fotoFile3, setFotoFile3] = useState<File | null>(null)
  const [form, setForm] = useState({
    Descrizione: item?.["Descrizione"] ?? "",
    Qta: item?.["Qta"]?.toString() ?? "",
    Taglia: item?.["Taglia"] ?? "",
    Colore: item?.["Colore"] ?? "",
    Prezzo: item?.["Prezzo"]?.toString() ?? "",
    Note: item?.["Note"] ?? "",
    Attivo: item?.["Attivo"] ?? true,
  })

  async function uploadFoto(file: File, field: string, existingPath: string | null): Promise<string> {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    const fileName = `capo_${item?.id || Date.now()}_${field}_${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from("Vestiario").upload(fileName, file, { upsert: true, contentType: file.type })
    if (uploadErr) throw uploadErr
    if (existingPath && existingPath !== fileName)
      await supabase.storage.from("Vestiario").remove([existingPath])
    return fileName
  }

  async function handleSave() {
    if (!form.Descrizione.trim()) { setError("La descrizione è obbligatoria"); return }
    setSaving(true); setError(null)
    try {
      let fotoPath1 = item?.["Foto"] ?? null
      let fotoPath2 = item?.["Foto2"] ?? null
      let fotoPath3 = item?.["Foto3"] ?? null
      if (fotoFile1) fotoPath1 = await uploadFoto(fotoFile1, "Foto", fotoPath1)
      if (fotoFile2) fotoPath2 = await uploadFoto(fotoFile2, "Foto2", fotoPath2)
      if (fotoFile3) fotoPath3 = await uploadFoto(fotoFile3, "Foto3", fotoPath3)

      const payload = {
        Descrizione: form.Descrizione.trim(),
        Qta: form.Qta ? parseInt(form.Qta) : null,
        Taglia: form.Taglia || null,
        Colore: form.Colore || null,
        Prezzo: form.Prezzo ? parseFloat(form.Prezzo) : null,
        Note: form.Note || null,
        Foto: fotoPath1, Foto2: fotoPath2, Foto3: fotoPath3,
        Attivo: form.Attivo,
      }

      const { data: result, error: err } = item
        ? await supabase.from("UT_vestiario").update(payload).eq("id", item.id).select().single()
        : await supabase.from("UT_vestiario").insert([payload]).select().single()
      if (err) throw err
      onSaved(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto")
    } finally { setSaving(false) }
  }

  const field = "w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold">{item ? "Modifica Capo" : "Nuovo Capo"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-all"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Foto */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Foto</h3>
            <FotoUploader label="Foto principale" fotoPath={item?.["Foto"] ?? null} fotoFile={fotoFile1} onFileChange={setFotoFile1} />
            <div className="grid grid-cols-2 gap-3">
              <FotoUploader label="Foto 2" fotoPath={item?.["Foto2"] ?? null} fotoFile={fotoFile2} onFileChange={setFotoFile2} />
              <FotoUploader label="Foto 3" fotoPath={item?.["Foto3"] ?? null} fotoFile={fotoFile3} onFileChange={setFotoFile3} />
            </div>
          </div>

          {/* Dati */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informazioni</h3>
            <div>
              <label className="block text-sm font-medium mb-1.5">Descrizione *</label>
              <input type="text" value={form.Descrizione}
                onChange={e => setForm({ ...form, Descrizione: e.target.value })}
                placeholder="Es: T-shirt club, Felpa, Polo..." className={field} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Taglia</label>
                <select value={form.Taglia} onChange={e => setForm({ ...form, Taglia: e.target.value })} className={field}>
                  <option value="">— Seleziona —</option>
                  {["XS","S","M","L","XL","2XL","S 36","M 38","L 40","Unica"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Colore</label>
                <input type="text" value={form.Colore}
                  onChange={e => setForm({ ...form, Colore: e.target.value })}
                  placeholder="Es: Blu, Nero..." className={field} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Quantità</label>
                <div className="flex items-center gap-0 rounded-xl border border-border overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, Qta: String(Math.max(0, parseInt(form.Qta || "0") - 1)) })}
                    className="px-3 py-2.5 text-lg font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all select-none"
                  >−</button>
                  <input
                    type="number" min="0" value={form.Qta}
                    onChange={e => setForm({ ...form, Qta: e.target.value })}
                    className="flex-1 py-2.5 text-sm text-center focus:outline-none bg-white border-x border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, Qta: String(parseInt(form.Qta || "0") + 1) })}
                    className="px-3 py-2.5 text-lg font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all select-none"
                  >+</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Prezzo €</label>
                <input type="number" min="0" step="0.01" value={form.Prezzo}
                  onChange={e => setForm({ ...form, Prezzo: e.target.value })} className={field} />
              </div>
            </div>
            <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-white cursor-pointer hover:bg-secondary transition-all">
              <input type="checkbox" checked={form.Attivo}
                onChange={e => setForm({ ...form, Attivo: e.target.checked })} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium">Capo attivo (disponibile)</span>
            </label>
          </div>

          {/* Note */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note</h3>
            <textarea value={form.Note} onChange={e => setForm({ ...form, Note: e.target.value })}
              rows={3} placeholder="Note aggiuntive..." className={`${field} resize-none`} />
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="p-6 border-t border-border flex gap-3 justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">Annulla</button>
          <button onClick={handleSave} disabled={saving}
            className="ocean-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Salvo..." : item ? "Aggiorna" : "Salva"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VestiarioClient({ vestiario: initialVestiario, userRole }: Props) {
  const [vestiario, setVestiario] = useState<Vestiario[]>(initialVestiario)
  const [search, setSearch] = useState("")
  const [filterTaglia, setFilterTaglia] = useState("")
  const [filterAttivo, setFilterAttivo] = useState<"" | "attivo" | "non_attivo">("")
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Vestiario | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete(id: number) {
    setDeleting(id)
    const { error } = await supabase.from("UT_vestiario").delete().eq("id", id)
    if (!error) setVestiario(prev => prev.filter(v => v.id !== id))
    setDeleting(null)
    setConfirmDelete(null)
  }

  const filtered = vestiario.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q || v["Descrizione"].toLowerCase().includes(q) ||
      (v["Colore"] ?? "").toLowerCase().includes(q) || (v["Taglia"] ?? "").toLowerCase().includes(q)
    const matchTaglia = !filterTaglia || v["Taglia"] === filterTaglia
    const matchAttivo = filterAttivo === "" ? true : filterAttivo === "attivo" ? v["Attivo"] === true : v["Attivo"] !== true
    return matchSearch && matchTaglia && matchAttivo
  })

  const TAGLIA_ORDER = ["XS","S","M","L","XL","2XL","S 36","M 38","L 40","Unica"]
  const taglie = [...new Set(vestiario.map(v => v["Taglia"]).filter((t): t is string => !!t))]
    .sort((a, b) => TAGLIA_ORDER.indexOf(a) - TAGLIA_ORDER.indexOf(b))

  const stats = {
    totale: vestiario.length,
    attivi: vestiario.filter(v => v["Attivo"]).length,
    qtaTotale: vestiario.reduce((s, v) => s + (v["Qta"] ?? 0), 0),
    valoreTot: vestiario.reduce((s, v) => s + (v["Prezzo"] ?? 0) * (v["Qta"] ?? 0), 0),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vestiario</h1>
          <p className="text-muted-foreground mt-1">Abbigliamento sociale del club</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowModal(true) }}
          className="ocean-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> Nuovo Capo
        </button>
      </div>

      <div className={`grid gap-3 ${canAccess("Consiglio", userRole) ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
        <StatCard label="Modelli"      value={stats.totale}    color="from-blue-500 to-cyan-500" />
        <StatCard label="Attivi"       value={stats.attivi}    color="from-emerald-500 to-green-500" />
        <StatCard label="Pezzi Totali" value={stats.qtaTotale} color="from-violet-500 to-purple-500" />
        {canAccess("Consiglio", userRole) && (
          <StatCard label="Valore Stock" value={`€ ${stats.valoreTot.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="from-amber-500 to-orange-500" />
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per descrizione, taglia, colore..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
        </div>
        <select value={filterTaglia} onChange={e => setFilterTaglia(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
          <option value="">Tutte le taglie</option>
          {taglie.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterAttivo} onChange={e => setFilterAttivo(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
          <option value="">Tutti</option>
          <option value="attivo">Attivi</option>
          <option value="non_attivo">Non attivi</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Foto</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Descrizione</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Taglia</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Colore</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Qta</th>
                <th className="text-right px-5 py-3.5 font-semibold text-muted-foreground">Prezzo</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Stato</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-muted-foreground">
                    <Shirt className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    {search || filterTaglia || filterAttivo ? "Nessun risultato per i filtri applicati." : "Nessun capo nel vestiario."}
                  </td>
                </tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1">
                      <FotoThumb foto={item["Foto"]} desc={item["Descrizione"]} />
                      {item["Foto2"] && <img src={`${VESTIARIO_BASE_URL}${item["Foto2"]}`} alt="" className="w-12 h-12 rounded-lg object-cover border border-border" />}
                      {item["Foto3"] && <img src={`${VESTIARIO_BASE_URL}${item["Foto3"]}`} alt="" className="w-12 h-12 rounded-lg object-cover border border-border" />}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-medium">{item["Descrizione"]}</td>
                  <td className="px-5 py-3.5">
                    {item["Taglia"]
                      ? <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">{item["Taglia"]}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{item["Colore"] ?? "—"}</td>
                  <td className="px-5 py-3.5 text-center font-medium">{item["Qta"] ?? "—"}</td>
                  <td className="px-5 py-3.5 text-right font-medium">
                    {item["Prezzo"] != null ? `€ ${item["Prezzo"].toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {item["Attivo"]
                      ? <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700">Attivo</span>
                      : <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-500">Non attivo</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      {canAccess("Consiglio", userRole) && (
                        <button onClick={() => { setEditItem(item); setShowModal(true) }}
                          className="p-2 rounded-xl hover:bg-secondary transition-all text-muted-foreground hover:text-foreground" title="Modifica">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      )}
                      {canAccess("Admin", userRole) && (
                        <button onClick={() => setConfirmDelete(item.id)}
                          className="p-2 rounded-xl hover:bg-red-50 transition-all text-muted-foreground hover:text-red-500" title="Elimina">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {!canAccess("Consiglio", userRole) && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border bg-secondary/30 text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "capo" : "capi"} visualizzati
          </div>
        )}
      </div>

      {/* Modale conferma eliminazione */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Elimina capo</h3>
                <p className="text-sm text-muted-foreground">Questa azione è irreversibile.</p>
              </div>
            </div>
            <p className="text-sm">
              Sei sicuro di voler eliminare{" "}
              <span className="font-semibold">
                {vestiario.find(v => v.id === confirmDelete)?.["Descrizione"] ?? "questo capo"}
              </span>?
            </p>
            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting === confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {deleting === confirmDelete && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting === confirmDelete ? "Elimino..." : "Sì, elimina"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale modifica/nuovo */}
      {showModal && (
        <VestiarioModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSaved={(newItem) => {
            if (editItem) setVestiario(prev => prev.map(v => v.id === newItem.id ? newItem : v))
            else setVestiario(prev => [newItem, ...prev])
            setShowModal(false); setEditItem(null); router.refresh()
          }}
        />
      )}
    </div>
  )
}
