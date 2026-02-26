import { createClient } from "@/lib/supabase/server"
import { getUserRole, hasAccess } from "@/lib/roles"
import { redirect } from "next/navigation"
import NoleggioClient from "./NoleggioClient"

export const dynamic = 'force-dynamic'

export default async function NoleggioPage() {
  const supabase = createClient()
  const userRole = await getUserRole()

  if (!hasAccess("Staff", userRole)) redirect("/dashboard")

  const { data: noleggi } = await supabase
    .from("AT_Noleggi")
    .select("*, BP_soci(id, Nome, Cognome)")
    .order("created_at", { ascending: false })

  const { data: dettagli } = await supabase
    .from("AT_Noleggi_Dettaglio")
    .select("*, AT_Inventario(id, Nome, Foto)")

  return (
    <NoleggioClient 
      noleggi={noleggi ?? []} 
      dettagli={dettagli ?? []}
      userRole={userRole}
    />
  )
}
