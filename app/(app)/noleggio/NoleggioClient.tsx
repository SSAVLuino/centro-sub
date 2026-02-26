"use client"

import { useState } from "react"
import { Plus, Search, Eye, Trash2, Loader2, CheckCircle2, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { canAccess } from "@/lib/roles-client"
import type { UserRole } from "@/lib/roles-client"
import type { Noleggio, NoleggioDettaglio } from "@/types/database"
import NoleggioModal from "./NoleggioModal"
import NoleggioDettaglioModal from "./NoleggioDettaglioModal"

interface Props {
  noleggi: Noleggio[]
  dettagli: NoleggioDettaglio[]
  userRole: UserRole
}

export default function NoleggioClient({ noleggi: initialNoleggi, dettagli: initialDettagli, userRole }: Props) {
  const [noleggi, setNoleggi] = useState<Noleggio[]>(initialNoleggi)
  const [dettagli, setDettagli] = useState<NoleggioDettaglio[]>(initialDettagli)
  const [search, setSearch] = useState("")
  const [filterStato, setFilterStato] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [selectedNoleggio, setSelectedNoleggio] = useState<Noleggio | null>(null)
  const [showDettaglio, setShowDettaglio] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete(id: number) {
    setDeleting(id)
    const { error } = await supabase.from("AT_Noleggi").delete().eq("id", id)
    if (!error) {
      setNoleggi(prev => prev.filter(n => n.id !== id))
    }
    setDeleting(null)
  }

  function formatDate(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  function getNomeSocio(noleggio: Noleggio): string {
    const socio = noleggio.BP_soci
    if (!socio) return "—"
    return `${socio.Nome} ${socio.Cognome}`
  }

  const filtered = noleggi.filter(n => {
    const q = search.toLowerCase()
    const nomeSocio = getNomeSocio(n).toLowerCase()
    const matchSearch = !q || nomeSocio.includes(q)
    const matchStato = !filterStato || n["Stato"] === filterStato
    return matchSearch && matchStato
  })

  const noleggioDettagli = (noleggioId: number) => {
    return dettagli.filter(d => d["Noleggio"] === noleggioId)
  }

  const stats = {
    totale: noleggi.length,
    attivi: noleggi.filter(n => n["Stato"] === "Attivo").length,
    completati: noleggi.filter(n => n["Stato"] === "Completato").length,
    scaduti: noleggi.filter(n => n["Stato"] === "Scaduto").length,
  }

  function getStatoBadge(stato: string) {
    switch (stato) {
      case "Attivo":
        return <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-700">Attivo</span>
      case "Completato":
        return <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700">Completato</span>
      case "Scaduto":
        return <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700">Scaduto</span>
      default:
        return <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-700">{stato}</span>
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Noleggi</h1>
          <p className="text-muted-foreground mt-1">Gestione noleggi materiali</p>
        </div>
        {canAccess("Consiglio", userRole) && (
          <button
            onClick={() => { setSelectedNoleggio(null); setShowModal(true) }}
            className="ocean-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Nuovo Noleggio
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Totale" value={stats.totale} color="from-blue-500 to-cyan-500" />
        <StatCard label="Attivi" value={stats.attivi} color="from-blue-500 to-indigo-500" />
        <StatCard label="Completati" value={stats.completati} color="from-emerald-500 to-green-500" />
        <StatCard label="Scaduti" value={stats.scaduti} color="from-red-500 to-rose-500" />
      </div>

      {/* Filtri */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per socio..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <select
          value={filterStato}
          onChange={e => setFilterStato(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        >
          <option value="">Tutti gli stati</option>
          <option value="Attivo">Attivi</option>
          <option value="Completato">Completati</option>
          <option value="Scaduto">Scaduti</option>
        </select>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Socio</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Data Inizio</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Data Fine</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Stato</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    {search || filterStato ? "Nessun risultato per i filtri applicati." : "Nessun noleggio registrato."}
                  </td>
                </tr>
              ) : filtered.map(n => (
                <tr key={n.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{getNomeSocio(n)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground text-sm">{formatDate(n["Data Inizio"])}</td>
                  <td className="px-5 py-3.5 text-muted-foreground text-sm">
                    {formatDate(n["Data Fine Prevista"])}
                    {n["Data Restituzione"] && <span className="block text-xs">Restituito: {formatDate(n["Data Restituzione"])}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-center">{getStatoBadge(n["Stato"])}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => { setSelectedNoleggio(n); setShowDettaglio(true) }}
                        className="p-2 rounded-xl hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
                        title="Dettagli"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canAccess("Consiglio", userRole) && (
                        <button
                          onClick={() => handleDelete(n.id)}
                          disabled={deleting === n.id}
                          className="p-2 rounded-xl hover:bg-red-50 transition-all text-muted-foreground hover:text-red-500 disabled:opacity-50"
                          title="Elimina"
                        >
                          {deleting === n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

      {/* Modals */}
      {showModal && (
        <NoleggioModal
          onClose={() => setShowModal(false)}
          onSaved={(newNoleggio) => {
            setNoleggi(prev => [newNoleggio, ...prev])
            setShowModal(false)
            router.refresh()
          }}
        />
      )}

      {showDettaglio && selectedNoleggio && (
        <NoleggioDettaglioModal
          noleggio={selectedNoleggio}
          dettagli={noleggioDettagli(selectedNoleggio.id)}
          onClose={() => setShowDettaglio(false)}
          onSaved={() => {
            setShowDettaglio(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
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
