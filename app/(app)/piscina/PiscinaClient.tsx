"use client"

import { useState, useEffect } from "react"
import { Waves, Package, UserPlus, BarChart3, Loader2, AlertCircle, Calendar, Clock, Search, Plus, Trash2, CheckCircle2, DollarSign, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface PiscinaStats {
  oggiPresenti: number
  pachettiAttivi: number
}

type Socio = any
type Pacchetto = any
type Presenza = any

export default function PiscinaClient() {
  const [activeTab, setActiveTab] = useState("registrazione")
  const [stats, setStats] = useState<PiscinaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      setLoading(true)
      const today = new Date().toISOString().split("T")[0]
      
      const { data: oggiData } = await supabase
        .from("SW_Presenze_Piscina")
        .select("id")
        .eq("Data Presenza", today)

      const { data: pacchetti } = await supabase
        .from("SW_Abbonamenti_Piscina")
        .select("id")
        .eq("Attivo", true)

      setStats({
        oggiPresenti: oggiData?.length ?? 0,
        pachettiAttivi: pacchetti?.length ?? 0,
      })
    } catch (err) {
      console.error("Errore caricamento stats:", err)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: "registrazione", label: "Registra Ingresso", icon: UserPlus },
    { id: "distribuzione", label: "Distribuzione Pacchetti", icon: Package },
    { id: "statistiche", label: "Presenze per Data", icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Waves className="w-8 h-8 text-blue-600" />
          Gestione Piscina
        </h1>
        <p className="text-muted-foreground mt-1">Gestisci ingressi, pacchetti e presenze in piscina</p>
      </div>

      {/* Stats Cards */}
      {!loading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Presenti Oggi</p>
            <p className="text-2xl font-bold mt-1">{stats.oggiPresenti}</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-3">
              <Package className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Pacchetti Attivi</p>
            <p className="text-2xl font-bold mt-1">{stats.pachettiAttivi}</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Waves className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Info</p>
            <p className="text-2xl font-bold mt-1">—</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Tabs */}
      {!loading && (
        <>
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="flex border-b border-border overflow-x-auto">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                    activeTab === id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
            <div className="p-6">
              {activeTab === "registrazione" && <TabRegistrazione onSuccess={() => loadStats()} />}
              {activeTab === "distribuzione" && <TabDistribuzione />}
              {activeTab === "statistiche" && <TabStatistiche />}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Tab: Registrazione Ingresso ──────────────────────────────────────────
function TabRegistrazione({ onSuccess }: { onSuccess?: () => void }) {
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

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (query.length < 2) {
      setSoci([])
      return
    }
    setSearching(true)
    try {
      const { data } = await supabase
        .from("BP_soci")
        .select("id, Nome, Cognome, Email")
        .or(`Nome.ilike.%${query}%,Cognome.ilike.%${query}%`)
        .limit(10)
      setSoci(data || [])
    } catch (err) {
      console.error("Errore ricerca:", err)
    } finally {
      setSearching(false)
    }
  }

  async function handleRegistra() {
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
        const { data: pacchetto, error: pErr } = await supabase
          .from("SW_Abbonamenti_Piscina")
          .select("*")
          .eq("Socio", selectedSocio.id)
          .eq("Attivo", true)
          .gt("Ingressi Totali", "Ingressi Usati")
          .maybeSingle()

        if (pErr || !pacchetto) {
          setMessage({
            type: "error",
            text: "Nessun pacchetto attivo disponibile per questo socio",
          })
          setLoading(false)
          return
        }

        await supabase
          .from("SW_Abbonamenti_Piscina")
          .update({ "Ingressi Usati": pacchetto["Ingressi Usati"] + 1 })
          .eq("id", pacchetto.id)
      }

      await supabase.from("SW_Presenze_Piscina").insert({
        Socio: selectedSocio.id,
        "Data Presenza": today,
        "Orario Ingresso": time,
        "Tipo Ingresso": tipoIngresso,
        Pagato: tipoIngresso === "singolo",
        Importo: tipoIngresso === "singolo" ? parseFloat(importo) : null,
        Note: note || null,
      })

      setMessage({ type: "success", text: "Ingresso registrato con successo" })
      setSelectedSocio(null)
      setSearchQuery("")
      setSoci([])
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
    <div className="max-w-xl space-y-4">
      {message && (
        <div
          className={`p-4 rounded-lg border flex items-start gap-3 ${
            message.type === "success"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${message.type === "success" ? "text-green-700" : "text-red-700"}`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Ricerca Socio */}
      <div>
        <label className="block text-sm font-medium mb-2">Cerca Socio</label>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Nome o cognome..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={!!selectedSocio}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-muted disabled:cursor-not-allowed"
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

      {/* Importo */}
      {tipoIngresso === "singolo" && (
        <div>
          <label className="block text-sm font-medium mb-2">Importo €</label>
          <input
            type="number"
            placeholder="10.00"
            value={importo}
            onChange={(e) => setImporto(e.target.value)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      {/* Note */}
      <div>
        <label className="block text-sm font-medium mb-2">Note (opzionale)</label>
        <input
          type="text"
          placeholder="Es: lezione privata, ospite..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Button */}
      <button
        onClick={handleRegistra}
        disabled={!selectedSocio || loading}
        className="w-full px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Registrazione...
          </>
        ) : (
          "Registra Ingresso"
        )}
      </button>
    </div>
  )
}

// ── Tab: Distribuzione Pacchetti ─────────────────────────────────────────
function TabDistribuzione() {
  const [searchQuery, setSearchQuery] = useState("")
  const [soci, setSoci] = useState<Socio[]>([])
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null)
  const [dataScadenza, setDataScadenza] = useState("")
  const [pacchetti, setPacchetti] = useState<Pacchetto[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPacchetti()
  }, [])

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (query.length < 2) {
      setSoci([])
      return
    }
    setSearching(true)
    try {
      const { data } = await supabase
        .from("BP_soci")
        .select("id, Nome, Cognome, Email")
        .or(`Nome.ilike.%${query}%,Cognome.ilike.%${query}%`)
        .limit(10)
      setSoci(data || [])
    } catch (err) {
      console.error("Errore ricerca:", err)
    } finally {
      setSearching(false)
    }
  }

  async function loadPacchetti() {
    try {
      const { data } = await supabase
        .from("SW_Abbonamenti_Piscina")
        .select("*, BP_soci(Nome, Cognome)")
        .eq("Attivo", true)
        .order("created_at", { ascending: false })
      setPacchetti(data || [])
    } catch (err) {
      console.error("Errore caricamento pacchetti:", err)
    }
  }

  async function handleCreate() {
    if (!selectedSocio) {
      setMessage({ type: "error", text: "Seleziona un socio" })
      return
    }
    if (!dataScadenza) {
      setMessage({ type: "error", text: "Inserisci la data di scadenza" })
      return
    }

    setLoading(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      await supabase.from("SW_Abbonamenti_Piscina").insert({
        Socio: selectedSocio.id,
        "Data Acquisto": today,
        "Ingressi Totali": 5,
        "Ingressi Usati": 0,
        "Data Scadenza": dataScadenza,
        Attivo: true,
      })

      setMessage({ type: "success", text: "Pacchetto creato con successo" })
      setSelectedSocio(null)
      setSearchQuery("")
      setDataScadenza("")
      loadPacchetti()
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error("Errore creazione:", err)
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Errore durante la creazione",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Eliminare questo pacchetto?")) return

    setDeleting(id)
    try {
      await supabase
        .from("SW_Abbonamenti_Piscina")
        .update({ Attivo: false })
        .eq("id", id)

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
      {/* Form */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold">Crea Nuovo Pacchetto</h3>

        {message && (
          <div
            className={`p-4 rounded-lg border flex items-start gap-3 ${
              message.type === "success"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${message.type === "success" ? "text-green-700" : "text-red-700"}`}>
              {message.text}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Cerca Socio</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Nome o cognome..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={!!selectedSocio}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-muted disabled:cursor-not-allowed"
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

        {selectedSocio && (
          <div className="bg-white rounded-lg p-3 border border-border">
            <p className="text-sm font-medium">
              ✓ {selectedSocio.Nome} {selectedSocio.Cognome}
            </p>
            <button
              onClick={() => setSelectedSocio(null)}
              className="text-xs text-primary hover:underline mt-1"
            >
              Cambia socio
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Data Scadenza</label>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={dataScadenza}
              onChange={(e) => setDataScadenza(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!selectedSocio || !dataScadenza || loading}
          className="w-full px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creazione...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Crea Pacchetto da 5 Ingressi
            </>
          )}
        </button>
      </div>

      {/* Lista Pacchetti */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Pacchetti Attivi</h3>

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
                  className={`border rounded-2xl p-5 space-y-4 ${
                    isScaduto ? "bg-red-50 border-red-200" : "bg-white border-border hover:shadow-sm transition-shadow"
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
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Ingressi: {p["Ingressi Usati"]}/{p["Ingressi Totali"]}
                      </span>
                      <span className="font-medium text-green-600">{ingressiRimasti} rimasti</span>
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

// ── Tab: Statistiche Presenze ────────────────────────────────────────────
function TabStatistiche() {
  const [dataSelezionata, setDataSelezionata] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [presenze, setPresenze] = useState<Presenza[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadPresenze()
  }, [dataSelezionata])

  async function loadPresenze() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from("SW_Presenze_Piscina")
        .select("*, BP_soci(Nome, Cognome)")
        .eq("Data Presenza", dataSelezionata)
        .order("Orario Ingresso", { ascending: true })
      setPresenze(data || [])
    } catch (err) {
      console.error("Errore caricamento statistiche:", err)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    totale: presenze.length,
    abbonamento: presenze.filter((p) => p["Tipo Ingresso"] === "abbonamento").length,
    singoli: presenze.filter((p) => p["Tipo Ingresso"] === "singolo").length,
    introito: presenze
      .filter((p) => p["Tipo Ingresso"] === "singolo" && p.Importo)
      .reduce((acc, p) => acc + (parseFloat(p.Importo) || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Selezione Data */}
      <div className="flex gap-4 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-2">Seleziona Data</label>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={dataSelezionata}
              onChange={(e) => setDataSelezionata(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <button
          onClick={() => setDataSelezionata(new Date().toISOString().split("T")[0])}
          className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-all"
        >
          Oggi
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Cards Statistiche */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Persone Presenti</p>
              <p className="text-2xl font-bold mt-1">{stats.totale}</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-3">
                <Package className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Abbonamenti</p>
              <p className="text-2xl font-bold mt-1">{stats.abbonamento}</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Singoli</p>
              <p className="text-2xl font-bold mt-1">{stats.singoli}</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Introito Singoli</p>
              <p className="text-2xl font-bold mt-1">€ {stats.introito.toFixed(2)}</p>
            </div>
          </div>

          {/* Tabella Presenze */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">
                Dettaglio Presenze -{" "}
                {format(new Date(dataSelezionata), "dd MMMM yyyy", { locale: it })}
              </h3>
            </div>

            {presenze.length === 0 ? (
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
                    {presenze.map((p) => (
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
                          {p.Importo ? `€ ${parseFloat(p.Importo).toFixed(2)}` : "—"}
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
