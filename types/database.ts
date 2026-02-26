export type Brevetto = {
  id: number
  Nome: string | null
  Didattica: string | null
  Ordinamento: number | null
  created_at: string
}

export type TipoSocio = {
  id: number
  Descrizione: string | null
  created_at: string
}

export type Socio = {
  id: number
  created_at: string
  Nome: string | null
  Cognome: string | null
  email: string | null
  Telefono: string | null
  Attivo: boolean | null
  "Tipo Socio": string | null
  Avatar: string | null
  "Addetto Ricarica": boolean | null
  "Patente Nautica": boolean | null
  "Nota Patente": string | null
  "Luogo di nascita": string | null
  "Data di Nascita": string | null
  Indirizzo: string | null
  CAP: number | null
  Comune: string | null
  Provincia: string | null
  Nazione: string | null
  Professione: string | null
  CF: string | null
  Assicurazione: boolean | null
  "Tipo Assicurazione": string | null
  Specializzazione: string | null
  FIN: boolean | null
  "Nota FIN": string | null
  Brevetto: number | null
  "Tipo Socio New": number | null
  // joined
  UT_Brevetti?: Brevetto
  UT_TipoSocio?: TipoSocio
}

export type RicaricaCompressore = {
  id: number
  data: string | null
  mono: number | null
  bibo: number | null
  letturaFinale: number | null
  addetto: number | null
  note: string | null
  created_at: string
  // joined
  BP_soci?: Pick<Socio, "id" | "Nome" | "Cognome">
}

export type Certificato = {
  id: number
  created_at: string
  socio: number | null
  "Attività subacquea": boolean | null
  "Data visita": string
  "Data scadenza": string | null
  PDF: string | null
}

export type RevisioneBombola = {
  id: number
  created_at: string
  "Data Bombole pronte": string
  "Date collaudo": string
  "Luogo": string | null
  "Centro Revisione": string
  "Costo Revisione": number
  "Arrotondamento": number
  "Stato": "Da preparare" | "Pronte" | "Partite" | "Tornate"
  "Certificato": string | null
  "Data Revisione terminata": string | null
}

export type RevisioneBombolaDettaglio = {
  id: number
  created_at: string
  "Revisione": number
  "Bombola": number
  "Stato Rev": "In Attesa" | "OK" | "Bocciata"
  "Pagato": boolean
}
