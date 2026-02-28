"use client"

import { useState, useRef } from "react"
import { X, Loader2, Camera } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useSignedUrl } from "@/lib/useSignedUrl"
import type { UserRole } from "@/lib/roles-client"
import type { Inventario } from "@/types/database"

interface Props {
  item: Inventario | null
  onClose: () => void
  onSaved: (item: Inventario) => void
  userRole: UserRole
}

export default function InventarioModal({ item, onClose, onSaved, userRole }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(item?.["Foto"] ? "Foto caricata" : null)
  const fileInputRef    = useRef<HTMLInputElement>(null)
  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const [showFotoMenu, setShowFotoMenu] = useState(false)
  const supabase = createClient()

  const [form, setForm] = useState({
    "Data Ingresso": item?.["Data Ingresso"] ?? "",
    "Nome": item?.["Nome"] ?? "",
    "Descrizione": item?.["Descrizione"] ?? "",
    "Posizione": item?.["Posizione"] ?? "",
    "Categoria": item?.["Categoria"] ?? "",
    "Note": item?.["Note"] ?? "",
    // FIX: item esistente con Stato null → stringa vuota; nuovo item → "Attivo"
    "Stato": item ? (item["Stato"] ?? "") : "Attivo",
    "Valore Iniziale": item?.["Valore Iniziale"]?.toString() ?? "",
    "Valore Attuale": item?.["Valore Attuale"]?.toString() ?? "",
    "Distrutto": item?.["Distrutto"] ?? false,
    "Data Distruzione": item?.["Data Distruzione"] ?? "",
    "Data Ultimo Controllo": item?.["Data Ultimo Controllo"] ?? "",
    "Quantità": item?.["Quantità"]?.toString() ?? "",
    "Noleggiabile": item?.["Noleggiabile"] ?? false,
  })

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Seleziona un file immagine")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("L'immagine non può superare i 5MB")
      return
    }
    setFotoFile(file)
    setFotoPreview(file.name)
    setError(null)
  }

  async function handleSave() {
    if (!form["Nome"]) {
      setError("Il nome è obbligatorio")
      return
    }

    setSaving(true)
    setError(null)

    try {
      let fotoPath = item?.["Foto"] ?? null

      if (fotoFile) {
        const ext = fotoFile.name.split(".").pop()?.toLowerCase() ?? "jpg"
        const fileName = `asset_${item?.id || Date.now()}_${Date.now()}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from("Inventario")
          .upload(fileName, fotoFile, { upsert: true, contentType: fotoFile.type })

        if (uploadErr) throw uploadErr
        fotoPath = fileName

        if (item?.["Foto"] && item["Foto"] !== fileName) {
          await supabase.storage.from("Inventario").remove([item["Foto"]])
        }
      }

      const payload: any = {
        "Data Ingresso": form["Data Ingresso"] || null,
        "Nome": form["Nome"],
        "Descrizione": form["Descrizione"] || null,
        "Posizione": form["Posizione"] || null,
        "Categoria": form["Categoria"] || null,
        "Note": form["Note"] || null,
        "Foto": fotoPath,
        // FIX: stringa vuota → null nel DB
        "Stato": form["Stato"] || null,
        "Valore Iniziale": form["Valore Iniziale"] ? parseInt(form["Valore Iniziale"]) : null,
        "Valore Attuale": form["Valore Attuale"] ? parseInt(form["Valore Attuale"]) : null,
        "Distrutto": form["Distrutto"],
        "Data Distruzione": form["Distrutto"] ? form["Data Distruzione"] || null : null,
        "Data Ultimo Controllo": form["Data Ultimo Controllo"] || null,
        "Quantità": form["Quantità"] ? parseInt(form["Quantità"]) : null,
        "Noleggiabile": form["Noleggiabile"],
      }

      const { data: result, error: err } = item
        ? await supabase.from("AT_Inventario").update(payload).eq("id", item.id).select().single()
        : await supabase.from("AT_Inventario").insert([payload]).select().single()

      if (err) throw err
      onSaved(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold">{item ? "Modifica Asset" : "Nuovo Asset"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[calc(100vh-200px)]">

          {/* Foto preview esistente */}
          {item?.["Foto"] && !fotoFile && (
            <div className="rounded-2xl overflow-hidden border border-border">
              <FotoPreview foto={item["Foto"]} nome={item["Nome"]} />
            </div>
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
            <input ref={fileInputRef}   type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
          </div>

          {/* Informazioni principali */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informazioni</h3>

            <div>
              <label className="block text-sm font-medium mb-1.5">Nome *</label>
              <input
                type="text"
                value={form["Nome"]}
                onChange={e => setForm({...form, "Nome": e.target.value})}
                placeholder="Nome asset..."
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Descrizione</label>
              <textarea
                value={form["Descrizione"]}
                onChange={e => setForm({...form, "Descrizione": e.target.value})}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Categoria</label>
                <input
                  type="text"
                  value={form["Categoria"]}
                  onChange={e => setForm({...form, "Categoria": e.target.value})}
                  placeholder="Es: Mute, Erogatori..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Posizione</label>
                <input
                  type="text"
                  value={form["Posizione"]}
                  onChange={e => setForm({...form, "Posizione": e.target.value})}
                  placeholder="Es: Magazzino A..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Data Ingresso</label>
              <input
                type="date"
                value={form["Data Ingresso"]}
                onChange={e => setForm({...form, "Data Ingresso": e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>
          </div>

          {/* Valori */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valori</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Valore Iniziale €</label>
                <input
                  type="number"
                  value={form["Valore Iniziale"]}
                  onChange={e => setForm({...form, "Valore Iniziale": e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Valore Attuale €</label>
                <input
                  type="number"
                  value={form["Valore Attuale"]}
                  onChange={e => setForm({...form, "Valore Attuale": e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Quantità</label>
              <input
                type="number"
                value={form["Quantità"]}
                onChange={e => setForm({...form, "Quantità": e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>

            <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-white cursor-pointer hover:bg-secondary transition-all">
              <input
                type="checkbox"
                checked={form["Noleggiabile"]}
                onChange={e => setForm({...form, "Noleggiabile": e.target.checked})}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Disponibile per noleggio</span>
            </label>
          </div>

          {/* Stato */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stato</h3>

            <div>
              <label className="block text-sm font-medium mb-1.5">Stato</label>
              <input
                type="text"
                value={form["Stato"]}
                onChange={e => setForm({...form, "Stato": e.target.value})}
                placeholder="Es: Attivo, Manutenzione... (lascia vuoto per nessuno stato)"
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Data Ultimo Controllo</label>
              <input
                type="date"
                value={form["Data Ultimo Controllo"]}
                onChange={e => setForm({...form, "Data Ultimo Controllo": e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>

            <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-white cursor-pointer hover:bg-secondary transition-all">
              <input
                type="checkbox"
                checked={form["Distrutto"]}
                onChange={e => setForm({...form, "Distrutto": e.target.checked})}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Asset distrutto</span>
            </label>

            {form["Distrutto"] && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Data Distruzione</label>
                <input
                  type="date"
                  value={form["Data Distruzione"]}
                  onChange={e => setForm({...form, "Data Distruzione": e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
            )}
          </div>

          {/* Note */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note</h3>
            <textarea
              value={form["Note"]}
              onChange={e => setForm({...form, "Note": e.target.value})}
              rows={3}
              placeholder="Note aggiuntive..."
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3 justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all"
          >
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

// ── Foto preview con signed URL ─────────────────────────────────────────────
function FotoPreview({ foto, nome }: { foto: string; nome: string | null }) {
  const url = useSignedUrl("Inventario", foto)
  if (!url) return <div className="w-full h-40 bg-secondary animate-pulse" />
  return (
    <img
      src={url}
      alt={nome ?? "Foto asset"}
      className="w-full h-40 object-cover"
    />
  )
}
