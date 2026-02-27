"use client"

<<<<<<< HEAD
import { useState, useMemo } from "react"
import {
  Waves, Users, Package, BarChart3, Plus, Trash2,
  Search, CheckCircle2, AlertCircle, Loader2,
  TrendingUp, LogIn, CalendarCheck
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { canAccess } from "@/lib/roles-client"
import type { UserRole } from "@/lib/roles-client"
import { format, parseISO, eachMonthOfInterval } from "date-fns"
import { it } from "date-fns/locale"

// ── Tipi ────────────────────────────────────────────────────────────────────
type Socio = { id: number; Nome: string; Cognome: string; email?: string }

type Ingresso = {
  id: number
  ora_ingresso: string
  tipo: "pacchetto" | "singolo"
  note: string | null
  socio_id: number
  BP_soci: { id: number; Nome: string; Cognome: string } | null
}

type Pacchetto = {
  id: number
  socio_id: number
  data_acquisto: string
  ingressi_totali: number
  ingressi_usati: number
  note: string | null
  BP_soci: { id: number; Nome: string; Cognome: string } | null
}

type IngressoAnno = {
  id: number
  data_ingresso: string
  tipo: "pacchetto" | "singolo"
  socio_id: number
}

// ── Componente principale ───────────────────────────────────────────────────
export default function PiscinaClient({
  userRole,
  soci,
  ingressiOggi: initialIngressiOggi,
  pacchettiAll: initialPacchetti,
  ingressiAnno,
  annoStart,
  annoEnd,
  socioCorrente,
  giaEntrato: initialGiaEntrato,
}: {
  userRole: UserRole
  soci: Socio[]
  ingressiOggi: Ingresso[]
  pacchettiAll: Pacchetto[]
  ingressiAnno: IngressoAnno[]
  annoStart: string
  annoEnd: string
  socioCorrente: Socio | null
  giaEntrato: boolean
}) {
  const [tab, setTab] = useState<"ingressi" | "pacchetti" | "statistiche">("ingressi")
  const [ingressiOggi, setIngressiOggi] = useState(initialIngressiOggi)
  const [pacchetti, setPacchetti] = useState(initialPacchetti)
  const [ingressiAnnoState, setIngressiAnnoState] = useState(ingressiAnno)
  const [giaEntrato, setGiaEntrato] = useState(initialGiaEntrato)
  const supabase = createClient()

  const pacchettiAttivi = pacchetti.filter(p => p.ingressi_usati < p.ingressi_totali)

  async function refreshIngressiAnno() {
    const { data } = await supabase
      .from("SW_Ingressi_Piscina")
      .select("id, data_ingresso, tipo, socio_id")
      .gte("data_ingresso", annoStart)
      .lte("data_ingresso", annoEnd)
    setIngressiAnnoState((data as IngressoAnno[]) ?? [])
  }

  async function refreshIngressi() {
    const today = new Date().toISOString().split("T")[0]
    const { data } = await supabase
      .from("SW_Ingressi_Piscina")
      .select("id, ora_ingresso, tipo, note, socio_id, BP_soci(id, Nome, Cognome)")
      .eq("data_ingresso", today)
      .order("ora_ingresso", { ascending: true })
    setIngressiOggi((data as Ingresso[]) ?? [])

    // Aggiorna flag giaEntrato per il socio corrente
    if (socioCorrente) {
      const { data: check } = await supabase
        .from("SW_Ingressi_Piscina")
        .select("id")
        .eq("socio_id", socioCorrente.id)
        .eq("data_ingresso", today)
        .maybeSingle()
      setGiaEntrato(!!check)
    }

    // Aggiorna anche stagione (per statistiche sempre fresche)
    await refreshIngressiAnno()
  }

  async function refreshPacchetti() {
    const { data } = await supabase
      .from("SW_Pacchetti_Piscina")
      .select("id, socio_id, data_acquisto, ingressi_totali, ingressi_usati, note, BP_soci(id, Nome, Cognome)")
      .order("data_acquisto", { ascending: false })
    setPacchetti((data as Pacchetto[]) ?? [])
  }

  async function handleTabChange(newTab: "ingressi" | "pacchetti" | "statistiche") {
    setTab(newTab)
    if (newTab === "statistiche") refreshIngressiAnno()
    if (newTab === "pacchetti")   refreshPacchetti()
    if (newTab === "ingressi")    refreshIngressi()
  }

  const isStaffOrAbove = canAccess("Staff", userRole)

  const tabs = [
    { id: "ingressi" as const,    label: "Ingressi Oggi",  icon: LogIn,     visible: true },
    { id: "pacchetti" as const,   label: "Pacchetti",       icon: Package,   visible: isStaffOrAbove },
    { id: "statistiche" as const, label: "Statistiche",     icon: BarChart3, visible: true },
  ].filter(t => t.visible)

  return (
    <div className="space-y-6 animate-fade-in pt-20 md:pt-0">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Waves className="w-8 h-8 text-primary" /> Piscina
        </h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: it })}
        </p>
      </div>

      {/* Stats mini */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Presenti oggi"     value={ingressiOggi.length}   icon={Users}      color="from-blue-500 to-cyan-500" />
        <StatCard label="Pacchetti attivi"  value={pacchettiAttivi.length} icon={Package}    color="from-teal-500 to-emerald-500" />
        <StatCard label="Ingressi stagione" value={ingressiAnnoState.length}    icon={TrendingUp} color="from-violet-500 to-purple-500" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "ingressi" && (
            <TabIngressi
              userRole={userRole}
              soci={soci}
              pacchetti={pacchetti}
              ingressiOggi={ingressiOggi}
              socioCorrente={socioCorrente}
              giaEntrato={giaEntrato}
              onRefresh={() => { refreshIngressi(); refreshPacchetti() }}
            />
          )}
          {tab === "pacchetti" && (
            <TabPacchetti
              userRole={userRole}
              soci={soci}
              pacchetti={pacchetti}
              socioCorrente={socioCorrente}
              onRefresh={refreshPacchetti}
            />
          )}
          {tab === "statistiche" && (
            <TabStatistiche
              ingressiAnno={ingressiAnnoState}
              annoStart={annoStart}
              annoEnd={annoEnd}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{value}</p>
    </div>
  )
}

