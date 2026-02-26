"use client"

import { useState, useMemo } from "react"
import { X, Loader2, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Bombola, RevisioneBombola } from "@/types/database"

interface Props {
  bombole: Bombola[]
  onClose: () => void
  onSaved: (newRevisione: RevisioneBombola) => void
}

export default function ModalNuovaRevisione({ bombole, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchBombole, setSearchBombole] = useState("")
  const [filterAnni, setFilterAnni] = useState<number | null>(2)
  const [selectedBombole, setSelectedBombole] = useState<Set<number>>(new Set())
  
  const [form, setForm] = useState({
    "Data Bombole pronte": "",
    "Date collaudo": "",
    "Luogo": "",
    "Centro Revisione": "",
    "Costo Revisione": "",
    "Arrotondamento": "",
  })

  const supabase = createClient()

  const bomboleFiltrate = useMemo(() => {
    const now = new Date()
    return bombole.filter(b => {
      const q = searchBombole.toLowerCase()
      const matchSearch = !q ||
        b.Matricola.toLowerCase().includes(q) ||
        (b.Etichetta ?? "").toLowerCase().includes(q)
      
      if (!matchSearch) return false

      if (filterAnni !== null && b["Ultima Revisione"]) {
        const lastRev = new Date(b["Ultima Revisione"])
        const yearsAgo = new Date(now)
        yearsAgo.setFullYear(yearsAgo.getFullYear() - filterAnni)
        if (lastRev > yearsAgo) return false
      }

      return true
    })
  }, [bombole, searchBombole, filterAnni])

  const handleSelectAll = () => {
    if (selectedBombole.size === bomboleFiltrate.length) {
      setSelectedBombole(new Set())
    } else {
      setSelectedBombole(new Set(bomboleFiltrate.map(b => b.id)))
    }
  }

  const handleToggleBombola = (id: number) => {
    const newSet = new Set(selectedBombole)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedBombole(newSet)
  }

  async function handleSave() {
    if (!form["Centro Revisione"] || !form["Date collaudo"] || !form["Data Bombole pronte"]) {
      setError("Compilare i campi obbligatori")
      return
    }

    if (selectedBombole.size === 0) {
      setError("Selezionare almeno una bombola")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { data: newRevisione, error: revErr } = await supabase
        .from("AT_Revisioni")
        .insert({
          "Data Bombole pronte": form["Data Bombole pronte"],
          "Date collaudo": form["Date collaudo"],
          "Luogo": form["Luogo"] || null,
          "Centro Revisione": form["Centro Revisione"],
          "Costo Revisione": parseFloat(form["Costo Revisione"]) || 0,
          "Arrotondamento": parseFloat(form["Arrotondamento"]) || 0,
          "Stato": "Da preparare",
        })
        .select()
        .single()

      if (revErr) throw revErr

      const dettagli = Array.from(selectedBombole).map(bombolaId => ({
        "Revisione": newRevisione.id,
        "Bombola": bombolaId,
        "Stato Rev": "In Attesa",
        "Pagato": false,
      }))

      const { error: detErr } = await supabase
        .from("AT_Revisioni_Dettaglio")
        .insert(dettagli)

      if (detErr) throw detErr

      onSaved(newRevisione)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border shrink-0 flex items-center justify-between">
          <h2 className="text-xl font-bold">Nuova Sessione di Revisione</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dati Sessione</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Data Bombole Pronte *</label>
                <input
                  type="date"
                  value={form["Data Bombole pronte"]}
                  onChange={e => setForm({...form, "Data Bombole pronte": e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Date Collaudo *</label>
                <input
                  type="date"
                  value={form["Date collaudo"]}
                  onChange={e => setForm({...form, "Date collaudo": e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Centro Revisione *</label>
              <input
                type="text"
                value={form["Centro Revisione"]}
                onChange={e => setForm({...form, "Centro Revisione": e.target.value})}
                placeholder="Es: ISPESL, TÜV, ecc."
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Luogo</label>
              <input
                type="text"
                value={form["Luogo"]}
                onChange={e => setForm({...form, "Luogo": e.target.value})}
                placeholder="Città del centro revisione"
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Costo Revisione €</label>
                <input
                  type="number"
                  step="0.01"
                  value={form["Costo Revisione"]}
                  onChange={e => setForm({...form, "Costo Revisione": e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Arrotondamento €</label>
                <input
                  type="number"
                  step="0.01"
                  value={form["Arrotondamento"]}
                  onChange={e => setForm({...form, "Arrotondamento": e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Seleziona Bombole ({selectedBombole.size} selezionate)
              </h3>
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchBombole}
                  onChange={e => setSearchBombole(e.target.value)}
                  placeholder="Cerca matricola, etichetta..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
              <select
                value={filterAnni ?? ""}
                onChange={e => setFilterAnni(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                <option value="">Tutte le bombole</option>
                <option value="2">Ultimi 2 anni non revisionata</option>
                <option value="1">Ultimo anno non revisionata</option>
              </select>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-white">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30 sticky top-0">
                      <th className="px-4 py-2.5 text-left">
                        <input
                          type="checkbox"
                          checked={selectedBombole.size === bomboleFiltrate.length && bomboleFiltrate.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-border cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Matricola</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Etichetta</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Volume</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Ultima Rev.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bomboleFiltrate.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                          Nessuna bombola trovata
                        </td>
                      </tr>
                    ) : (
                      bomboleFiltrate.map(b => (
                        <tr key={b.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-2.5">
                            <input
                              type="checkbox"
                              checked={selectedBombole.has(b.id)}
                              onChange={() => handleToggleBombola(b.id)}
                              className="w-4 h-4 rounded border-border cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-2.5 font-medium">{b.Matricola}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{b.Etichetta ?? "—"}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{b.Volume}</td>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs">
                            {b["Ultima Revisione"] 
                              ? new Date(b["Ultima Revisione"]).toLocaleDateString("it-IT")
                              : "Mai"
                            }
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
            {saving ? "Salvo..." : "Crea Sessione"}
          </button>
        </div>
      </div>
    </div>
  )
}
