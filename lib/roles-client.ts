// Client-safe: nessuna dipendenza server
import type { UserRole } from "./roles-types"
export type { UserRole } from "./roles-types"

const HIERARCHY: UserRole[] = ["Admin", "Consiglio", "Staff", "Socio"]

/**
 * Verifica se userRole ha accesso al livello richiesto.
 * Es: canAccess("Staff", "Admin") → true (Admin può tutto ciò che può Staff)
 */
export function canAccess(required: UserRole, userRole: UserRole): boolean {
  return HIERARCHY.indexOf(userRole) <= HIERARCHY.indexOf(required)
}
