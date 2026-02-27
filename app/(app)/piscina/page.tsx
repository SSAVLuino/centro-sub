import { createClient } from "@/lib/supabase/server"
import { getUserRole, hasAccess } from "@/lib/roles"
import { redirect } from "next/navigation"
import PiscinaClient from "./PiscinaClient"

export const dynamic = "force-dynamic"

export default async function PiscinaPage() {
  const supabase = createClient()
  const userRole = await getUserRole()

  const now = new Date()
  const isAfterSeptember = now.getMonth() >= 8
  const annoStart = isAfterSeptember
    ? `${now.getFullYear()}-09-01`
    : `${now.getFullYear() - 1}-09-01`
  const annoEnd = isAfterSeptember
    ? `${now.getFullYear() + 1}-06-30`
    : `${now.getFullYear()}-06-30`

  const today = now.toISOString().split("T")[0]

  // Recupera l'utente loggato e il suo socio corrispondente via email
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: socioCorrente } = await supabase
    .from("BP_soci")
    .select("id, Nome, Cognome, email")
    .eq("email", user.email!)
    .single()

  // Controlla se l'utente corrente ha già un ingresso oggi
  const { data: ingressoGiaOggi } = socioCorrente
    ? await supabase
        .from("SW_Ingressi_Piscina")
        .select("id")
        .eq("socio_id", socioCorrente.id)
        .eq("data_ingresso", today)
        .maybeSingle()
    : { data: null }

  // Staff+ vede tutti i soci, Socio vede solo se stesso
  const isStaff = hasAccess("Staff", userRole)

  const [
    { data: soci },
    { data: ingressiOggi },
    { data: pacchettiAll },
    { data: ingressiAnno },
  ] = await Promise.all([
    isStaff
      ? supabase
          .from("BP_soci")
          .select("id, Nome, Cognome, email")
          .eq("Attivo", true)
          .order("Cognome")
      : socioCorrente
          ? Promise.resolve({ data: [socioCorrente] })
          : Promise.resolve({ data: [] }),

    supabase
      .from("SW_Ingressi_Piscina")
      .select("id, ora_ingresso, tipo, note, socio_id, BP_soci(id, Nome, Cognome)")
      .eq("data_ingresso", today)
      .order("ora_ingresso", { ascending: true }),

    supabase
      .from("SW_Pacchetti_Piscina")
      .select("id, socio_id, data_acquisto, ingressi_totali, ingressi_usati, note, BP_soci(id, Nome, Cognome)")
      .order("data_acquisto", { ascending: false }),

    supabase
      .from("SW_Ingressi_Piscina")
      .select("id, data_ingresso, tipo, socio_id")
      .gte("data_ingresso", annoStart)
      .lte("data_ingresso", annoEnd),
  ])

  return (
    <PiscinaClient
      userRole={userRole}
      soci={soci ?? []}
      ingressiOggi={ingressiOggi ?? []}
      pacchettiAll={pacchettiAll ?? []}
      ingressiAnno={ingressiAnno ?? []}
      annoStart={annoStart}
      annoEnd={annoEnd}
      socioCorrente={socioCorrente ?? null}
      giaEntrato={!!ingressoGiaOggi}
    />
  )
=======
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import PiscinaClient from "./PiscinaClient"

export const metadata = {
  title: "Gestione Piscina",
}

export default async function PiscinaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  return <PiscinaClient />
}