// ── SocioSearch (solo per Staff+) ────────────────────────────────────────────
function SocioSearch({ soci, onSelect, disabled }: {
  soci: Socio[]
  onSelect: (s: Socio) => void
  disabled?: boolean
}) {
  const [q, setQ] = useState("")

  const results = useMemo(() => {
    if (q.length < 2) return []
    const lower = q.toLowerCase()
    return soci
      .filter(s => `${s.Nome} ${s.Cognome}`.toLowerCase().includes(lower) || s.email?.toLowerCase().includes(lower))
      .slice(0, 8)
  }, [q, soci])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        disabled={disabled}
        placeholder="Cerca per nome o cognome..."
        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {results.map(s => (
            <button
              key={s.id}
              onClick={() => { onSelect(s); setQ("") }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-full ocean-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                {s.Nome[0]}{s.Cognome[0]}
              </div>
              <span className="font-medium">{s.Nome} {s.Cognome}</span>
            </button>
          ))}
        </div>
=======
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
>>>>>>> 41d77cc8f042f6030e1b9b91f035237d2fd665e9
      )}
    </div>
  )
}

<<<<<<< HEAD
// ── AvatarInitials ────────────────────────────────────────────────────────────
function AvatarInitials({ nome, cognome }: { nome?: string; cognome?: string }) {
  return (
    <div className="w-8 h-8 rounded-full ocean-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
      {nome?.[0]}{cognome?.[0]}
    </div>
  )
}

