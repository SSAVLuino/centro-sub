"use client"

import { useState } from "react"
import { Plus, Search, Eye, Trash2, Loader2, Upload, FileText, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useSignedUrl } from "@/lib/useSignedUrl"
import type { UserRole } from "@/lib/roles-client"
import type { RevisioneBombola, Bombola } from "@/types/database"
import ModalNuovaRevisione from "./ModalNuovaRevisione"
import ModalDettaglio from "./ModalDettaglio"
import ModalCertificato from "./ModalCertificato"

interface Props {
  revisioni: RevisioneBombola[]
  bombole: Bombola[]
  userRole: UserRole
}

export default function RevisioniClient({ revisioni: initialRevisioni, bombole, userRole }: Props) {
  const [revisioni, setRevisioni] = useState<RevisioneBombola[]>(initialRevisioni)
  const [search, setSearch] = useState("")
  const [showModalNuova, setShowModalNuova] = useState(false)
  const [selectedRevisione, setSelectedRevisione] = useState<RevisioneBombola | null>(null)
  const [showDettaglio, setShowDettaglio] = useState(false)
  const [showModalCertificato, setShowModalCertificato] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete(id: number) {
    setDeleting(id)
    const { error } = await supabase.from("AT_Revisioni").delete().eq("id", id)
    if (!error) {
      setRevisioni(prev => prev.filter(r => r.id !== id))
    }
    setDeleting(null)
  }

  function formatDate(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const getStatusBadge = (stato: string) => {
    const config: Record<string, { label: string; color: string }> = {
      "Da preparare": { label: "Da preparare", color: "bg-gray-100 text-gray-700" },
      "Pronte": { label: "Pronte", color: "bg-blue-100 text-blue-700" },
      "Partite": { label: "Partite", color: "bg-amber-100 text-amber-700" },
      "Tornate": { label: "Tornate", color: "bg-emerald-100 text-emerald-700" },
    }
    const c = config[stato] || config["Da preparare"]
    return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.color}`}>{c.label}</span>
  }

  const filtered = revisioni.filter(r => {
    const q = search.toLowerCase()
    return !q || 
      r["Centro Revisione"].toLowerCase().includes(q) ||
      (r["Luogo"] ?? "").toLowerCase().includes(q)
  })

  const stats = {
    totale: revisioni.length,
    daPreparare: revisioni.filter(r => r["Stato"] === "Da preparare").length,
    pronte: revisioni.filter(r => r["Stato"] === "Pronte").length,
    partite: revisioni.filter(r => r["Stato"] === "Partite").length,
    tornate: revisioni.filter(r => r["Stato"] === "Tornate").length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revisioni Bombole</h1>
          <p className="text-muted-foreground mt-1">Gestione sessioni collaudo bombole</p>
        </div>
        <button
          onClick={() => setShowModalNuova(true)}
          className="ocean-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> Nuova Sessione
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Totale" value={stats.totale} color="from-blue-500 to-cyan-500" />
        <StatCard label="Da preparare" value={stats.daPreparare} color="from-gray-400 to-gray-500" />
        <StatCard label="Pronte" value={stats.pronte} color="from-blue-500 to-indigo-500" />
        <StatCard label="Partite" value={stats.partite} color="from-amber-500 to-orange-500" />
        <StatCard label="Tornate" value={stats.tornate} color="from-emerald-500 to-green-500" />
      </div>

      {/* Ricerca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca per centro revisione, luogo..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Centro Revisione</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Date</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Luogo</th>
                <th className="text-right px-5 py-3.5 font-semibold text-muted-foreground">Costo Unitario</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Certificato</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Stato</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    {search ? "Nessun risultato per la ricerca." : "Nessuna sessione di revisione."}
                  </td>
                </tr>
              ) : filtered.map(r => {
                const prezzoUnitario = ((r["Costo Revisione"] + r["Arrotondamento"]) / 20).toFixed(2)
                return (
                  <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{r["Centro Revisione"]}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <div className="text-sm">
                        <div>{formatDate(r["Data Bombole pronte"])}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Collaudo: {formatDate(r["Date collaudo"])}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-sm">{r["Luogo"] ?? "—"}</td>
                    <td className="px-5 py-3.5 text-right font-medium">€ {prezzoUnitario}</td>
                    <td className="px-5 py-3.5 text-center">
                      {r["Certificato"] ? (
                        <CertificatoLink path={r["Certificato"]} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">{getStatusBadge(r["Stato"])}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelectedRevisione(r); setShowDettaglio(true) }}
                          className="p-2 rounded-xl hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
                          title="Dettagli"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {r["Stato"] === "Tornate" && (
                          <button
                            onClick={() => { setSelectedRevisione(r); setShowModalCertificato(true) }}
                            className="p-2 rounded-xl hover:bg-blue-50 transition-all text-muted-foreground hover:text-blue-600"
                            title="Carica/Sostituisci certificato"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deleting === r.id}
                          className="p-2 rounded-xl hover:bg-red-50 transition-all text-muted-foreground hover:text-red-500 disabled:opacity-50"
                          title="Elimina"
                        >
                          {deleting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showModalNuova && (
        <ModalNuovaRevisione
          bombole={bombole}
          onClose={() => setShowModalNuova(false)}
          onSaved={(newRevisione) => {
            setRevisioni(prev => [newRevisione, ...prev])
            setShowModalNuova(false)
          }}
        />
      )}

      {showDettaglio && selectedRevisione && (
        <ModalDettaglio
          revisione={selectedRevisione}
          bombole={bombole}
          onClose={() => setShowDettaglio(false)}
          onSaved={() => {
            setShowDettaglio(false)
            router.refresh()
          }}
        />
      )}

      {showModalCertificato && selectedRevisione && (
        <ModalCertificato
          revisione={selectedRevisione}
          onClose={() => setShowModalCertificato(false)}
          onSaved={(updatedRevisione) => {
            setRevisioni(prev => prev.map(r => r.id === updatedRevisione.id ? updatedRevisione : r))
            setShowModalCertificato(false)
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

function CertificatoLink({ path }: { path: string }) {
  const signedUrl = useSignedUrl("Revisioni", path)
  
  if (!signedUrl) {
    return <span className="text-xs text-muted-foreground animate-pulse">Caricamento...</span>
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
      title="Scarica certificato"
    >
      <FileText className="w-3.5 h-3.5" /> PDF
    </a>
  )
}
