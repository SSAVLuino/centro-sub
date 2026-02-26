import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ProfiloClient from "./ProfiloClient"

export const dynamic = 'force-dynamic'

export default async function ProfiloPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

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

  const [ricaricheResult, bomboleResult] = await Promise.all([
    socio
      ? supabase
          .from("AT_RicaricheCompressore")
          .select("*", { count: "exact", head: true })
          .eq("addetto", socio.id)
      : Promise.resolve({ count: 0 }),
    socio
      ? supabase
          .from("AT_Bombole")
          .select(`id, "Matricola", "Codice", "Etichetta", "Volume", "Marca", "Materiale", "Attacco", "Foto", "Stato Revisione", "Ultima Revisione", "Dismessa", "Nota"`)
          .eq("Proprietario", socio.id)
          .order("id")
      : Promise.resolve({ data: [] }),
  ])

  return (
    <ProfiloClient
      user={user}
      socio={socio}
      ricaricheCount={(ricaricheResult as any).count ?? 0}
      bombole={(bomboleResult as any).data ?? []}
    />
  )
}
