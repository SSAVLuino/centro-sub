import { createClient } from "@/lib/supabase/server"
import CompressoreClient from "./CompressoreClient"

export const dynamic = 'force-dynamic'

export default async function CompressorePage() {
  const supabase = createClient()

  const [{ data: ricariche }, { data: addetti }] = await Promise.all([
    supabase
      .from("AT_RicaricheCompressore")
      .select(`
        id, data, mono, bibo, letturaFinale, note, created_at,
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

  return <CompressoreClient ricariche={ricariche ?? []} addetti={addetti ?? []} />
}
