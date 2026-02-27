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

export type SocioRuolo = {
  id: number
  socio_id: number
  tipo_id: number
  created_at: string
  // joined
  UT_TipoSocio?: Pick<TipoSocio, "id" | "Descrizione">
}

export type Socio = {
  id: number
  created_at: string
  Nome: string | null
  Cognome: string | null
  email: string | null
  Telefono: string | null
  Attivo: boolean | null
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
  // joined
  UT_Brevetti?: Brevetto
  UT_SociRuoli?: SocioRuolo[]
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

export type Bombola = {
  id: number
  created_at: string
  Proprietario: number | null
  Matricola: string
  Codice: number | null
  Etichetta: string | null
  Volume: string
  Marca: string | null
  Attacco: string | null
  Rubinetto: string | null
  Nota: string | null
  Materiale: string | null
  Foto: string | null
  "Stato Revisione": string | null
  Dismessa: boolean | null
  "Ultima Revisione": string | null
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

export type Inventario = {
  id: number
  created_at: string
  "Data Ingresso": string | null
  "Nome": string | null
  "Descrizione": string | null
  "Posizione": string | null
  "Categoria": string | null
  "Note": string | null
  "Foto": string | null
  "Stato": string | null
  "Valore Iniziale": number | null
  "Valore Attuale": number | null
  "Distrutto": boolean | null
  "Data Distruzione": string | null
  "Data Ultimo Controllo": string | null
  "Quantità": number | null
  "Noleggiabile": boolean | null
}

export type Noleggio = {
  id: number
  created_at: string
  "Socio": number
  "Data Inizio": string
  "Data Fine Prevista": string
  "Data Restituzione": string | null
  "Stato": "Attivo" | "Completato" | "Scaduto"
  "Note": string | null
  BP_soci?: Pick<Socio, "id" | "Nome" | "Cognome">
}

export type NoleggioDettaglio = {
  id: number
  created_at: string
  "Noleggio": number
  "Inventario": number
  "Quantità": number
  "Data Restituzione Effettiva": string | null
  AT_Inventario?: Inventario
}
