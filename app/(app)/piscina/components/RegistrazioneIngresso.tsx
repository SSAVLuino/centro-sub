"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle2, Search, Loader2 } from "lucide-react"
import type { Database } from "@/types/database"

type Socio = Database["public"]["Tables"]["BP_soci"]["Row"]

interface RegistrazioneIngressoProps {
  onSuccess?: () => void
}

export default function RegistrazioneIngresso({ onSuccess }: RegistrazioneIngressoProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [soci, setSoci] = useState<Socio[]>([])
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null)
  const [tipoIngresso, setTipoIngresso] = useState<"abbonamento" | "singolo">("abbonamento")
  const [importo, setImporto] = useState("")
  const [note, setNote] = useState("")
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const supabase = createClient()

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

  async function handleRegistraIngresso() {
    if (!selectedSocio) {
      setMessage({ type: "error", text: "Seleziona un socio" })
      return
    }

    if (tipoIngresso === "singolo" && !importo) {
      setMessage({ type: "error", text: "Inserisci l'importo per ingresso singolo" })
      return
    }

    setLoading(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      const time = new Date().toTimeString().split(" ")[0]

      if (tipoIngresso === "abbonamento") {
        // Verificare se esiste pacchetto attivo
        const { data: pacchetto, error: pErr } = await supabase
          .from("SW_Abbonamenti_Piscina")
          .select("*")
          .eq("Socio", selectedSocio.id)
          .eq("Attivo", true)
          .gt("Ingressi Totali", "Ingressi Usati")
          .maybeSingle()
        if (pErr) throw pErr

        if (!pacchetto) {
          setMessage({
            type: "error",
            text: "Nessun pacchetto attivo disponibile per questo socio",
          })
          setLoading(false)
          return
        }

        // Incrementare ingressi usati
        const { error: updateErr } = await supabase
          .from("SW_Abbonamenti_Piscina")
          .update({ "Ingressi Usati": pacchetto["Ingressi Usati"] + 1 })
          .eq("id", pacchetto.id)
        if (updateErr) throw updateErr
      }

      // Registrare presenza
      const { error: presenzaErr } = await supabase
        .from("SW_Presenze_Piscina")
        .insert({
          Socio: selectedSocio.id,
          "Data Presenza": today,
          "Orario Ingresso": time,
          "Tipo Ingresso": tipoIngresso,
          Pagato: tipoIngresso === "singolo",
          Importo: tipoIngresso === "singolo" ? parseFloat(importo) : null,
          Note: note || null,
        })
      if (presenzaErr) throw presenzaErr

      setMessage({ type: "success", text: "Ingresso registrato con successo" })
      setSelectedSocio(null)
      setSearchQuery("")
      setSoci([])
      setTipoIngresso("abbonamento")
      setImporto("")
      setNote("")
      onSuccess?.()

      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error("Errore registrazione:", err)
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Errore durante la registrazione",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-border p-6 space-y-4">
      <h2 className="text-xl font-semibold">Registra Ingresso</h2>

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
              disabled={!!selectedSocio}
            />
          </div>

          {searching && <p className="text-sm text-muted-foreground mt-2">Ricerca in corso...</p>}

          {soci.length > 0 && (
            <div className="mt-2 border rounded-lg divide-y max-h-48 overflow-y-auto">
              {soci.map((socio) => (
                <button
                  key={socio.id}
                  onClick={() => {
                    setSelectedSocio(socio)
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
        {selectedSocio && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900">
              ✓ {selectedSocio.Nome} {selectedSocio.Cognome}
            </p>
            <button
              onClick={() => setSelectedSocio(null)}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
            >
              Cambia socio
            </button>
          </div>
        )}

        {/* Tipo Ingresso */}
        <div>
          <label className="block text-sm font-medium mb-2">Tipo di Ingresso</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTipoIngresso("abbonamento")}
              className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                tipoIngresso === "abbonamento"
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-border bg-white hover:border-blue-300"
              }`}
            >
              Abbonamento
            </button>
            <button
              onClick={() => setTipoIngresso("singolo")}
              className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                tipoIngresso === "singolo"
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-border bg-white hover:border-blue-300"
              }`}
            >
              Ingresso Singolo
            </button>
          </div>
        </div>

        {/* Importo (solo per singolo) */}
        {tipoIngresso === "singolo" && (
          <div>
            <label className="block text-sm font-medium mb-2">Importo €</label>
            <Input
              type="number"
              placeholder="10.00"
              value={importo}
              onChange={(e) => setImporto(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-2">Note (opzionale)</label>
          <Input
            type="text"
            placeholder="Es: lezione privata, ospite..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Button */}
        <Button
          onClick={handleRegistraIngresso}
          disabled={!selectedSocio || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Registrazione...
            </>
          ) : (
            "Registra Ingresso"
          )}
        </Button>
      </div>
    </div>
  )
}
