import { createClient } from "@/lib/supabase/server"
import { getUserRole, hasAccess } from "@/lib/roles"
import { redirect } from "next/navigation"
import InventarioClient from "./InventarioClient"

export const dynamic = 'force-dynamic'

export default async function InventarioPage() {
  const supabase = createClient()
  const userRole = await getUserRole()

  if (!hasAccess("Staff", userRole)) redirect("/dashboard")

  const { data: inventario } = await supabase
    .from("AT_Inventario")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <InventarioClient 
      inventario={inventario ?? []} 
      userRole={userRole} 
    />
  )
}
