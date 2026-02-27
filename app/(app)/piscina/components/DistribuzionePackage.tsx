"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Plus, Trash2, Search, Loader2, CheckCircle2, Calendar } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import type { Database } from "@/types/database"

type Socio = Database["public"]["Tables"]["BP_soci"]["Row"]
type Pacchetto = Database["public"]["Tables"]["SW_Abbonamenti_Piscina"]["Row"] & {
  BP_soci: Socio
}

interface FormData {
  socio: Socio | null
  dataScadenza: string
}

export default function DistribuzionePackage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [soci, setSoci] = useState<Socio[]>([])
  const [formData, setFormData] = useState<FormData>({
    socio: null,
    dataScadenza: "",
  })
  const [pacchetti, setPacchetti] = useState<Pacchetto[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPacchetti()
  }, [])

  async function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value
    setSearchQuery(query)
    if (query.length < 2) {
      setSoci([])
      return
    }
    setSearching(true)
    try {
      const { data, error } = await supabase
        .from("BP_soci")
        .select("id, Nome, Cognome, Email")
        .or(`Nome.ilike.%${query}%,Cognome.ilike.%${query}%`)
        .limit(10)
      if (error) throw error
      setSoci(data || [])
    } catch (err) {
      console.error("Errore ricerca:", err)
    } finally {
      setSearching(false)
    }
  }

  async function loadPacchetti() {
    try {
      const { data, error } = await supabase
        .from("SW_Abbonamenti_Piscina")
        .select("*, BP_soci(*)")
        .eq("Attivo", true)
        .order("created_at", { ascending: false })
      if (error) throw error
      setPacchetti((data as unknown as Pacchetto[]) || [])
    } catch (err) {
      console.error("Errore caricamento pacchetti:", err)
    }
  }

  async function handleCreatePackage() {
    if (!formData.socio) {
      setMessage({ type: "error", text: "Seleziona un socio" })
      return
    }
    if (!formData.dataScadenza) {
      setMessage({ type: "error", text: "Inserisci la data di scadenza" })
      return
    }

    setLoading(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      const { data, error } = await supabase
        .from("SW_Abbonamenti_Piscina")
        .insert({
          Socio: formData.socio.id,
          "Data Acquisto": today,
          "Ingressi Totali": 5,
          "Ingressi Usati": 0,
          "Data Scadenza": formData.dataScadenza,
          Attivo: true,
        })
        .select()

      if (error) throw error

      setMessage({ type: "success", text: "Pacchetto creato con successo" })
      setFormData({ socio: null, dataScadenza: "" })
      setSearchQuery("")
      setSoci([])
      loadPacchetti()

      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error("Errore creazione pacchetto:", err)
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Errore durante la creazione",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletePackage(id: number) {
    if (!confirm("Eliminare questo pacchetto?")) return

    setDeleting(id)
    try {
      const { error } = await supabase
        .from("SW_Abbonamenti_Piscina")
        .update({ Attivo: false })
        .eq("id", id)
      if (error) throw error

      loadPacchetti()
      setMessage({ type: "success", text: "Pacchetto disattivato" })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error("Errore eliminazione:", err)
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Errore durante l'eliminazione",
      })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Form Creazione */}
      <div className="bg-white rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Crea Nuovo Pacchetto</h2>

        {message && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm ${
                message.type === "success" ? "text-green-700" : "text-red-700"
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Ricerca Socio */}
          <div>
            <label className="block text-sm font-medium mb-2">Cerca Socio</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Nome o cognome..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-9"
                disabled={!!formData.socio}
              />
            </div>

            {searching && <p className="text-sm text-muted-foreground mt-2">Ricerca in corso...</p>}

            {soci.length > 0 && (
              <div className="mt-2 border rounded-lg divide-y max-h-48 overflow-y-auto">
                {soci.map((socio) => (
                  <button
                    key={socio.id}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, socio }))
                      setSearchQuery("")
                      setSoci([])
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-primary/5 transition-colors text-sm"
                  >
                    <p className="font-medium">
                      {socio.Nome} {socio.Cognome}
                    </p>
                    <p className="text-xs text-muted-foreground">{socio.Email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Socio Selezionato */}
          {formData.socio && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">
                ✓ {formData.socio.Nome} {formData.socio.Cognome}
              </p>
              <button
                onClick={() => setFormData((prev) => ({ ...prev, socio: null }))}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
              >
                Cambia socio
              </button>
            </div>
          )}

          {/* Data Scadenza */}
          <div>
            <label className="block text-sm font-medium mb-2">Data Scadenza Pacchetto</label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={formData.dataScadenza}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dataScadenza: e.target.value }))
                }
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Standard: 12 mesi dalla data di acquisto
            </p>
          </div>

          {/* Button */}
          <Button
            onClick={handleCreatePackage}
            disabled={!formData.socio || !formData.dataScadenza || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creazione...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Crea Pacchetto da 5 Ingressi
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lista Pacchetti */}
      <div className="bg-white rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Pacchetti Attivi</h2>

        {pacchetti.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nessun pacchetto attivo</p>
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
                  className={`border rounded-lg p-4 space-y-3 ${
                    isScaduto ? "bg-red-50 border-red-200" : "hover:border-primary transition-colors"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {p.BP_soci.Nome} {p.BP_soci.Cognome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Acquistato:{" "}
                        {format(new Date(p["Data Acquisto"]), "dd MMM yyyy", { locale: it })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeletePackage(p.id)}
                      disabled={deleting === p.id}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Ingressi: {p["Ingressi Usati"]}/{p["Ingressi Totali"]}
                      </span>
                      <span className="font-medium">{ingressiRimasti} rimasti</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isScaduto ? "bg-red-500" : "bg-green-500"
                        }`}
                        style={{ width: `${percentuale}%` }}
                      />
                    </div>
                  </div>

                  {p["Data Scadenza"] && (
                    <p
                      className={`text-xs ${
                        isScaduto ? "text-red-600 font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      Scadenza:{" "}
                      {format(new Date(p["Data Scadenza"]), "dd MMM yyyy", { locale: it })}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
