import { createClient } from "@/lib/supabase/server"
import { getUserRole, hasAccess } from "@/lib/roles"
import { redirect } from "next/navigation"
import RevisioniClient from "./RevisioniClient"

export const dynamic = 'force-dynamic'

export default async function RevisioniPage() {
  const supabase = createClient()
  const userRole = await getUserRole()

  if (!hasAccess("Consiglio", userRole)) redirect("/dashboard")

  const [{ data: revisioni }, { data: bombole }] = await Promise.all([
    supabase
      .from("AT_Revisioni")
      .select("*")
      .order("Date collaudo", { ascending: false }),
    supabase
      .from("AT_Bombole")
      .select("id, Matricola, Etichetta, Proprietario, Volume, Ultima Revisione, Dismessa")
      .eq("Dismessa", false)
      .order("Matricola"),
  ])

  return (
    <RevisioniClient 
      revisioni={revisioni ?? []} 
      bombole={bombole ?? []} 
      userRole={userRole} 
    />
  )
}