// ── TAB: Ingressi Oggi ────────────────────────────────────────────────────────
function TabIngressi({ userRole, soci, pacchetti, ingressiOggi, socioCorrente, giaEntrato, onRefresh }: {
  userRole: UserRole
  soci: Socio[]
  pacchetti: Pacchetto[]
  ingressiOggi: Ingresso[]
  socioCorrente: Socio | null
  giaEntrato: boolean
  onRefresh: () => void
}) {
  const isStaff = canAccess("Staff", userRole)

  // Socio selezionato: per non-Staff è sempre il socio corrente e non cambia
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(
    socioCorrente
  )
  const [tipo, setTipo] = useState<"pacchetto" | "singolo">("pacchetto")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const supabase = createClient()

  // Pacchetti FIFO disponibili per il socio selezionato
  const pacchettiSocio = useMemo(() => {
    if (!selectedSocio) return []
    return pacchetti
      .filter(p => p.socio_id === selectedSocio.id && p.ingressi_usati < p.ingressi_totali)
      .sort((a, b) => a.data_acquisto.localeCompare(b.data_acquisto))
  }, [selectedSocio, pacchetti])

  const haPacchetti = pacchettiSocio.length > 0

  // Controllo doppio ingresso: il socio selezionato è già entrato oggi?
  const socioGiaEntrato = useMemo(() => {
    if (!selectedSocio) return false
    // Per il socio corrente usiamo il flag server (più affidabile)
    if (socioCorrente && selectedSocio.id === socioCorrente.id) return giaEntrato
    // Per altri soci (Staff che registra per qualcun altro) controlliamo la lista
    return ingressiOggi.some(i => i.socio_id === selectedSocio.id)
  }, [selectedSocio, ingressiOggi, socioCorrente, giaEntrato])

  async function handleRegistra() {
    if (!selectedSocio) return
    if (socioGiaEntrato) {
      setMsg({ ok: false, text: `${selectedSocio.Nome} ${selectedSocio.Cognome} è già entrato oggi` })
      return
    }
    if (tipo === "pacchetto" && !haPacchetti) {
      setMsg({ ok: false, text: "Nessun pacchetto disponibile per questo socio" })
      return
    }

    // Avviso se non è mercoledì (giorno piscina)
    const oggi = new Date().getDay() // 0=dom, 3=mer, 6=sab
    if (oggi !== 3) {
      const giorni = ["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"]
      const confermato = window.confirm(
        `Attenzione: oggi è ${giorni[oggi]}, non mercoledì.\nLa piscina di solito è aperta solo il mercoledì sera.\n\nVuoi registrare l'ingresso lo stesso?`
      )
      if (!confermato) return
    }

    setSaving(true)
    setMsg(null)
    try {
      const { error } = await supabase.rpc("registra_ingresso_piscina", {
        p_socio_id: selectedSocio.id,
        p_tipo: tipo,
        p_note: note || null,
      })
      if (error) throw error
      setMsg({ ok: true, text: `Ingresso registrato per ${selectedSocio.Nome} ${selectedSocio.Cognome}!` })
      // Reset: per non-Staff mantieni il socio selezionato (è sempre lui)
      if (isStaff) setSelectedSocio(null)
      setNote("")
      setTipo("pacchetto")
      onRefresh()
      setTimeout(() => setMsg(null), 4000)
    } catch (e: any) {
      setMsg({ ok: false, text: e.message ?? "Errore durante la registrazione" })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    setDeleting(id)
    await supabase.rpc("cancella_ingresso_piscina", { p_ingresso_id: id })
    setDeleting(null)
    onRefresh()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Form registrazione ── */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-5 space-y-4">
          <h3 className="font-semibold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
            Registra Ingresso
          </h3>

          {msg && (
            <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {msg.ok
                ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              {msg.text}
            </div>
          )}

          {/* Blocco "già entrato oggi" per il socio corrente */}
          {!isStaff && giaEntrato ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CalendarCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-700">Già registrato oggi!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Hai già un ingresso registrato per oggi.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Selezione socio */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Socio</label>

                {/* Non-Staff: vede solo se stesso, campo non modificabile */}
                {!isStaff ? (
                  socioCorrente ? (
                    <div className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-2.5">
                      <AvatarInitials nome={socioCorrente.Nome} cognome={socioCorrente.Cognome} />
                      <span className="text-sm font-medium">{socioCorrente.Nome} {socioCorrente.Cognome}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                      Il tuo profilo non è collegato a nessun socio. Contatta lo Staff.
                    </p>
                  )
                ) : (
                  // Staff: può cercare qualsiasi socio
                  selectedSocio ? (
                    <div className="flex items-center justify-between bg-white border border-border rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <AvatarInitials nome={selectedSocio.Nome} cognome={selectedSocio.Cognome} />
                        <span className="text-sm font-medium">{selectedSocio.Nome} {selectedSocio.Cognome}</span>
                      </div>
                      <button onClick={() => setSelectedSocio(null)} className="text-xs text-primary hover:underline">
                        Cambia
                      </button>
                    </div>
                  ) : (
                    <SocioSearch soci={soci} onSelect={setSelectedSocio} />
                  )
                )}

                {/* Avviso doppio ingresso (Staff che seleziona un socio già entrato) */}
                {isStaff && selectedSocio && socioGiaEntrato && (
                  <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {selectedSocio.Nome} {selectedSocio.Cognome} è già entrato oggi
                  </p>
                )}
              </div>

              {/* Tipo ingresso */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Tipo ingresso</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pacchetto", "singolo"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTipo(t)}
                      className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        tipo === t
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-white text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {t === "pacchetto" ? "📦 Pacchetto" : "💶 Singolo"}
                    </button>
                  ))}
                </div>

                {tipo === "pacchetto" && selectedSocio && (
                  <p className={`mt-2 text-xs ${haPacchetti ? "text-emerald-600" : "text-red-500"}`}>
                    {haPacchetti
                      ? `✓ ${pacchettiSocio[0].ingressi_totali - pacchettiSocio[0].ingressi_usati} ingressi rimasti nel pacchetto più vecchio`
                      : "✗ Nessun pacchetto disponibile"}
                  </p>
                )}
                {tipo === "singolo" && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Pagamento in loco — non scalato da nessun pacchetto
                  </p>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Note (opzionale)</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Es. lezione privata, ospite..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <button
                onClick={handleRegistra}
                disabled={
                  !selectedSocio ||
                  saving ||
                  socioGiaEntrato ||
                  (tipo === "pacchetto" && !haPacchetti) ||
                  (!isStaff && !socioCorrente)
                }
                className="w-full ocean-gradient text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
                  : <><LogIn className="w-4 h-4" /> Registra Ingresso</>}
              </button>
            </>
          )}
        </div>

        {/* ── Lista presenti oggi ── */}
        <div className="space-y-3">
          <h3 className="font-semibold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
            Presenti oggi
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {format(new Date(), "dd MMMM yyyy", { locale: it })} · {ingressiOggi.length} {ingressiOggi.length === 1 ? "persona" : "persone"}
            </span>
          </h3>

          {ingressiOggi.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Waves className="w-10 h-10 mx-auto mb-2 opacity-30" />
              Nessun ingresso registrato oggi
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {ingressiOggi.map(ing => {
                const isMe = socioCorrente && ing.socio_id === socioCorrente.id
                return (
                  <div
                    key={ing.id}
                    className={`border rounded-xl px-4 py-3 flex items-center justify-between transition-colors ${isMe ? "bg-primary/5 border-primary/20" : "bg-white border-border"}`}
                  >
                    <div className="flex items-center gap-3">
                      <AvatarInitials nome={ing.BP_soci?.Nome} cognome={ing.BP_soci?.Cognome} />
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          {ing.BP_soci?.Nome} {ing.BP_soci?.Cognome}
                          {isMe && <span className="text-xs text-primary font-normal">(tu)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ing.ora_ingresso?.slice(0, 5)} ·{" "}
                          <span className={ing.tipo === "pacchetto" ? "text-blue-600" : "text-amber-600"}>
                            {ing.tipo === "pacchetto" ? "Pacchetto" : "Singolo"}
                          </span>
                          {ing.note && ` · ${ing.note}`}
                        </p>
                      </div>
                    </div>
                      {canAccess("Consiglio", userRole) && (
                      <button
                        onClick={() => handleDelete(ing.id)}
                        disabled={deleting === ing.id}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10"
                      >
                        {deleting === ing.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── TAB: Pacchetti ────────────────────────────────────────────────────────────
function TabPacchetti({ userRole, soci, pacchetti, socioCorrente, onRefresh }: {
  userRole: UserRole
  soci: Socio[]
  pacchetti: Pacchetto[]
  socioCorrente: Socio | null
  onRefresh: () => void
}) {
  const isStaff = canAccess("Staff", userRole)
  const [showForm, setShowForm] = useState(false)
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [searchSocio, setSearchSocio] = useState("")
  const supabase = createClient()

  // Non-Staff vede solo i propri pacchetti
  const pacchettiVisibili = isStaff
    ? pacchetti
    : pacchetti.filter(p => socioCorrente && p.socio_id === socioCorrente.id)

  const pacchettiAttivi   = pacchettiVisibili.filter(p => p.ingressi_usati < p.ingressi_totali)
  const pacchettiEsauriti = pacchettiVisibili.filter(p => p.ingressi_usati >= p.ingressi_totali)

  const filteredAttivi = useMemo(() => {
    if (!searchSocio) return pacchettiAttivi
    const q = searchSocio.toLowerCase()
    return pacchettiAttivi.filter(p =>
      `${p.BP_soci?.Nome} ${p.BP_soci?.Cognome}`.toLowerCase().includes(q)
    )
  }, [pacchettiAttivi, searchSocio])

  async function handleCrea() {
    if (!selectedSocio) return
    setSaving(true)
    setMsg(null)
    const { error } = await supabase.from("SW_Pacchetti_Piscina").insert({
      socio_id: selectedSocio.id,
      ingressi_totali: 5,
      ingressi_usati: 0,
      note: note || null,
    })
    setSaving(false)
    if (error) {
      setMsg({ ok: false, text: error.message })
    } else {
      setMsg({ ok: true, text: `Pacchetto creato per ${selectedSocio.Nome} ${selectedSocio.Cognome}` })
      setSelectedSocio(null)
      setNote("")
      setShowForm(false)
      onRefresh()
      setTimeout(() => setMsg(null), 4000)
    }
  }

  async function handleDelete(id: number) {
    setDeleting(id)
    await supabase.from("SW_Pacchetti_Piscina").delete().eq("id", id)
    setDeleting(null)
    onRefresh()
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{pacchettiAttivi.length}</strong> attivi ·{" "}
          <strong className="text-foreground">{pacchettiEsauriti.length}</strong> esauriti
        </p>
        {/* Solo Staff può creare pacchetti */}
        {isStaff && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="ocean-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Nuovo Pacchetto
          </button>
        )}
      </div>

      {msg && (
        <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          {msg.text}
        </div>
      )}

      {/* Form nuovo pacchetto */}
      {showForm && isStaff && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold" style={{ fontFamily: "'Syne', sans-serif" }}>
            Nuovo Pacchetto (5 ingressi)
          </h3>
          <div>
            <label className="block text-sm font-medium mb-1.5">Socio</label>
            {selectedSocio ? (
              <div className="flex items-center justify-between bg-white border border-border rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <AvatarInitials nome={selectedSocio.Nome} cognome={selectedSocio.Cognome} />
                  <span className="text-sm font-medium">{selectedSocio.Nome} {selectedSocio.Cognome}</span>
                </div>
                <button onClick={() => setSelectedSocio(null)} className="text-xs text-primary hover:underline">Cambia</button>
              </div>
            ) : (
              <SocioSearch soci={soci} onSelect={setSelectedSocio} />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Note (opzionale)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Annotazioni..."
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(false); setSelectedSocio(null); setNote("") }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all"
            >
              Annulla
            </button>
            <button
              onClick={handleCrea}
              disabled={!selectedSocio || saving}
              className="flex-1 ocean-gradient text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvo...</> : "Crea Pacchetto"}
            </button>
          </div>
        </div>
      )}

      {/* Filtro (solo Staff) */}
      {isStaff && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchSocio}
            onChange={e => setSearchSocio(e.target.value)}
            placeholder="Filtra per nome socio..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
=======
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
>>>>>>> 41d77cc8f042f6030e1b9b91f035237d2fd665e9
          />
        </div>
      )}

<<<<<<< HEAD
      {/* Griglia pacchetti attivi */}
      {filteredAttivi.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
          {isStaff ? "Nessun pacchetto attivo" : "Non hai pacchetti attivi — contatta lo Staff"}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAttivi.map(p => {
            const rimasti = p.ingressi_totali - p.ingressi_usati
            const perc = (p.ingressi_usati / p.ingressi_totali) * 100
            const isOwn = socioCorrente && p.socio_id === socioCorrente.id
            return (
              <div
                key={p.id}
                className={`border rounded-2xl p-5 space-y-3 hover:shadow-sm transition-shadow ${isOwn ? "bg-primary/5 border-primary/20" : "bg-white border-border"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <AvatarInitials nome={p.BP_soci?.Nome} cognome={p.BP_soci?.Cognome} />
                    <div>
                      <p className="font-semibold text-sm">
                        {p.BP_soci?.Nome} {p.BP_soci?.Cognome}
                        {isOwn && <span className="ml-1.5 text-xs text-primary font-normal">(tu)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Acquistato: {format(parseISO(p.data_acquisto), "dd MMM yyyy", { locale: it })}
                      </p>
                    </div>
                  </div>
                  {canAccess("Consiglio", userRole) && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10"
                    >
                      {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Barra progresso */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{p.ingressi_usati}/{p.ingressi_totali} usati</span>
                    <span className="font-semibold text-emerald-600">{rimasti} rimasti</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all bg-gradient-to-r from-blue-400 to-cyan-400"
                      style={{ width: `${perc}%` }}
                    />
                  </div>
                </div>

                {/* Pallini ingressi */}
                <div className="flex gap-1.5">
                  {Array.from({ length: p.ingressi_totali }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        i < p.ingressi_usati
                          ? "bg-primary/20 text-primary"
                          : "bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      {i < p.ingressi_usati ? "✓" : "○"}
                    </div>
                  ))}
                </div>

                {p.note && <p className="text-xs text-muted-foreground italic">{p.note}</p>}
              </div>
            )
          })}
        </div>
      )}

      {/* Esauriti collassati */}
      {pacchettiEsauriti.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground select-none list-none flex items-center gap-2 py-2">
            <span className="group-open:rotate-90 transition-transform inline-block">›</span>
            {pacchettiEsauriti.length} pacchetti esauriti
          </summary>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {pacchettiEsauriti.map(p => (
              <div key={p.id} className="bg-secondary/50 border border-border rounded-2xl p-4 opacity-60">
                <p className="text-sm font-medium">{p.BP_soci?.Nome} {p.BP_soci?.Cognome}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.ingressi_totali}/{p.ingressi_totali} ingressi usati · {format(parseISO(p.data_acquisto), "dd MMM yyyy", { locale: it })}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}
=======
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
>>>>>>> 41d77cc8f042f6030e1b9b91f035237d2fd665e9
    </div>
  )
}

<<<<<<< HEAD
// ── TAB: Statistiche ──────────────────────────────────────────────────────────
function TabStatistiche({ ingressiAnno, annoStart, annoEnd }: {
  ingressiAnno: IngressoAnno[]
  annoStart: string
  annoEnd: string
}) {
  const mesiStagione = useMemo(() =>
    eachMonthOfInterval({ start: parseISO(annoStart), end: parseISO(annoEnd) }),
  [annoStart, annoEnd])

  const perMese = useMemo(() =>
    mesiStagione.map(mese => {
      const meseFmt = format(mese, "yyyy-MM")
      const entries = ingressiAnno.filter(i => i.data_ingresso.startsWith(meseFmt))
      return {
        mese,
        totale:    entries.length,
        pacchetto: entries.filter(i => i.tipo === "pacchetto").length,
        singolo:   entries.filter(i => i.tipo === "singolo").length,
      }
    }),
  [mesiStagione, ingressiAnno])

  const maxVal      = Math.max(...perMese.map(m => m.totale), 1)
  const totAnno     = ingressiAnno.length
  const totPacchetto = ingressiAnno.filter(i => i.tipo === "pacchetto").length
  const totSingolo  = ingressiAnno.filter(i => i.tipo === "singolo").length
  const labelAnno   = `Stagione ${parseISO(annoStart).getFullYear()}–${parseISO(annoEnd).getFullYear()}`
  const bestMese    = perMese.reduce((a, b) => a.totale >= b.totale ? a : b)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
          {labelAnno}
        </h3>
        <span className="text-xs text-muted-foreground">
          {format(parseISO(annoStart), "MMMM yyyy", { locale: it })} – {format(parseISO(annoEnd), "MMMM yyyy", { locale: it })}
        </span>
      </div>

      {/* Riepilogo */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Ingressi totali", value: totAnno,      color: "text-primary" },
          { label: "Da pacchetto",    value: totPacchetto, color: "text-blue-600" },
          { label: "Singoli",         value: totSingolo,   color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-border rounded-2xl p-5 text-center shadow-sm">
            <p className={`text-3xl font-bold ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grafico a barre */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
        <h4 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wide">
          Ingressi per mese
        </h4>
        <div className="space-y-3">
          {perMese.map(({ mese, totale, pacchetto, singolo }) => (
            <div key={mese.toISOString()} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16 shrink-0">
                {format(mese, "MMM yy", { locale: it })}
              </span>
              <div className="flex-1 relative h-7 bg-secondary rounded-lg overflow-hidden">
                {totale > 0 && (
                  <>
                    <div
                      className="absolute inset-y-0 left-0 bg-blue-400/70 rounded-lg transition-all"
                      style={{ width: `${(pacchetto / maxVal) * 100}%` }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 bg-amber-400/70 rounded-lg transition-all"
                      style={{ width: `${(singolo / maxVal) * 100}%`, marginLeft: `${(pacchetto / maxVal) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <span className="text-xs font-semibold w-6 text-right">{totale || "—"}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded bg-blue-400/70" /> Pacchetto
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded bg-amber-400/70" /> Singolo
          </div>
        </div>
      </div>

      {/* Mese top */}
      {totAnno > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl ocean-gradient flex items-center justify-center text-white shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mese con più ingressi</p>
            <p className="font-bold text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
              {format(bestMese.mese, "MMMM yyyy", { locale: it })}
            </p>
            <p className="text-sm text-muted-foreground">{bestMese.totale} ingressi</p>
          </div>
        </div>
=======
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
>>>>>>> 41d77cc8f042f6030e1b9b91f035237d2fd665e9
      )}
    </div>
  )
}
