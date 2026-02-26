"use client"

import { useState } from "react"
import { Plus, Search, Eye, Trash2, Loader2, Filter } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { canAccess } from "@/lib/roles-client"
import type { UserRole } from "@/lib/roles-client"
import type { Inventario } from "@/types/database"
import InventarioModal from "./InventarioModal"

interface Props {
  inventario: Inventario[]
  userRole: UserRole
}

export default function InventarioClient({ inventario: initialInventario, userRole }: Props) {
  const [inventario, setInventario] = useState<Inventario[]>(initialInventario)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Inventario | null>(null)
  const [filterCategoria, setFilterCategoria] = useState("")
  const [filterStato, setFilterStato] = useState("")
  const [deleting, setDeleting] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete(id: number) {
    setDeleting(id)
    const { error } = await supabase.from("AT_Inventario").delete().eq("id", id)
    if (!error) {
      setInventario(prev => prev.filter(i => i.id !== id))
    }
    setDeleting(null)
  }

  function formatDate(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const filtered = inventario.filter(i => {
    const q = search.toLowerCase()
    const matchSearch = !q || 
      (i["Nome"] ?? "").toLowerCase().includes(q) ||
      (i["Descrizione"] ?? "").toLowerCase().includes(q) ||
      (i["Posizione"] ?? "").toLowerCase().includes(q)
    
    const matchCategoria = !filterCategoria || i["Categoria"] === filterCategoria
    const matchStato = !filterStato || i["Stato"] === filterStato
    
    return matchSearch && matchCategoria && matchStato
  })

  const categorie = [...new Set(inventario.map(i => i["Categoria"]).filter(Boolean))]
  const stati = [...new Set(inventario.map(i => i["Stato"]).filter(Boolean))]

  const stats = {
    totale: inventario.length,
    attivo: inventario.filter(i => !i["Distrutto"]).length,
    distrutto: inventario.filter(i => i["Distrutto"]).length,
    valore: inventario.reduce((sum, i) => sum + (i["Valore Attuale"] || 0), 0),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventario</h1>
          <p className="text-muted-foreground mt-1">Gestione asset del club</p>
        </div>
        {canAccess("Consiglio", userRole) && (
          <button
            onClick={() => { setEditItem(null); setShowModal(true) }}
            className="ocean-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Nuovo Asset
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Totale" value={stats.totale} color="from-blue-500 to-cyan-500" />
        <StatCard label="Attivi" value={stats.attivo} color="from-emerald-500 to-green-500" />
        <StatCard label="Distrutti" value={stats.distrutto} color="from-red-500 to-rose-500" />
        <StatCard label="Valore Tot." value={`€ ${(stats.valore / 100).toFixed(0)}`} color="from-amber-500 to-orange-500" />
      </div>

      {/* Filtri e ricerca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per nome, descrizione, posizione..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <select
          value={filterCategoria}
          onChange={e => setFilterCategoria(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        >
          <option value="">Tutte le categorie</option>
          {categorie.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterStato}
          onChange={e => setFilterStato(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        >
          <option value="">Tutti gli stati</option>
          {stati.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Nome</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Categoria</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Posizione</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Stato</th>
                <th className="text-right px-5 py-3.5 font-semibold text-muted-foreground">Valore Attuale</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    {search || filterCategoria || filterStato ? "Nessun risultato per i filtri applicati." : "Nessun asset nell'inventario."}
                  </td>
                </tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{item["Nome"] ?? "—"}</td>
                  <td className="px-5 py-3.5 text-muted-foreground text-sm">{item["Categoria"] ?? "—"}</td>
                  <td className="px-5 py-3.5 text-muted-foreground text-sm">{item["Posizione"] ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      item["Distrutto"] 
                        ? "bg-red-100 text-red-700" 
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {item["Distrutto"] ? "Distrutto" : item["Stato"] ?? "Attivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium">€ {((item["Valore Attuale"] ?? 0) / 100).toFixed(2)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => { setEditItem(item); setShowModal(true) }}
                        disabled={!canAccess("Consiglio", userRole)}
                        className="p-2 rounded-xl hover:bg-secondary transition-all text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Modifica"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canAccess("Consiglio", userRole) && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting === item.id}
                          className="p-2 rounded-xl hover:bg-red-50 transition-all text-muted-foreground hover:text-red-500 disabled:opacity-50"
                          title="Elimina"
                        >
                          {deleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

      {/* Modal */}
      {showModal && (
        <InventarioModal
          item={editItem}
          onClose={() => setShowModal(false)}
          onSaved={(newItem) => {
            if (editItem) {
              setInventario(prev => prev.map(i => i.id === newItem.id ? newItem : i))
            } else {
              setInventario(prev => [newItem, ...prev])
            }
            setShowModal(false)
            router.refresh()
          }}
          userRole={userRole}
        />
      )}
    </div>
  )
}

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
