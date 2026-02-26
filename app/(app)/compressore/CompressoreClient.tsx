"use client"

import { useState } from "react"
import { Plus, Wind, Gauge, Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { canAccess } from "@/lib/roles-client"
import type { UserRole } from "@/lib/roles-client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { it } from "date-fns/locale"

type Ricarica = any
type Addetto = { id: number; Nome: string | null; Cognome: string | null }

export default function CompressoreClient({ ricariche, addetti, userRole }: {
  ricariche: Ricarica[]; addetti: Addetto[]; userRole: UserRole
}) {
  const [showModal, setShowModal] = useState(false)
  const [editRicarica, setEditRicarica] = useState<Ricarica | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Ricarica | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const totalBombole = ricariche.reduce((sum: number, r: any) => sum + (r.mono ?? 0) + (r.bibo ?? 0), 0)
  const ultimaLettura = ricariche[0]?.letturaFinale ?? null

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    await supabase.from("AT_RicaricheCompressore").delete().eq("id", confirmDelete.id)
    setConfirmDelete(null)
    setDeleting(false)
    router.refresh()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compressore</h1>
          <p className="text-muted-foreground mt-1">Log ricariche e letture</p>
        </div>
        {canAccess("Staff", userRole) && (
          <button onClick={() => setShowModal(true)}
            className="ocean-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Nuova Ricarica
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Ultima Lettura</span>
            <Gauge className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
            {ultimaLettura !== null ? `${ultimaLettura} h` : "—"}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Ricariche Totali</span>
            <Wind className="w-5 h-5 text-teal-500" />
          </div>
          <p className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{ricariche.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Bombole Totali</span>
            <Wind className="w-5 h-5 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{totalBombole}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Data</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Mono</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Bibo</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Lettura Finale</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Addetto</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Note</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ricariche.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Nessuna ricarica registrata.</td></tr>
              ) : ricariche.map((r: any) => (
                <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium">
                    {r.data ? format(new Date(r.data), "dd MMM yyyy", { locale: it }) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {r.mono !== null
                      ? <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">{r.mono}</span>
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {r.bibo !== null
                      ? <span className="inline-block bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">{r.bibo}</span>
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center font-semibold text-primary">
                    {r.letturaFinale !== null ? `${r.letturaFinale} h` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {r.BP_soci ? `${r.BP_soci.Nome} ${r.BP_soci.Cognome}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs max-w-xs truncate">
                    {r.note ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      {canAccess("Staff", userRole) && (
                        <button onClick={() => setEditRicarica(r)}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-all font-medium">
                          <Pencil className="w-3 h-3" /> Modifica
                        </button>
                      )}
                      {canAccess("Consiglio", userRole) && (
                        <button onClick={() => setConfirmDelete(r)}
                          className="inline-flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 px-2.5 py-1.5 rounded-lg transition-all font-medium">
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

      {/* Add modal */}
      {showModal && (
        <RicaricaModal mode="add" addetti={addetti}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); router.refresh() }} />
      )}

      {/* Edit modal */}
      {editRicarica && (
        <RicaricaModal mode="edit" ricarica={editRicarica} addetti={addetti}
          onClose={() => setEditRicarica(null)}
          onSaved={() => { setEditRicarica(null); router.refresh() }} />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Conferma eliminazione</h2>
            <p className="text-sm text-muted-foreground">
              Sei sicuro di voler eliminare la ricarica del{" "}
              <strong>{confirmDelete.data ? format(new Date(confirmDelete.data), "dd MMM yyyy", { locale: it }) : "—"}</strong>?
              L&apos;operazione non è reversibile.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">
                Annulla
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="bg-destructive text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
                {deleting ? "Eliminando..." : "Elimina"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RicaricaModal({ mode, ricarica, addetti, onClose, onSaved }: {
  mode: "add" | "edit"; ricarica?: Ricarica
  addetti: Addetto[]; onClose: () => void; onSaved: () => void
}) {
  const supabase = createClient()
  const today = new Date().toISOString().split("T")[0]

  const [form, setForm] = useState(() => {
    if (mode === "edit" && ricarica) {
      return {
        data: ricarica.data ?? today,
        mono: ricarica.mono?.toString() ?? "",
        bibo: ricarica.bibo?.toString() ?? "",
        letturaFinale: ricarica.letturaFinale?.toString() ?? "",
        addetto: ricarica.addetto?.toString() ?? "",
        note: ricarica.note ?? "",
      }
    }
    return { data: today, mono: "", bibo: "", letturaFinale: "", addetto: "", note: "" }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: string, value: any) { setForm(f => ({ ...f, [key]: value })) }

  async function handleSave() {
    setSaving(true); setError(null)
    const payload: any = {
      data: form.data || null,
      mono: form.mono !== "" ? Number(form.mono) : null,
      bibo: form.bibo !== "" ? Number(form.bibo) : null,
      letturaFinale: form.letturaFinale !== "" ? Number(form.letturaFinale) : null,
      addetto: form.addetto ? Number(form.addetto) : null,
      note: form.note || null,
    }
    const { error } = mode === "add"
      ? await supabase.from("AT_RicaricheCompressore").insert([payload])
      : await supabase.from("AT_RicaricheCompressore").update(payload).eq("id", ricarica!.id)
    if (error) { setError(error.message); setSaving(false) }
    else onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
            {mode === "add" ? "Nuova Ricarica Compressore" : "Modifica Ricarica"}
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Data</label>
            <input type="date" value={form.data} onChange={e => set("data", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Mono (n. bombole)</label>
              <input type="number" min="0" value={form.mono} onChange={e => set("mono", e.target.value)} placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Bibo (n. bombole)</label>
              <input type="number" min="0" value={form.bibo} onChange={e => set("bibo", e.target.value)} placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Lettura Finale (ore)</label>
            <input type="number" value={form.letturaFinale} onChange={e => set("letturaFinale", e.target.value)} placeholder="es. 285"
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Addetto</label>
            <select value={form.addetto} onChange={e => set("addetto", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">— Seleziona addetto —</option>
              {addetti.map(a => (
                <option key={a.id} value={a.id}>{a.Nome} {a.Cognome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Note</label>
            <textarea value={form.note} onChange={e => set("note", e.target.value)} rows={2}
              placeholder="Annotazioni opzionali..."
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="p-6 border-t border-border flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">
            Annulla
          </button>
          <button onClick={handleSave} disabled={saving}
            className="ocean-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
            {saving ? "Salvo..." : mode === "add" ? "Salva Ricarica" : "Aggiorna Ricarica"}
          </button>
        </div>
      </div>
    </div>
  )
}
