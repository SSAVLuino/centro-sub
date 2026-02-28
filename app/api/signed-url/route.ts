import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/roles"
import { NextResponse } from "next/server"

// Client con service_role — solo server-side, mai esposto al browser
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Verifica che chi chiama sia Admin
async function checkAdmin() {
  const role = await getUserRole()
  return role === "Admin"
}

// ── GET /api/admin/users → lista utenti con ruolo ──────────────────────────
export async function GET() {
  if (!(await checkAdmin()))
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })

  const admin = createAdminClient()
  const supabase = createServerClient()

  // Lista tutti gli utenti Auth
  const { data: { users }, error: usersErr } = await admin.auth.admin.listUsers({ perPage: 500 })
  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 })

  // Lista tutti gli assegnamenti ruolo con join alla tabella roles
  const { data: userRoles, error: rolesErr } = await supabase
    .from("users_roles")
    .select("user_id, roles(id, name)")

  if (rolesErr) return NextResponse.json({ error: rolesErr.message }, { status: 500 })

  // Mappa user_id → ruolo
  const roleMap: Record<string, { id: number; name: string }> = {}
  for (const ur of userRoles ?? []) {
    roleMap[ur.user_id] = (ur.roles as any)
  }

  const result = users.map(u => ({
    id: u.id,
    email: u.email ?? "",
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    role: roleMap[u.id] ?? null,
  }))

  return NextResponse.json({ users: result })
}

// ── POST /api/admin/users → crea utente ───────────────────────────────────
export async function POST(req: Request) {
  if (!(await checkAdmin()))
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })

  const { email, password, roleId } = await req.json()
  if (!email || !password || !roleId)
    return NextResponse.json({ error: "email, password e ruolo sono obbligatori" }, { status: 400 })

  const admin = createAdminClient()
  const supabase = createServerClient()

  // Crea l'utente in Auth
  const { data: { user }, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // confermato subito, senza email di verifica
  })
  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 })
  if (!user) return NextResponse.json({ error: "Utente non creato" }, { status: 500 })

  // Assegna il ruolo
  const { error: roleErr } = await supabase
    .from("users_roles")
    .insert({ user_id: user.id, role_id: roleId })
  if (roleErr) return NextResponse.json({ error: roleErr.message }, { status: 500 })

  return NextResponse.json({ success: true, userId: user.id })
}

// ── PATCH /api/admin/users → aggiorna ruolo utente ────────────────────────
export async function PATCH(req: Request) {
  if (!(await checkAdmin()))
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })

  const { userId, roleId } = await req.json()
  if (!userId || !roleId)
    return NextResponse.json({ error: "userId e roleId obbligatori" }, { status: 400 })

  const supabase = createServerClient()

  // Elimina assegnamento precedente e reinserisce
  await supabase.from("users_roles").delete().eq("user_id", userId)
  const { error } = await supabase.from("users_roles").insert({ user_id: userId, role_id: roleId })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// ── DELETE /api/admin/users → elimina utente ──────────────────────────────
export async function DELETE(req: Request) {
  if (!(await checkAdmin()))
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })

  const { userId } = await req.json()
  if (!userId)
    return NextResponse.json({ error: "userId obbligatorio" }, { status: 400 })

  const admin = createAdminClient()
  const supabase = createServerClient()

  // Rimuovi ruolo prima
  await supabase.from("users_roles").delete().eq("user_id", userId)
  // Poi elimina da Auth
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
