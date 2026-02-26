"use client"

import { useState, useEffect } from "react"
import { X, Loader2, Trash2, Plus, Pencil, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { RevisioneBombola, Bombola } from "@/types/database"

interface RevisioneDettaglio {
  id: number
  "Revisione": number
  "Bombola": number
  "Stato Rev": "In Attesa" | "OK" | "Bocciata"
  "Pagato": boolean
  AT_Bombole?: Bombola
}

interface Props {
  revisione: RevisioneBombola
  bombole: Bombola[]
  onClose: () => void
  onSaved: () => void
}

export default function ModalDettaglio({ revisione, bombole, onClose, onSaved }: Props) {
  const [dettagli, setDettagli] = useState<RevisioneDettaglio[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddBombole, setShowAddBombole] = useState(false)
  const [searchBombole, setSearchBombole] = useState("")
  const [changingStato, setChangingStato] = useState<{id: number; stato: string} | null>(null)
  const [showEditTestata, setShowEditTestata] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [formTestata, setFormTestata] = useState({
    "Data Bombole pronte": revisione["Data Bombole pronte"],
    "Date collaudo": revisione["Date collaudo"],
    "Luogo": revisione["Luogo"] || "",
    "Centro Revisione": revisione["Centro Revisione"],
    "Costo Revisione": revisione["Costo Revisione"].toString(),
    "Arrotondamento": revisione["Arrotondamento"].toString(),
  })
  const supabase = createClient()

  useEffect(() => {
    loadDettagli()
  }, [])

  async function loadDettagli() {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from("AT_Revisioni_Dettaglio")
        .select("*, AT_Bombole(*)")
        .eq("Revisione", revisione.id)

      if (err) throw err
      setDettagli((data as RevisioneDettaglio[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel caricamento")
    } finally {
      setLoading(false)
    }
  }

  const bomboleSoggiunte = new Set(dettagli.map(d => d["Bombola"]))
  const bomboleDisponibili = bombole.filter(b => !bomboleSoggiunte.has(b.id))
  const bomboleFiltrate = bomboleDisponibili.filter(b => {
    const q = searchBombole.toLowerCase()
    return !q ||
      b.Matricola.toLowerCase().includes(q) ||
      (b.Etichetta ?? "").toLowerCase().includes(q)
  })

  async function handleSaveTestata() {
    setSaving(true)
    setError(null)
    try {
      const { error: err } = await supabase
        .from("AT_Revisioni")
        .update({
          "Data Bombole pronte": formTestata["Data Bombole pronte"],
          "Date collaudo": formTestata["Date collaudo"],
          "Luogo": formTestata["Luogo"] || null,
          "Centro Revisione": formTestata["Centro Revisione"],
          "Costo Revisione": parseFloat(formTestata["Costo Revisione"]),
          "Arrotondamento": parseFloat(formTestata["Arrotondamento"]),
        })
        .eq("id", revisione.id)

      if (err) throw err
      setShowEditTestata(false)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel salvataggio")
    } finally {
      setSaving(false)
    }
  }

  async function handleAddBombola(bombolaId: number) {
    try {
      const { error: err } = await supabase
        .from("AT_Revisioni_Dettaglio")
        .insert({
          "Revisione": revisione.id,
          "Bombola": bombolaId,
          "Stato Rev": "In Attesa",
          "Pagato": false,
        })

      if (err) throw err
      await loadDettagli()
      setSearchBombole("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nell'aggiunta")
    }
  }

  async function handleRemoveBombola(dettaglioId: number) {
    if (confirmDeleteId !== dettaglioId) {
      setConfirmDeleteId(dettaglioId)
      return
    }
    try {
      const { error: err } = await supabase
        .from("AT_Revisioni_Dettaglio")
        .delete()
        .eq("id", dettaglioId)

      if (err) throw err
      setConfirmDeleteId(null)
      await loadDettagli()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nella rimozione")
    }
  }

  async function handleChangeStato(dettaglioId: number, nuovoStato: string) {
    setChangingStato({ id: dettaglioId, stato: nuovoStato })
    try {
      const { error: err } = await supabase
        .from("AT_Revisioni_Dettaglio")
        .update({ "Stato Rev": nuovoStato })
        .eq("id", dettaglioId)

      if (err) throw err
      await loadDettagli()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nell'aggiornamento")
    } finally {
      setChangingStato(null)
    }
  }

  async function handleTogglePagato(dettaglioId: number, pagato: boolean) {
    try {
      const { error: err } = await supabase
        .from("AT_Revisioni_Dettaglio")
        .update({ "Pagato": !pagato })
        .eq("id", dettaglioId)

      if (err) throw err
      await loadDettagli()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nell'aggiornamento")
    }
  }

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case "In Attesa":
        return "bg-amber-100 text-amber-700"
      case "OK":
        return "bg-emerald-100 text-emerald-700"
      case "Bocciata":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold">Dettaglio Revisione</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {revisione["Centro Revisione"]}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-all shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content scrollabile */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Sezione Testata */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Dati Sessione</h3>
              {!showEditTestata ? (
                <button
                  onClick={() => setShowEditTestata(true)}
                  className="flex items-center gap-1.5 text-xs ocean-gradient text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" /> Modifica
                </button>
              ) : (
                <button
                  onClick={handleSaveTestata}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs ocean-gradient text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {saving ? "Salvo..." : "Salva"}
                </button>
              )}
            </div>

            {!showEditTestata ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Data Bombole Pronte</p>
                    <p className="font-semibold text-sm">{new Date(revisione["Data Bombole pronte"]).toLocaleDateString("it-IT")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Date Collaudo</p>
                    <p className="font-semibold text-sm">{new Date(revisione["Date collaudo"]).toLocaleDateString("it-IT")}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Centro Revisione</p>
                  <p className="font-semibold text-sm">{revisione["Centro Revisione"]}</p>
                </div>
                {revisione["Luogo"] && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Luogo</p>
                    <p className="font-semibold text-sm">{revisione["Luogo"]}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Costo Revisione</p>
                    <p className="font-semibold text-sm">€ {revisione["Costo Revisione"].toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Arrotondamento</p>
                    <p className="font-semibold text-sm">€ {revisione["Arrotondamento"].toFixed(2)}</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-medium">Prezzo Unitario</p>
                  <p className="font-bold text-lg text-blue-700">
                    € {dettagli.length > 0 ? ((revisione["Costo Revisione"] + revisione["Arrotondamento"]) / dettagli.length).toFixed(2) : "—"}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">({revisione["Costo Revisione"] + revisione["Arrotondamento"]} ÷ {dettagli.length} bombole)</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Stato</p>
                  <p className="font-semibold text-sm">{revisione["Stato"]}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 bg-white p-3 rounded-xl">
                <div>
                  <label className="block text-xs font-medium mb-1">Data Bombole Pronte</label>
                  <input
                    type="date"
                    value={formTestata["Data Bombole pronte"]}
                    onChange={e => setFormTestata({...formTestata, "Data Bombole pronte": e.target.value})}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Date Collaudo</label>
                  <input
                    type="date"
                    value={formTestata["Date collaudo"]}
                    onChange={e => setFormTestata({...formTestata, "Date collaudo": e.target.value})}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Centro Revisione</label>
                  <input
                    type="text"
                    value={formTestata["Centro Revisione"]}
                    onChange={e => setFormTestata({...formTestata, "Centro Revisione": e.target.value})}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Luogo</label>
                  <input
                    type="text"
                    value={formTestata["Luogo"]}
                    onChange={e => setFormTestata({...formTestata, "Luogo": e.target.value})}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Costo Revisione €</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formTestata["Costo Revisione"]}
                    onChange={e => setFormTestata({...formTestata, "Costo Revisione": e.target.value})}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Arrotondamento €</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formTestata["Arrotondamento"]}
                    onChange={e => setFormTestata({...formTestata, "Arrotondamento": e.target.value})}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bombole */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Bombole ({dettagli.length})</h3>
              <button
                onClick={() => setShowAddBombole(!showAddBombole)}
                className="flex items-center gap-1.5 text-xs ocean-gradient text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Aggiungi
              </button>
            </div>

            {showAddBombole && (
              <div className="bg-white rounded-xl border border-border p-3 space-y-2">
                <input
                  type="text"
                  value={searchBombole}
                  onChange={e => setSearchBombole(e.target.value)}
                  placeholder="Cerca matricola, etichetta..."
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {bomboleFiltrate.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">Nessuna bombola disponibile</p>
                  ) : (
                    bomboleFiltrate.map(b => (
                      <button
                        key={b.id}
                        onClick={() => {
                          handleAddBombola(b.id)
                          setSearchBombole("")
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary transition-all text-sm flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium">{b.Matricola}</span>
                          {b.Etichetta && <span className="text-muted-foreground text-xs ml-2">({b.Etichetta})</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{b.Volume}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : dettagli.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nessuna bombola. Clicca "Aggiungi".</p>
            ) : (
              <div className="space-y-2">
                {dettagli.map(det => (
                  <div key={det.id} className="bg-white rounded-lg p-3 border border-border hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{det.AT_Bombole?.Matricola}</p>
                        <p className="text-xs text-muted-foreground">{det.AT_Bombole?.Etichetta ?? "—"} • {det.AT_Bombole?.Volume}</p>
                      </div>
                      {confirmDeleteId === det.id ? (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleRemoveBombola(det.id)}
                            className="px-2 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium transition-all"
                          >
                            Elimina
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-all"
                          >
                            Annulla
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRemoveBombola(det.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-all text-muted-foreground hover:text-red-500 shrink-0"
                          title="Rimuovi bombola"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={det["Stato Rev"]}
                        onChange={e => handleChangeStato(det.id, e.target.value)}
                        disabled={changingStato?.id === det.id}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer flex-1 ${getStatoColor(det["Stato Rev"])}`}
                      >
                        <option value="In Attesa">In Attesa</option>
                        <option value="OK">OK</option>
                        <option value="Bocciata">Bocciata</option>
                      </select>
                      <button
                        onClick={() => handleTogglePagato(det.id, det["Pagato"])}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                          det["Pagato"]
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {det["Pagato"] ? "✓ Pagato" : "Pagato"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3 justify-end bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}
