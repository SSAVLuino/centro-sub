import { createClient } from "@/lib/supabase/server"
import { getUserRole, hasAccess } from "@/lib/roles"
import { redirect } from "next/navigation"
import GestioneClient from "./GestioneClient"

export const dynamic = 'force-dynamic'

export default async function GestionePage() {
  const userRole = await getUserRole()
  if (!hasAccess("Admin", userRole)) redirect("/dashboard")

  const supabase = createClient()

  // Carica la lista dei ruoli disponibili
  const { data: roles } = await supabase
    .from("roles")
    .select("id, name")
    .order("id", { ascending: true })

  return <GestioneClient roles={roles ?? []} />
}
