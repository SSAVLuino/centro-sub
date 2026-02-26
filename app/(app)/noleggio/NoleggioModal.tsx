"use client"

import { useState, useEffect } from "react"
import { X, Loader2, Plus, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Noleggio, Inventario } from "@/types/database"

type SocioBasic = { id: number; Nome: string | null; Cognome: string | null }

interface Props {
  onClose: () => void
  onSaved: (noleggio: Noleggio) => void
}

export default function NoleggioModal({ onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [soci, setSoci] = useState<SocioBasic[]>([])
  const [inventario, setInventario] = useState<Inventario[]>([])
  const [selectedMateriali, setSelectedMateriali] = useState<{ id: number; quantita: number }[]>([])
  const [searchInventario, setSearchInventario] = useState("")

  const [form, setForm] = useState({
    "Socio": "",
    "Data Inizio": new Date().toISOString().split("T")[0],
    "Data Fine Prevista": "",
    "Note": "",
  })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [{ data: sociData, error: sociErr }, { data: inventarioData, error: invErr }] = await Promise.all([
        supabase.from("AT_Soci").select("id, Nome, Cognome"),
        supabase
          .from("AT_Inventario")
          .select("*")
          .eq("Noleggiabile", true),
      ])

      console.log("Soci caricati:", sociData, "Errore:", sociErr)
      console.log("Inventario caricato:", inventarioData, "Errore:", invErr)

      if (sociErr) throw sociErr
      if (invErr) throw invErr

      setSoci(sociData ?? [])
      setInventario(inventarioData ?? [])
      
      if (!sociData || sociData.length === 0) {
        console.warn("Nessun socio trovato")
      }
      if (!inventarioData || inventarioData.length === 0) {
        console.warn("Nessun materiale noleggiabile trovato")
      }
    } catch (err) {
      console.error("Errore caricamento:", err)
      setError(err instanceof Error ? err.message : "Errore nel caricamento")
    } finally {
      setLoading(false)
    }
  }

  function addMateriale(id: number) {
    if (selectedMateriali.find(m => m.id === id)) return
    setSelectedMateriali([...selectedMateriali, { id, quantita: 1 }])
    setSearchInventario("")
  }

  function removeMateriale(id: number) {
    setSelectedMateriali(selectedMateriali.filter(m => m.id !== id))
  }

  function updateQuantita(id: number, quantita: number) {
    setSelectedMateriali(selectedMateriali.map(m => m.id === id ? { ...m, quantita } : m))
  }

  async function handleSave() {
    if (!form["Socio"] || !form["Data Fine Prevista"]) {
      setError("Compilare i campi obbligatori")
      return
    }

    if (selectedMateriali.length === 0) {
      setError("Selezionare almeno un materiale")
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Crea testata
      const { data: newNoleggio, error: nErr } = await supabase
        .from("AT_Noleggi")
        .insert({
          "Socio": parseInt(form["Socio"]),
          "Data Inizio": form["Data Inizio"],
          "Data Fine Prevista": form["Data Fine Prevista"],
          "Stato": "Attivo",
          "Note": form["Note"] || null,
        })
        .select()
        .single()

      if (nErr) throw nErr

      // Crea dettagli
      const dettagli = selectedMateriali.map(m => ({
        "Noleggio": newNoleggio.id,
        "Inventario": m.id,
        "Quantità": m.quantita,
      }))

      const { error: dErr } = await supabase.from("AT_Noleggi_Dettaglio").insert(dettagli)

      if (dErr) throw dErr

      onSaved(newNoleggio)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Caricamento...</span>
        </div>
      </div>
    )
  }

  const materialiDisponibili = inventario.filter(i => {
    const q = searchInventario.toLowerCase()
    const isSelected = selectedMateriali.some(m => m.id === i.id)
    return !isSelected && (!q || (i["Nome"] ?? "").toLowerCase().includes(q))
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] my-auto">
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold">Nuovo Noleggio</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[calc(100vh-200px)]">
          {/* Socio */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Socio *</label>
            <select
              value={form["Socio"]}
              onChange={e => setForm({...form, "Socio": e.target.value})}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              <option value="">— Seleziona socio —</option>
              {soci.map(s => (
                <option key={s.id} value={s.id}>
                  {s.Nome} {s.Cognome}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Data Inizio *</label>
              <input
                type="date"
                value={form["Data Inizio"]}
                onChange={e => setForm({...form, "Data Inizio": e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Data Fine Prevista *</label>
              <input
                type="date"
                value={form["Data Fine Prevista"]}
                onChange={e => setForm({...form, "Data Fine Prevista": e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Note</label>
            <textarea
              value={form["Note"]}
              onChange={e => setForm({...form, "Note": e.target.value})}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white resize-none"
            />
          </div>

          {/* Materiali */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold">Materiali da noleggiare</h3>

            {/* Aggiungi materiale */}
            <div>
              <input
                type="text"
                value={searchInventario}
                onChange={e => setSearchInventario(e.target.value)}
                placeholder="Cerca materiale..."
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
              {searchInventario && materialiDisponibili.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto space-y-1 border border-border rounded-lg p-2 bg-white">
                  {materialiDisponibili.map(i => (
                    <button
                      key={i.id}
                      onClick={() => addMateriale(i.id)}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-secondary transition-all text-sm flex justify-between items-center"
                    >
                      <span>{i["Nome"]}</span>
                      <Plus className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lista materiali selezionati */}
            {selectedMateriali.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nessun materiale selezionato</p>
            ) : (
              <div className="space-y-2">
                {selectedMateriali.map(m => {
                  const mat = inventario.find(i => i.id === m.id)
                  return (
                    <div key={m.id} className="bg-white rounded-lg p-3 flex items-center justify-between border border-border">
                      <div>
                        <p className="font-medium text-sm">{mat?.["Nome"]}</p>
                        <p className="text-xs text-muted-foreground">{mat?.["Categoria"]}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={m.quantita}
                          onChange={e => updateQuantita(m.id, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 px-2 py-1 rounded border border-border text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <button
                          onClick={() => removeMateriale(m.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-all text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>

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
            {saving ? "Salvo..." : "Salva"}
          </button>
        </div>
      </div>
    </div>
  )
}
