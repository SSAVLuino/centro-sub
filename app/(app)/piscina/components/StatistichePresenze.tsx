"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Package, DollarSign, Loader2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import type { Database } from "@/types/database"

type Presenza = Database["public"]["Tables"]["SW_Presenze_Piscina"]["Row"] & {
  BP_soci: { Nome: string; Cognome: string }
}

interface Statistiche {
  totalePresenti: number
  ingressiAbbonamento: number
  ingressiSingoli: number
  introitoSingoli: number
  presenze: Presenza[]
}

export default function StatistichePresenze() {
  const [dataSelezionata, setDataSelezionata] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [stats, setStats] = useState<Statistiche | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadStatistiche()
  }, [dataSelezionata])

  async function loadStatistiche() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("SW_Presenze_Piscina")
        .select("*, BP_soci(Nome, Cognome)")
        .eq("Data Presenza", dataSelezionata)
        .order("Orario Ingresso", { ascending: true })

      if (error) throw error

      const presenze = (data || []) as unknown as Presenza[]

      const stats: Statistiche = {
        totalePresenti: presenze.length,
        ingressiAbbonamento: presenze.filter((p) => p["Tipo Ingresso"] === "abbonamento").length,
        ingressiSingoli: presenze.filter((p) => p["Tipo Ingresso"] === "singolo").length,
        introitoSingoli: presenze
          .filter((p) => p["Tipo Ingresso"] === "singolo" && p.Importo)
          .reduce((acc, p) => acc + (parseFloat(p.Importo as unknown as string) || 0), 0),
        presenze,
      }

      setStats(stats)
    } catch (err) {
      console.error("Errore caricamento statistiche:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Selezione Data */}
      <div className="bg-white rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Presenze per Data</h2>
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">Seleziona Data</label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={dataSelezionata}
                onChange={(e) => setDataSelezionata(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => setDataSelezionata(new Date().toISOString().split("T")[0])}
            variant="outline"
          >
            Oggi
          </Button>
        </div>
      </div>

      {/* Cards Statistiche */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Persone Presenti"
              value={stats.totalePresenti}
              icon={<Users className="w-5 h-5" />}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Ingressi Abbonamento"
              value={stats.ingressiAbbonamento}
              icon={<Package className="w-5 h-5" />}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              title="Ingressi Singoli"
              value={stats.ingressiSingoli}
              icon={<Users className="w-5 h-5" />}
              color="bg-purple-50 text-purple-600"
            />
            <StatCard
              title="Introito Singoli"
              value={`€ ${stats.introitoSingoli.toFixed(2)}`}
              icon={<DollarSign className="w-5 h-5" />}
              color="bg-orange-50 text-orange-600"
            />
          </div>

          {/* Tabella Presenze */}
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">
                Dettaglio Presenze -{" "}
                {format(new Date(dataSelezionata), "dd MMMM yyyy", { locale: it })}
              </h3>
            </div>

            {stats.presenze.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Nessuna presenza registrata per questa data</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Orario</th>
                      <th className="px-6 py-3 text-left font-semibold">Nome</th>
                      <th className="px-6 py-3 text-left font-semibold">Tipo Ingresso</th>
                      <th className="px-6 py-3 text-left font-semibold">Importo</th>
                      <th className="px-6 py-3 text-left font-semibold">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.presenze.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs">
                          {p["Orario Ingresso"] || "—"}
                        </td>
                        <td className="px-6 py-3 font-medium">
                          {p.BP_soci.Nome} {p.BP_soci.Cognome}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                              p["Tipo Ingresso"] === "abbonamento"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {p["Tipo Ingresso"] === "abbonamento"
                              ? "Abbonamento"
                              : "Singolo"}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          {p.Importo ? `€ ${parseFloat(p.Importo as unknown as string).toFixed(2)}` : "—"}
                        </td>
                        <td className="px-6 py-3 text-xs text-muted-foreground">{p.Note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-white rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}
