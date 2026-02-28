"use client"

import { useState, useRef } from "react"
import { Plus, Search, Trash2, Loader2, Image, X, Camera, Shirt } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useSignedUrl } from "@/lib/useSignedUrl"
import type { UserRole } from "@/lib/roles-client"
import type { Vestiario } from "@/types/database"

interface Props {
  vestiario: Vestiario[]
  userRole: UserRole
}

// ── Foto con signed URL ──────────────────────────────────────────────────────
function FotoCapo({ foto, desc }: { foto: string; desc: string }) {
  const url = useSignedUrl("Vestiario", foto)
  if (!url) return (
    <div className="w-12 h-12 rounded-lg bg-secondary/30 flex items-center justify-center text-muted-foreground animate-pulse">
      <Image className="w-5 h-5" />
    </div>
  )
  return (
    <img
      src={url}
      alt={desc}
      className="w-12 h-12 rounded-lg object-cover border border-border"
    />
  )
}

function FotoPreviewModal({ foto, desc }: { foto: string; desc: string }) {
  const url = useSignedUrl("Vestiario", foto)
  if (!url) return <div className="w-full h-48 bg-secondary animate-pulse rounded-xl" />
  return (
    <img
      src={url}
      alt={desc}
      className="w-full h-48 object-cover rounded-xl border border-border"
    />
  )
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

// ── Modal ────────────────────────────────────────────────────────────────────
function VestiarioModal({
  item,
  onClose,
  onSaved,
}: {
  item: Vestiario | null
  onClose: () => void
  onSaved: (v: Vestiario) => void
}) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(item?.["Foto"] ? "Foto caricata" : null)
  const [showFotoMenu, setShowFotoMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    Descrizione: item?.["Descrizione"] ?? "",
    Qta: item?.["Qta"]?.toString() ?? "",
    Taglia: item?.["Taglia"] ?? "",
    Colore: item?.["Colore"] ?? "",
    Prezzo: item?.["Prezzo"]?.toString() ?? "",
    Note: item?.["Note"] ?? "",
    Attivo: item?.["Attivo"] ?? true,
  })

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { setError("Seleziona un file immagine"); return }
    if (file.size > 5 * 1024 * 1024) { setError("L'immagine non può superare i 5MB"); return }
    setFotoFile(file)
    setFotoPreview(file.name)
    setError(null)
  }

  async function handleSave() {
    if (!form.Descrizione.trim()) { setError("La descrizione è obbligatoria"); return }
    setSaving(true)
    setError(null)
    try {
      let fotoPath = item?.["Foto"] ?? null

      if (fotoFile) {
        const ext = fotoFile.name.split(".").pop()?.toLowerCase() ?? "jpg"
        const fileName = `capo_${item?.id || Date.now()}_${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from("Vestiario")
          .upload(fileName, fotoFile, { upsert: true, contentType: fotoFile.type })
        if (uploadErr) throw uploadErr
        fotoPath = fileName
        if (item?.["Foto"] && item["Foto"] !== fileName) {
          await supabase.storage.from("Vestiario").remove([item["Foto"]])
        }
      }

      const payload = {
        Descrizione: form.Descrizione.trim(),
        Qta: form.Qta ? parseInt(form.Qta) : null,
        Taglia: form.Taglia || null,
        Colore: form.Colore || null,
        Prezzo: form.Prezzo ? parseFloat(form.Prezzo) : null,
        Note: form.Note || null,
        Foto: fotoPath,
        Attivo: form.Attivo,
      }

      const { data: result, error: err } = item
        ? await supabase.from("UT_vestiario").update(payload).eq("id", item.id).select().single()
        : await supabase.from("UT_vestiario").insert([payload]).select().single()

      if (err) throw err
      onSaved(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto")
    } finally {
      setSaving(false)
    }
  }

  const field = "w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold">{item ? "Modifica Capo" : "Nuovo Capo"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">

          {/* Foto preview */}
          {item?.["Foto"] && !fotoFile && (
            <FotoPreviewModal foto={item["Foto"]} desc={item["Descrizione"]} />
          )}

          {/* Upload foto */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Foto</h3>
            <div className="relative">
              <div
                onClick={() => setShowFotoMenu(v => !v)}
                className="border-2 border-dashed border-border rounded-xl p-4 hover:border-primary/40 transition-all cursor-pointer bg-white flex items-center gap-3"
              >
                <Camera className="w-5 h-5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {fotoPreview ?? "Clicca per aggiungere una foto (max 5MB)"}
                </p>
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
            </div>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFotoChange} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
          </div>

          {/* Dati capo */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informazioni</h3>

            <div>
              <label className="block text-sm font-medium mb-1.5">Descrizione *</label>
              <input
                type="text"
                value={form.Descrizione}
                onChange={e => setForm({ ...form, Descrizione: e.target.value })}
                placeholder="Es: T-shirt club, Felpa, Polo..."
                className={field}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Taglia</label>
                <select
                  value={form.Taglia}
                  onChange={e => setForm({ ...form, Taglia: e.target.value })}
                  className={field}
                >
                  <option value="">— Seleziona —</option>
                  {["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Unica"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Colore</label>
                <input
                  type="text"
                  value={form.Colore}
                  onChange={e => setForm({ ...form, Colore: e.target.value })}
                  placeholder="Es: Blu, Nero..."
                  className={field}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Quantità</label>
                <input
                  type="number"
                  min="0"
                  value={form.Qta}
                  onChange={e => setForm({ ...form, Qta: e.target.value })}
                  className={field}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Prezzo €</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.Prezzo}
                  onChange={e => setForm({ ...form, Prezzo: e.target.value })}
                  className={field}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-white cursor-pointer hover:bg-secondary transition-all">
              <input
                type="checkbox"
                checked={form.Attivo}
                onChange={e => setForm({ ...form, Attivo: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Capo attivo (disponibile)</span>
            </label>
          </div>

          {/* Note */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note</h3>
            <textarea
              value={form.Note}
              onChange={e => setForm({ ...form, Note: e.target.value })}
              rows={3}
              placeholder="Note aggiuntive..."
              className={`${field} resize-none`}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3 justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="ocean-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Salvo..." : item ? "Aggiorna" : "Salva"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VestiarioClient({ vestiario: initialVestiario }: Props) {
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
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    setDeleting(id)
    const { error } = await supabase.from("UT_vestiario").delete().eq("id", id)
    if (!error) {
      setVestiario(prev => prev.filter(v => v.id !== id))
      setConfirmDelete(null)
    }
    setDeleting(null)
  }

  const filtered = vestiario.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      v["Descrizione"].toLowerCase().includes(q) ||
      (v["Colore"] ?? "").toLowerCase().includes(q) ||
      (v["Taglia"] ?? "").toLowerCase().includes(q)
    const matchTaglia = !filterTaglia || v["Taglia"] === filterTaglia
    const matchAttivo =
      filterAttivo === "" ? true :
      filterAttivo === "attivo" ? v["Attivo"] === true :
      v["Attivo"] !== true
    return matchSearch && matchTaglia && matchAttivo
  })

  const taglie = [...new Set(vestiario.map(v => v["Taglia"]).filter((t): t is string => !!t))]
  const TAGLIA_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Unica"]
  taglie.sort((a, b) => TAGLIA_ORDER.indexOf(a) - TAGLIA_ORDER.indexOf(b))

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
        <button
          onClick={() => { setEditItem(null); setShowModal(true) }}
          className="ocean-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> Nuovo Capo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Modelli"      value={stats.totale}    color="from-blue-500 to-cyan-500" />
        <StatCard label="Attivi"       value={stats.attivi}    color="from-emerald-500 to-green-500" />
        <StatCard label="Pezzi Totali" value={stats.qtaTotale} color="from-violet-500 to-purple-500" />
        <StatCard label="Valore Stock" value={`€ ${stats.valoreTot.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="from-amber-500 to-orange-500" />
      </div>

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per descrizione, taglia, colore..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <select
          value={filterTaglia}
          onChange={e => setFilterTaglia(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        >
          <option value="">Tutte le taglie</option>
          {taglie.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterAttivo}
          onChange={e => setFilterAttivo(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        >
          <option value="">Tutti</option>
          <option value="attivo">Attivi</option>
          <option value="non_attivo">Non attivi</option>
        </select>
      </div>

      {/* Tabella */}
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
                    {search || filterTaglia || filterAttivo
                      ? "Nessun risultato per i filtri applicati."
                      : "Nessun capo nel vestiario."}
                  </td>
                </tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5">
                    {item["Foto"]
                      ? <FotoCapo foto={item["Foto"]} desc={item["Descrizione"]} />
                      : <div className="w-12 h-12 rounded-lg bg-secondary/30 flex items-center justify-center text-muted-foreground">
                          <Shirt className="w-5 h-5" />
                        </div>
                    }
                  </td>
                  <td className="px-5 py-3.5 font-medium">{item["Descrizione"]}</td>
                  <td className="px-5 py-3.5">
                    {item["Taglia"]
                      ? <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">{item["Taglia"]}</span>
                      : <span className="text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{item["Colore"] ?? "—"}</td>
                  <td className="px-5 py-3.5 text-center font-medium">{item["Qta"] ?? "—"}</td>
                  <td className="px-5 py-3.5 text-right font-medium">
                    {item["Prezzo"] != null
                      ? `€ ${item["Prezzo"].toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"
                    }
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {item["Attivo"]
                      ? <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700">Attivo</span>
                      : <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-500">Non attivo</span>
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => { setEditItem(item); setShowModal(true) }}
                        className="p-2 rounded-xl hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
                        title="Modifica"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {confirmDelete === item.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            className="px-2 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium transition-all disabled:opacity-50 flex items-center gap-1"
                          >
                            {deleting === item.id && <Loader2 className="w-3 h-3 animate-spin" />}
                            Elimina
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-all"
                          >
                            Annulla
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-xl hover:bg-red-50 transition-all text-muted-foreground hover:text-red-500"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

      {/* Modal */}
      {showModal && (
        <VestiarioModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSaved={(newItem) => {
            if (editItem) {
              setVestiario(prev => prev.map(v => v.id === newItem.id ? newItem : v))
            } else {
              setVestiario(prev => [newItem, ...prev])
            }
            setShowModal(false)
            setEditItem(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
