import { createClient } from "@/lib/supabase/server"
import { getUserRole, hasAccess } from "@/lib/roles"
import { redirect } from "next/navigation"
import VestiarioClient from "./VestiarioClient"

export const dynamic = 'force-dynamic'

export default async function VestiarioPage() {
  const supabase = createClient()
  const userRole = await getUserRole()

  if (!hasAccess("Consiglio", userRole)) redirect("/dashboard")

  const { data: vestiario } = await supabase
    .from("UT_vestiario")
    .select("*")
    .order("Descrizione", { ascending: true })

  return (
    <VestiarioClient
      vestiario={vestiario ?? []}
      userRole={userRole}
    />
  )
}
