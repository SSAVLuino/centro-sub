import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "./roles-types"
export type { UserRole } from "./roles-types"
export { ROLE_HIERARCHY } from "./roles-types"

/**
 * Ritorna il ruolo dell'utente corrente (server-side only).
 * Se non ha nessun ruolo assegnato, torna "Socio" (accesso base).
 */
export async function getUserRole(): Promise<UserRole> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return "Socio"

  const { data } = await supabase
    .from("users_roles")
    .select("roles(name)")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  const roleName = (data?.roles as any)?.name as string | undefined
  if (!roleName) return "Socio"

  const HIERARCHY: UserRole[] = ["Admin", "Consiglio", "Staff", "Socio"]
  const match = HIERARCHY.find(r => r.toLowerCase() === roleName.toLowerCase())
  return match ?? "Socio"
}

/**
 * Verifica se il ruolo ha accesso al livello richiesto (server-side).
 * Es: hasAccess("Staff", "Admin") → true
 */
export function hasAccess(required: UserRole, userRole: UserRole): boolean {
  const HIERARCHY: UserRole[] = ["Admin", "Consiglio", "Staff", "Socio"]
  return HIERARCHY.indexOf(userRole) <= HIERARCHY.indexOf(required)
}
