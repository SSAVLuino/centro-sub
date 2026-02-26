"use client"

import { useState } from "react"
import { X, Loader2, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Noleggio, NoleggioDettaglio } from "@/types/database"

interface Props {
  noleggio: Noleggio
  dettagli: NoleggioDettaglio[]
  onClose: () => void
  onSaved: () => void
}

export default function NoleggioDettaglioModal({ noleggio, dettagli, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataRestituzione, setDataRestituzione] = useState("")
  const supabase = createClient()

  function formatDate(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  function getNomeSocio(): string {
    const socio = noleggio.AT_Soci
    if (!socio) return "—"
    return `${socio.Nome} ${socio.Cognome}`
  }

  async function handleRestituisci() {
    if (!dataRestituzione) {
      setError("Compilare la data di restituzione")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error: err } = await supabase
        .from("AT_Noleggi")
        .update({
          "Data Restituzione": dataRestituzione,
          "Stato": "Completato",
        })
        .eq("id", noleggio.id)

      if (err) throw err

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto")
    } finally {
      setSaving(false)
    }
  }

  const isCompleted = noleggio["Stato"] === "Completato"

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] my-auto">
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold">Dettaglio Noleggio</h2>
            <p className="text-sm text-muted-foreground mt-1">{getNomeSocio()}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[calc(100vh-200px)]">
          {/* Info noleggio */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Data Inizio</p>
              <p className="font-semibold text-sm">{formatDate(noleggio["Data Inizio"])}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Data Fine Prevista</p>
              <p className="font-semibold text-sm">{formatDate(noleggio["Data Fine Prevista"])}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Stato</p>
              <p className="font-semibold text-sm">{noleggio["Stato"]}</p>
            </div>
            {isCompleted && (
              <div>
                <p className="text-xs text-muted-foreground font-medium">Data Restituzione</p>
                <p className="font-semibold text-sm">{formatDate(noleggio["Data Restituzione"])}</p>
              </div>
            )}
          </div>

          {/* Materiali */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold">Materiali noleggiati</h3>
            <div className="space-y-2">
              {dettagli.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nessun materiale</p>
              ) : (
                dettagli.map(d => (
                  <div key={d.id} className="bg-white rounded-lg p-3 border border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{d.AT_Inventario?.["Nome"]}</p>
                        <p className="text-xs text-muted-foreground">{d.AT_Inventario?.["Categoria"]}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">Qty: {d["Quantità"]}</p>
                        {d["Data Restituzione Effettiva"] && (
                          <p className="text-xs text-emerald-600">Restituito: {formatDate(d["Data Restituzione Effettiva"])}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Restituzione */}
          {!isCompleted && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-blue-900">Registra Restituzione</h3>
              <div>
                <label className="block text-sm font-medium mb-1.5">Data Restituzione *</label>
                <input
                  type="date"
                  value={dataRestituzione}
                  onChange={e => setDataRestituzione(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
            </div>
          )}

          {noleggio["Note"] && (
            <div className="bg-secondary/30 rounded-2xl border border-border p-4">
              <p className="text-xs text-muted-foreground font-medium mb-2">Note</p>
              <p className="text-sm">{noleggio["Note"]}</p>
            </div>
          )}

          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="p-6 border-t border-border flex gap-3 justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all"
          >
            Chiudi
          </button>
          {!isCompleted && (
            <button
              onClick={handleRestituisci}
              disabled={saving}
              className="ocean-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Salvo..." : "Registra Restituzione"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
