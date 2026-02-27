import { createClient } from "@/lib/supabase/server"
import { getUserRole, hasAccess } from "@/lib/roles"
import {
  Users, Wind, Waves, Package,
  CheckCircle, TrendingUp, Calendar
} from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase   = createClient()
  const userRole   = await getUserRole()
  const isStaff    = hasAccess("Staff", userRole)
  const isConsiglio = hasAccess("Consiglio", userRole)

  const now           = new Date()
  const today         = now.toISOString().split("T")[0]
  const isAfterSep    = now.getMonth() >= 8
  const annoStart     = isAfterSep ? `${now.getFullYear()}-09-01` : `${now.getFullYear() - 1}-09-01`
  const annoEnd       = isAfterSep ? `${now.getFullYear() + 1}-06-30` : `${now.getFullYear()}-06-30`

  const [
    { count: totalSoci },
    { count: sociAttivi },
    { data: ultimaRicarica },
    { data: ultimeRicariche },
    { data: ingressiOggi },
    { count: ingressiStagione },
    { count: pacchettiAttivi },
    { data: prossimeScadenzeCert },
  ] = await Promise.all([
    supabase.from("BP_soci").select("*", { count: "exact", head: true }),
    supabase.from("BP_soci").select("*", { count: "exact", head: true }).eq("Attivo", true),
    supabase.from("AT_RicaricheCompressore").select("letturaFinale, data").order("data", { ascending: false }).limit(1).single(),
    supabase.from("AT_RicaricheCompressore")
      .select("id, data, mono, bibo, letturaFinale, BP_soci(Nome, Cognome)")
      .order("data", { ascending: false })
      .limit(4),
    supabase.from("SW_Ingressi_Piscina")
      .select("id, ora_ingresso, tipo, BP_soci(Nome, Cognome)")
      .eq("data_ingresso", today)
      .order("ora_ingresso", { ascending: false }),
    supabase.from("SW_Ingressi_Piscina")
      .select("*", { count: "exact", head: true })
      .gte("data_ingresso", annoStart)
      .lte("data_ingresso", annoEnd),
    supabase.from("SW_Pacchetti_Piscina")
      .select("*", { count: "exact", head: true })
      .filter("ingressi_usati", "lt", "ingressi_totali"),
    // certificati in scadenza nei prossimi 30 gg (solo Consiglio+)
    isConsiglio
      ? supabase.from("BP_certificati")
          .select("id, \"Data scadenza\", BP_soci(Nome, Cognome)")
          .gte("Data scadenza", today)
          .lte("Data scadenza", new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
          .order("Data scadenza", { ascending: true })
          .limit(4)
      : Promise.resolve({ data: [] }),
  ])

  const labelAnno = `${parseISO(annoStart).getFullYear()}/${String(parseISO(annoEnd).getFullYear()).slice(2)}`

  return (
    <div className="space-y-8 animate-fade-in pt-20 md:pt-0">

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1 capitalize">
          {format(now, "EEEE d MMMM yyyy", { locale: it })}
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Soci attivi"
          value={`${sociAttivi ?? 0}`}
          sub={`su ${totalSoci ?? 0} totali`}
          icon={Users}
          color="from-blue-500 to-cyan-500"
          href="/soci"
        />
        <StatCard
          label="Compressore"
          value={ultimaRicarica?.letturaFinale ? `${ultimaRicarica.letturaFinale} h` : "—"}
          sub={ultimaRicarica?.data ? `ultima: ${format(parseISO(ultimaRicarica.data), "dd MMM", { locale: it })}` : "ultima lettura"}
          icon={Wind}
          color="from-teal-500 to-emerald-500"
          href={isStaff ? "/compressore" : undefined}
        />
        <StatCard
          label="Piscina oggi"
          value={`${ingressiOggi?.length ?? 0}`}
          sub={`${ingressiStagione ?? 0} ingressi stagione ${labelAnno}`}
          icon={Waves}
          color="from-violet-500 to-purple-500"
          href="/piscina"
        />

      </div>

      {/* ── Sezione centrale: tre colonne ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Ultime ricariche compressore */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border flex flex-col">
          <SectionHeader title="Ricariche Compressore" href={isStaff ? "/compressore" : undefined} />
          <div className="space-y-3 flex-1">
            {ultimeRicariche && ultimeRicariche.length > 0 ? (
              ultimeRicariche.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {r.BP_soci ? `${r.BP_soci.Nome} ${r.BP_soci.Cognome}` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.data ? format(parseISO(r.data), "dd MMM yyyy", { locale: it }) : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{r.letturaFinale ?? "—"} h</p>
                    <p className="text-xs text-muted-foreground">
                      {(r.mono ?? 0) + (r.bibo ?? 0)} bombole
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <Empty label="Nessuna ricarica registrata" />
            )}
          </div>
        </div>

        {/* Ingressi piscina oggi */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border flex flex-col">
          <SectionHeader
            title={`Piscina oggi`}
            sub={format(now, "dd MMM", { locale: it })}
            href="/piscina"
          />
          {/* Mini stat pacchetti attivi */}
          <div className="mb-4 flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">
            <Package className="w-4 h-4 text-violet-500 shrink-0" />
            <span className="text-xs text-violet-700 font-medium">
              {pacchettiAttivi ?? 0} pacchetti attivi in circolazione
            </span>
          </div>
          <div className="space-y-2 flex-1">
            {ingressiOggi && ingressiOggi.length > 0 ? (
              ingressiOggi.map((ing: any) => (
                <div key={ing.id} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                  <div className="w-7 h-7 rounded-full ocean-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {ing.BP_soci?.Nome?.[0]}{ing.BP_soci?.Cognome?.[0]}
                  </div>
                  <p className="text-sm font-medium flex-1">
                    {ing.BP_soci?.Nome} {ing.BP_soci?.Cognome}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ing.tipo === "pacchetto"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {ing.tipo === "pacchetto" ? "📦" : "💶"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ing.ora_ingresso?.slice(0, 5)}
                  </span>
                </div>
              ))
            ) : (
              <Empty label="Nessun ingresso registrato oggi" />
            )}
          </div>
        </div>

        {/* Certificati in scadenza (solo Consiglio+) oppure promemoria attività */}
        {isConsiglio ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-border flex flex-col">
            <SectionHeader title="Certificati in Scadenza" sub="prossimi 30 giorni" href="/certificati" />
            <div className="space-y-2 flex-1">
              {prossimeScadenzeCert && prossimeScadenzeCert.length > 0 ? (
                prossimeScadenzeCert.map((c: any) => {
                  const giorniRimasti = Math.ceil(
                    (new Date(c["Data scadenza"]).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  )
                  return (
                    <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className="w-7 h-7 rounded-full ocean-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {c.BP_soci?.Nome?.[0]}{c.BP_soci?.Cognome?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {c.BP_soci?.Nome} {c.BP_soci?.Cognome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Scade: {format(parseISO(c["Data scadenza"]), "dd MMM yyyy", { locale: it })}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                        giorniRimasti <= 7
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {giorniRimasti}g
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center gap-2 text-emerald-600 text-sm py-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Nessun certificato in scadenza nei prossimi 30 giorni
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Per Socio/Staff: riquadro stagione piscina */
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-border flex flex-col">
            <SectionHeader title={`Stagione ${labelAnno}`} href="/piscina" />
            <div className="flex-1 flex flex-col justify-center gap-5">
              <div className="text-center py-4">
                <p className="text-5xl font-bold text-primary" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {ingressiStagione ?? 0}
                </p>
                <p className="text-sm text-muted-foreground mt-2">ingressi in piscina</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(parseISO(annoStart), "MMMM yyyy", { locale: it })} – {format(parseISO(annoEnd), "MMMM yyyy", { locale: it })}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <Package className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-700" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {pacchettiAttivi ?? 0}
                  </p>
                  <p className="text-xs text-blue-600">pacchetti attivi</p>
                </div>
                <div className="bg-violet-50 rounded-xl p-3 text-center">
                  <Waves className="w-5 h-5 text-violet-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-violet-700" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {ingressiOggi?.length ?? 0}
                  </p>
                  <p className="text-xs text-violet-600">presenti oggi</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Banner stagione (solo se siamo vicino a settembre/giugno) ── */}
      {(() => {
        const mese = now.getMonth() + 1 // 1-12
        if (mese === 6) return (
          <div className="ocean-gradient rounded-2xl p-5 flex items-center gap-4 text-white shadow-md">
            <Calendar className="w-8 h-8 shrink-0 opacity-80" />
            <div>
              <p className="font-semibold" style={{ fontFamily: "'Syne', sans-serif" }}>
                Fine stagione in arrivo
              </p>
              <p className="text-sm text-white/80 mt-0.5">
                La stagione si chiude a giugno — ricordati di verificare certificati e assicurazioni prima della pausa estiva.
              </p>
            </div>
          </div>
        )
        if (mese === 9) return (
          <div className="ocean-gradient rounded-2xl p-5 flex items-center gap-4 text-white shadow-md">
            <TrendingUp className="w-8 h-8 shrink-0 opacity-80" />
            <div>
              <p className="font-semibold" style={{ fontFamily: "'Syne', sans-serif" }}>
                Nuova stagione iniziata!
              </p>
              <p className="text-sm text-white/80 mt-0.5">
                Benvenuti nella stagione {labelAnno} — controlla che tutti i soci abbiano certificato medico e assicurazione aggiornati.
              </p>
            </div>
          </div>
        )
        return null
      })()}

    </div>
  )
}

// ── Componenti locali ────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color, href }: {
  label: string; value: string; sub: string
  icon: React.ElementType; color: string; href?: string
}) {
  const inner = (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium leading-tight">{label}</span>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>
}

function SectionHeader({ title, sub, href }: { title: string; sub?: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <div>
        <h2 className="font-semibold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</h2>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="text-xs text-primary hover:underline shrink-0">
          Vedi tutto →
        </Link>
      )}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground py-4 text-center">{label}</p>
}
