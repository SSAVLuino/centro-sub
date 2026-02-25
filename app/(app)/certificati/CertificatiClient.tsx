import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CertificatiPageClient from "./CertificatiClient"

export const dynamic = 'force-dynamic'

export default async function CertificatiPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const today = new Date().toISOString().split("T")[0]
  const in30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  // Tutti i soci attivi
  const { data: sociAttivi } = await supabase
    .from("BP_soci")
    .select("id, Nome, Cognome, Avatar")
    .eq("Attivo", true)
    .order("Cognome")

  // Tutti i certificati, con join al socio
  const { data: certificati } = await supabase
    .from("BP_certificati")
    .select("id, socio, \"Attività subacquea\", \"Data visita\", \"Data scadenza\", PDF, created_at")
    .order("Data visita", { ascending: false })

  // Statistiche aggregate
  const sociAttiviIds = new Set((sociAttivi ?? []).map((s: any) => s.id))

  // Per ogni socio attivo, prendi il certificato più recente
  const certPerSocio = new Map<number, any>()
  for (const cert of (certificati ?? [])) {
    if (!cert.socio || !sociAttiviIds.has(cert.socio)) continue
    if (!certPerSocio.has(cert.socio)) {
      certPerSocio.set(cert.socio, cert)
    }
  }

  const totaleAttivi = sociAttivi?.length ?? 0
  const conCertificato = certPerSocio.size
  const senzaCertificato = totaleAttivi - conCertificato

  let validi = 0, inScadenza = 0, scaduti = 0
  Array.from(certPerSocio.values()).forEach(cert => {
    const scad = cert["Data scadenza"]
    if (!scad || scad < today) scaduti++
    else if (scad <= in30days) inScadenza++
    else validi++
  })

  return (
    <CertificatiPageClient
      sociAttivi={sociAttivi ?? []}
      certificati={certificati ?? []}
      stats={{ totaleAttivi, conCertificato, senzaCertificato, validi, inScadenza, scaduti }}
    />
  )
}
