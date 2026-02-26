import { createClient } from "@/lib/supabase/server"
import { getUserRole, hasAccess } from "@/lib/roles"
import { redirect } from "next/navigation"
import CertificatiClient from "./CertificatiClient"

export const dynamic = 'force-dynamic'

export default async function CertificatiPage() {
  const supabase = createClient()
  const userRole = await getUserRole()

  if (!hasAccess("Consiglio", userRole)) redirect("/dashboard")

  // Carica tutti i certificati
  const { data: certificati } = await supabase
    .from("BP_certificati")
    .select("*")
    .order("Data visita", { ascending: false })

  // Ricava gli id unici dei soci che hanno almeno un certificato
  const socioIds = [...new Set((certificati ?? []).map((c: any) => c.socio).filter(Boolean))]

  // Carica i dati di quei soci
  const { data: soci } = socioIds.length > 0
    ? await supabase
        .from("BP_soci")
        .select("id, Nome, Cognome, Avatar")
        .in("id", socioIds)
    : { data: [] }

  return (
    <CertificatiClient
      certificati={certificati ?? []}
      soci={soci ?? []}
      userRole={userRole}
    />
  )
}
