import { createClient } from "@/lib/supabase/server"
import { getUserRole, hasAccess } from "@/lib/roles"
import { redirect } from "next/navigation"
import CompressoreClient from "./CompressoreClient"

export const dynamic = 'force-dynamic'

export default async function CompressorePage() {
  const supabase = createClient()
  const userRole = await getUserRole()

  // Solo Staff+ può accedere
  if (!hasAccess("Staff", userRole)) redirect("/dashboard")

  const [{ data: ricariche }, { data: addetti }] = await Promise.all([
    supabase
      .from("AT_RicaricheCompressore")
      .select(`
        id, data, mono, bibo, letturaFinale, addetto, note, created_at,
        BP_soci(id, Nome, Cognome)
      `)
      .order("data", { ascending: false })
      .limit(100),
    supabase
      .from("BP_soci")
      .select("id, Nome, Cognome")
      .eq("Addetto Ricarica", true)
      .eq("Attivo", true)
      .order("Cognome"),
  ])

  return <CompressoreClient ricariche={ricariche ?? []} addetti={addetti ?? []} userRole={userRole} />
}
