import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ProfiloClient from "./ProfiloClient"

export const dynamic = 'force-dynamic'

export default async function ProfiloPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Cerca il socio associato all'email dell'utente loggato
  const { data: socio } = await supabase
    .from("BP_soci")
    .select(`
      id, Nome, Cognome, email, Telefono, "Data di Nascita", "Luogo di nascita",
      Indirizzo, CAP, Comune, Provincia, Nazione, CF, Professione,
      Attivo, "Addetto Ricarica", Assicurazione, "Tipo Assicurazione",
      FIN, "Nota FIN", "Patente Nautica", "Nota Patente",
      Specializzazione, created_at, Avatar,
      UT_Brevetti(id, Nome, Didattica),
      UT_TipoSocio(id, Descrizione)
    `)
    .eq("email", user.email!)
    .single()

  // Conta le ricariche effettuate come addetto
  const { count: ricaricheCount } = socio
    ? await supabase
        .from("AT_RicaricheCompressore")
        .select("*", { count: "exact", head: true })
        .eq("addetto", socio.id)
    : { count: 0 }

  return (
    <ProfiloClient
      user={user}
      socio={socio}
      ricaricheCount={ricaricheCount ?? 0}
    />
  )
}
