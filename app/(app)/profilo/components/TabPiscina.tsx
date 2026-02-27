"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Loader2, AlertCircle, Package, Calendar, Clock, DollarSign } from "lucide-react"
import type { Database } from "@/types/database"

type Pacchetto = Database["public"]["Tables"]["SW_Abbonamenti_Piscina"]["Row"]
type Presenza = Database["public"]["Tables"]["SW_Presenze_Piscina"]["Row"]

interface TabPiscinaProps {
  socioId: number
}

export default function TabPiscina({ socioId }: TabPiscinaProps) {
  const [pacchetti, setPacchetti] = useState<Pacchetto[]>([])
  const [presenze, setPresenze] = useState<Presenza[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [socioId])

  async function loadData() {
    try {
      setLoading(true)

      // Carica pacchetti attivi
      const { data: pData, error: pErr } = await supabase
        .from("SW_Abbonamenti_Piscina")
        .select("*")
        .eq("Socio", socioId)
        .eq("Attivo", true)
        .order("created_at", { ascending: false })
      if (pErr) throw pErr
      setPacchetti(pData || [])

      // Carica presenze
      const { data: prData, error: prErr } = await supabase
        .from("SW_Presenze_Piscina")
        .select("*")
        .eq("Socio", socioId)
        .order("Data Presenza", { ascending: false })
      if (prErr) throw prErr
      setPresenze(prData || [])
    } catch (err) {
      console.error("Errore caricamento dati piscina:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Pacchetti Attivi */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="w-5 h-5" />
          Pacchetti Attivi
        </h3>

        {pacchetti.length === 0 ? (
          <div className="bg-muted/30 border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Nessun pacchetto attivo</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pacchetti.map((p) => {
              const ingressiRimasti = p["Ingressi Totali"] - p["Ingressi Usati"]
              const percentuale = (p["Ingressi Usati"] / p["Ingressi Totali"]) * 100
              const isScaduto = p["Data Scadenza"]
                ? new Date(p["Data Scadenza"]) < new Date()
                : false

              return (
                <div
                  key={p.id}
                  className={`border rounded-lg p-5 space-y-4 ${
                    isScaduto ? "bg-red-50 border-red-200" : "bg-white border-border"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">Pacchetto {p["Ingressi Totali"]} Ingressi</h4>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          isScaduto
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {isScaduto ? "Scaduto" : "Attivo"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Acquistato:{" "}
                      {format(new Date(p["Data Acquisto"]), "dd MMM yyyy", { locale: it })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>
                        Ingressi Utilizzati: <span className="text-primary">{p["Ingressi Usati"]}</span>/{p["Ingressi Totali"]}
                      </span>
                      <span className="text-green-600">{ingressiRimasti} rimasti</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 transition-all rounded-full ${
                          isScaduto ? "bg-red-500" : "bg-green-500"
                        }`}
                        style={{ width: `${percentuale}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {percentuale.toFixed(0)}% utilizzato
                    </p>
                  </div>

                  {p["Data Scadenza"] && (
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span
                        className={isScaduto ? "text-red-600 font-semibold" : "text-muted-foreground"}
                      >
                        Scadenza:{" "}
                        {format(new Date(p["Data Scadenza"]), "dd MMMM yyyy", { locale: it })}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Storico Ingressi */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Storico Ingressi
        </h3>

        {presenze.length === 0 ? (
          <div className="bg-muted/30 border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Nessun ingresso registrato</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Data</th>
                    <th className="px-4 py-3 text-left font-semibold">Orario</th>
                    <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                    <th className="px-4 py-3 text-left font-semibold">Importo</th>
                    <th className="px-4 py-3 text-left font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {presenze.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {format(new Date(p["Data Presenza"]), "dd MMM yyyy", {
                          locale: it,
                        })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {p["Orario Ingresso"] || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
                      <td className="px-4 py-3">
                        {p.Importo ? (
                          <div className="flex items-center gap-1 text-green-700 font-medium">
                            <DollarSign className="w-3 h-3" />
                            {parseFloat(p.Importo as unknown as string).toFixed(2)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                        {p.Note || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
