"use client"

import { useState, useMemo } from "react"
import { FileText, CheckCircle, XCircle, AlertTriangle, Search, ExternalLink } from "lucide-react"
import type { UserRole } from "@/lib/roles-client"
import { useSignedUrls } from "@/lib/useSignedUrl"

const AVATAR_BASE_URL = process.env.NEXT_PUBLIC_AVATAR_BASE_URL ?? ""

type Certificato = {
  id: number
  socio: number | null
  "Attività subacquea": boolean | null
  "Data visita": string
  "Data scadenza": string | null
  PDF: string | null
  created_at: string
}
type SocioRef = { id: number; Nome: string | null; Cognome: string | null; Avatar: string | null }

type Filter = "tutti" | "valido" | "in_scadenza" | "scaduto"

interface Props {
  certificati: Certificato[]
  soci: SocioRef[]
  userRole: UserRole
}

export default function CertificatiClient({ certificati, soci }: Props) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("tutti")

  const today    = new Date().toISOString().split("T")[0]
  const in30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  // Mappa id → socio per lookup veloce
  const sociMap = useMemo(() => {
    const m = new Map<number, SocioRef>()
    for (const s of soci) m.set(s.id, s)
    return m
  }, [soci])

  // Per ogni socio teniamo solo il certificato più recente (già ordinati DESC per Data visita)
  const certPerSocio = useMemo(() => {
    const m = new Map<number, Certificato>()
    for (const cert of certificati) {
      if (!cert.socio) continue
      if (!m.has(cert.socio)) m.set(cert.socio, cert)
    }
    return m
  }, [certificati])

  function getStatus(cert: Certificato): "valido" | "in_scadenza" | "scaduto" {
    const scad = cert["Data scadenza"]
    if (!scad || scad < today)  return "scaduto"
    if (scad <= in30days)       return "in_scadenza"
    return "valido"
  }

  const stats = useMemo(() => {
    let validi = 0, inScadenza = 0, scaduti = 0
    for (const cert of certPerSocio.values()) {
      const s = getStatus(cert)
      if (s === "valido")           validi++
      else if (s === "in_scadenza") inScadenza++
      else                          scaduti++
    }
    return { totale: certPerSocio.size, validi, inScadenza, scaduti }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certPerSocio])

  const rows = useMemo(() => {
    return Array.from(certPerSocio.entries())
      .map(([socioId, cert]) => ({
        cert,
        socio: sociMap.get(socioId) ?? null,
        status: getStatus(cert),
      }))
      .filter(({ socio, status }) => {
        if (!socio) return false
        const nome = `${socio.Nome ?? ""} ${socio.Cognome ?? ""}`.toLowerCase()
        const matchSearch = !search || nome.includes(search.toLowerCase())
        const matchFilter = filter === "tutti" || status === filter
        return matchSearch && matchFilter
      })
      .sort((a, b) => {
        const na = `${a.socio?.Cognome} ${a.socio?.Nome}`.toLowerCase()
        const nb = `${b.socio?.Cognome} ${b.socio?.Nome}`.toLowerCase()
        return na.localeCompare(nb)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certPerSocio, sociMap, search, filter])

  // Signed URL per tutti i PDF visibili
  const pdfPaths = useMemo(() => rows.map(r => r.cert.PDF), [rows])
  const pdfUrls  = useSignedUrls("Certificati", pdfPaths)

  function formatDate(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const statsCards = [
    { label: "Con certificato", value: stats.totale,     sub: "soci nel sistema",   icon: <FileText className="w-4 h-4 text-white" />,       gradient: "from-teal-500 to-emerald-500" },
    { label: "Validi",          value: stats.validi,     sub: "certificati attivi", icon: <CheckCircle className="w-4 h-4 text-white" />,     gradient: "from-emerald-500 to-green-500" },
    { label: "In scadenza",     value: stats.inScadenza, sub: "entro 30 giorni",    icon: <AlertTriangle className="w-4 h-4 text-white" />,   gradient: "from-amber-500 to-orange-500" },
    { label: "Scaduti",         value: stats.scaduti,    sub: "da rinnovare",       icon: <XCircle className="w-4 h-4 text-white" />,         gradient: "from-red-500 to-rose-500" },
  ]

  const filterButtons: { key: Filter; label: string; color: string }[] = [
    { key: "tutti",       label: "Tutti",       color: "" },
    { key: "valido",      label: "Validi",      color: "text-emerald-700" },
    { key: "in_scadenza", label: "In scadenza", color: "text-amber-700" },
    { key: "scaduto",     label: "Scaduti",     color: "text-red-700" },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Certificati Medici</h1>
        <p className="text-muted-foreground mt-1">Soci con almeno un certificato caricato</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statsCards.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filtri e ricerca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per nome..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filterButtons.map(({ key, label, color }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === key
                  ? "ocean-gradient text-white shadow-sm"
                  : `bg-white border border-border hover:bg-secondary ${color || "text-muted-foreground"}`
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Socio</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Stato</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Data visita</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Scadenza</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">Subacquea</th>
                <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    {search || filter !== "tutti" ? "Nessun risultato per i filtri applicati." : "Nessun certificato caricato."}
                  </td>
                </tr>
              ) : rows.map(({ cert, socio, status }) => (
                <tr key={cert.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full ocean-gradient flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                        {socio?.Avatar
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={`${AVATAR_BASE_URL}${socio.Avatar}`} alt="" className="w-full h-full object-cover" />
                          : <>{socio?.Nome?.[0] ?? "?"}{socio?.Cognome?.[0] ?? ""}</>}
                      </div>
                      <p className="font-medium">{socio?.Nome} {socio?.Cognome}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={status} /></td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(cert["Data visita"])}</td>
                  <td className="px-5 py-3.5">
                    {cert["Data scadenza"] ? (
                      <span className={`text-sm font-medium ${
                        status === "scaduto"     ? "text-red-600" :
                        status === "in_scadenza" ? "text-amber-600" : "text-emerald-600"
                      }`}>{formatDate(cert["Data scadenza"])}</span>
                    ) : <span className="text-sm text-muted-foreground">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {cert["Attività subacquea"]
                      ? <span className="inline-flex items-center gap-1 text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full font-medium">✓ Sì</span>
                      : <span className="text-xs text-muted-foreground">No</span>}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {cert.PDF ? (
                      pdfUrls.get(cert.PDF)
                        ? <a href={pdfUrls.get(cert.PDF)!} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                            <ExternalLink className="w-3.5 h-3.5" /> Apri
                          </a>
                        : <span className="text-xs text-muted-foreground animate-pulse">...</span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 0 && (
          <div className="px-5 py-3 border-t border-border bg-secondary/30 text-xs text-muted-foreground">
            {rows.length} {rows.length === 1 ? "socio" : "soci"} visualizzati
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: "valido" | "in_scadenza" | "scaduto" }) {
  const config = {
    valido:      { label: "Valido",      className: "bg-emerald-50 text-emerald-700", icon: <CheckCircle className="w-3 h-3" /> },
    in_scadenza: { label: "In scadenza", className: "bg-amber-50 text-amber-700",    icon: <AlertTriangle className="w-3 h-3" /> },
    scaduto:     { label: "Scaduto",     className: "bg-red-50 text-red-700",        icon: <XCircle className="w-3 h-3" /> },
  }
  const { label, className, icon } = config[status]
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${className}`}>
      {icon} {label}
    </span>
  )
}
