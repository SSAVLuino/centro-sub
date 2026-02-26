// Tipi condivisi tra server e client — nessuna dipendenza da Next.js o Supabase

export type UserRole = "Admin" | "Consiglio" | "Staff" | "Socio"

// Gerarchia: Admin > Consiglio > Staff > Socio
export const ROLE_HIERARCHY: UserRole[] = ["Admin", "Consiglio", "Staff", "Socio"]
