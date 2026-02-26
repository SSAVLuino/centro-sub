import { createClient } from "@/lib/supabase/server"
import { getUserRole, hasAccess } from "@/lib/roles"
import { redirect } from "next/navigation"
import BomboleClient from "./BomboleClient"

export const dynamic = 'force-dynamic'

export default async function BombolePage() {
  const supabase = createClient()
  const userRole = await getUserRole()

  if (!hasAccess("Consiglio", userRole)) redirect("/dashboard")

  const [{ data: bombole }, { data: soci }] = await Promise.all([
    supabase
      .from("AT_Bombole")
      .select(`
        id, created_at, "Proprietario", "Matricola", "Codice", "Etichetta",
        "Volume", "Marca", "Attacco", "Rubinetto", "Nota", "Materiale",
        "Foto", "Stato Revisione", "Dismessa", "Ultima Revisione"
      `)
      .order("id", { ascending: true }),
    supabase
      .from("BP_soci")
      .select("id, Nome, Cognome")
      .eq("Attivo", true)
      .order("Cognome"),
  ])

  return <BomboleClient bombole={bombole ?? []} soci={soci ?? []} userRole={userRole} />
}
