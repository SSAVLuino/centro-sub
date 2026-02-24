import { createClient } from "@/lib/supabase/server"
import { Users, Wind, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { it } from "date-fns/locale"

export default async function DashboardPage() {
  const supabase = createClient()

  // Parallel queries
  const [
    { count: totalSoci },
    { count: sociAttivi },
    { data: ultimaRicarica },
    { data: ultimeRicariche },
    { data: sociConScadenza },
  ] = await Promise.all([
    supabase.from("BP_soci").select("*", { count: "exact", head: true }),
    supabase.from("BP_soci").select("*", { count: "exact", head: true }).eq("Attivo", true),
    supabase.from("AT_RicaricheCompressore").select("letturaFinale").order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("AT_RicaricheCompressore")
      .select("id, data, mono, bibo, letturaFinale, BP_soci(Nome, Cognome)")
      .order("data", { ascending: false })
      .limit(5),
    supabase.from("BP_soci").select("id, Nome, Cognome, Assicurazione").eq("Attivo", true).eq("Assicurazione", false).limit(5),
  ])

  const stats = [
    {
      label: "Soci Totali",
      value: totalSoci ?? 0,
      sub: `${sociAttivi ?? 0} attivi`,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Ultima Lettura",
      value: ultimaRicarica?.letturaFinale ? `${ultimaRicarica.letturaFinale} bar` : "—",
      sub: "compressore",
      icon: Wind,
      color: "from-teal-500 to-emerald-500",
    },
    {
      label: "Soci Attivi",
      value: sociAttivi ?? 0,
      sub: `su ${totalSoci ?? 0} totali`,
      icon: CheckCircle,
      color: "from-emerald-500 to-green-500",
    },
    {
      label: "Senza Assicurazione",
      value: sociConScadenza?.length ?? 0,
      sub: "da regolarizzare",
      icon: AlertCircle,
      color: "from-orange-500 to-amber-500",
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: it })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-border"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
              {s.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ultime ricariche */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
              Ultime Ricariche Compressore
            </h2>
            <Link href="/compressore" className="text-xs text-primary hover:underline">
              Vedi tutte →
            </Link>
          </div>
          <div className="space-y-3">
            {ultimeRicariche && ultimeRicariche.length > 0 ? (
              ultimeRicariche.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {r.BP_soci ? `${r.BP_soci.Nome} ${r.BP_soci.Cognome}` : "Sconosciuto"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.data ? format(new Date(r.data), "dd MMM yyyy", { locale: it }) : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{r.letturaFinale ?? "—"} bar</p>
                    <p className="text-xs text-muted-foreground">
                      {(r.mono ?? 0) + (r.bibo ?? 0)} bombole
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nessuna ricarica registrata.</p>
            )}
          </div>
        </div>

        {/* Soci senza assicurazione */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
              Soci Senza Assicurazione
            </h2>
            <Link href="/soci" className="text-xs text-primary hover:underline">
              Gestisci →
            </Link>
          </div>
          <div className="space-y-3">
            {sociConScadenza && sociConScadenza.length > 0 ? (
              sociConScadenza.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-full ocean-gradient flex items-center justify-center text-white text-xs font-bold">
                    {s.Nome?.[0]}{s.Cognome?.[0]}
                  </div>
                  <p className="text-sm font-medium">{s.Nome} {s.Cognome}</p>
                  <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    No assicurazione
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Tutti i soci hanno l&apos;assicurazione!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
