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
