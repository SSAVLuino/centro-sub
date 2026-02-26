"use client"

import { useState, useEffect } from "react"
import { X, Loader2, Trash2, Plus, Search } from "lucide-react"
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
  const supabase = createClient()

  // Carica i dettagli della sessione
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

  // Bombole già aggiunte
  const bomboleSoggiunte = new Set(dettagli.map(d => d["Bombola"]))

  // Bombole disponibili per aggiungere
  const bomboleDisponibili = bombole.filter(b => !bomboleSoggiunte.has(b.id))

  const bomboleFiltrate = bomboleDisponibili.filter(b => {
    const q = searchBombole.toLowerCase()
    return !q ||
      b.Matricola.toLowerCase().includes(q) ||
      (b.Etichetta ?? "").toLowerCase().includes(q)
  })

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
    try {
      const { error: err } = await supabase
        .from("AT_Revisioni_Dettaglio")
        .delete()
        .eq("id", dettaglioId)

      if (err) throw err
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col mt-4 mb-4 max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold">Dettaglio Revisione</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {revisione["Centro Revisione"]} - {new Date(revisione["Date collaudo"]).toLocaleDateString("it-IT")}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Info sessione */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Centro Revisione</p>
              <p className="font-semibold">{revisione["Centro Revisione"]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Stato</p>
              <p className="font-semibold">{revisione["Stato"]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Costo Totale</p>
              <p className="font-semibold">€ {revisione["Costo Revisione"].toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Bombole</p>
              <p className="font-semibold">{dettagli.length}</p>
            </div>
          </div>

          {/* Bombole */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Bombole della Sessione</h3>
              <button
                onClick={() => setShowAddBombole(!showAddBombole)}
                className="flex items-center gap-1.5 text-xs ocean-gradient text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Aggiungi
              </button>
            </div>

            {/* Aggiungi bombole */}
            {showAddBombole && (
              <div className="bg-white rounded-xl border border-border p-3 space-y-3">
                <input
                  type="text"
                  value={searchBombole}
                  onChange={e => setSearchBombole(e.target.value)}
                  placeholder="Cerca matricola, etichetta..."
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {bomboleFiltrate.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      Nessuna bombola disponibile
                    </p>
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
                          {b.Etichetta && <span className="text-muted-foreground ml-2">({b.Etichetta})</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{b.Volume}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tabella bombole */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : dettagli.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Nessuna bombola aggiunta. Clicca "Aggiungi" per aggiungerne.</p>
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Matricola</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Etichetta</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Volume</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Stato Rev</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground">Pagato</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {dettagli.map(det => (
                        <tr key={det.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-2.5 font-medium">
                            {det.AT_Bombole?.Matricola ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground text-sm">
                            {det.AT_Bombole?.Etichetta ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground text-sm">
                            {det.AT_Bombole?.Volume ?? "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <select
                              value={det["Stato Rev"]}
                              onChange={e => handleChangeStato(det.id, e.target.value)}
                              disabled={changingStato?.id === det.id}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium border-0 cursor-pointer ${getStatoColor(det["Stato Rev"])}`}
                            >
                              <option value="In Attesa">In Attesa</option>
                              <option value="OK">OK</option>
                              <option value="Bocciata">Bocciata</option>
                            </select>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button
                              onClick={() => handleTogglePagato(det.id, det["Pagato"])}
                              className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all ${
                                det["Pagato"]
                                  ? "bg-emerald-500 border-emerald-500"
                                  : "border-border hover:border-primary"
                              }`}
                            >
                              {det["Pagato"] && <span className="text-white text-xs font-bold">✓</span>}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button
                              onClick={() => handleRemoveBombola(det.id)}
                              className="p-2 rounded-lg hover:bg-red-50 transition-all text-muted-foreground hover:text-red-500"
                              title="Rimuovi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3 justify-end shrink-0">
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
