import { createClient } from "@/lib/supabase/server"
import SociClient from "./SociClient"

export const dynamic = 'force-dynamic'

export default async function SociPage() {
  const supabase = createClient()

  const [{ data: soci }, { data: brevetti }, { data: tipiSocio }] = await Promise.all([
    supabase
      .from("BP_soci")
      .select(`
       id, Nome, Cognome, email, Telefono, Attivo, Brevetto, Avatar,
        "Addetto Ricarica", "Patente Nautica", Assicurazione, FIN,        
        "Data di Nascita", "Luogo di nascita",
        Indirizzo, CAP, Comune, Provincia, Nazione,
        CF, Professione, Specializzazione,
        "Tipo Assicurazione",
        "Nota FIN", "Nota Patente",
        UT_Brevetti(id, Nome),
        UT_TipoSocio(id, Descrizione)
      `)
      .order("Cognome", { ascending: true }),
    supabase.from("UT_Brevetti").select("id, Nome").order("Ordinamento"),
    supabase.from("UT_TipoSocio").select("id, Descrizione"),
  ])

  return <SociClient soci={soci ?? []} brevetti={brevetti ?? []} tipiSocio={tipiSocio ?? []} />
}
