import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

// ── Client admin con service_role (solo server) ───────────────────────────
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ── Client normale che legge i cookie dalla Request ───────────────────────
function createClientFromRequest(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll() {
          // in Route Handler non possiamo scrivere cookie in risposta qui,
          // ma per sola lettura non serve
        },
      },
    }
  )
}

// ── Verifica che l'utente loggato sia Admin ───────────────────────────────
async function checkAdmin(req: NextRequest): Promise<boolean> {
  try {
    const supabase = createClientFromRequest(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
      .from("users_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    const roleName = (data?.roles as any)?.name as string | undefined
    return roleName?.toLowerCase() === "admin"
  } catch {
    return false
  }
}

// ── GET → lista utenti con ruolo ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    // Step 1: verifica service role key
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY mancante" }, { status: 500 })
    }

    // Step 2: verifica admin
    const isAdmin = await checkAdmin(req)
    if (!isAdmin) {
      return NextResponse.json({ error: "Non autorizzato - non sei Admin" }, { status: 403 })
    }

    // Step 3: lista utenti
    const admin = createAdminClient()
    const { data: { users }, error: usersErr } = await admin.auth.admin.listUsers({ perPage: 500 })
    if (usersErr) return NextResponse.json({ error: `listUsers: ${usersErr.message}` }, { status: 500 })

    // Step 4: carica ruoli
    const supabase = createClientFromRequest(req)
    const { data: userRoles, error: rolesErr } = await supabase
      .from("users_roles")
      .select("user_id, roles(id, name)")
    if (rolesErr) return NextResponse.json({ error: `userRoles: ${rolesErr.message}` }, { status: 500 })

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
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Errore server" }, { status: 500 })
  }
}

// ── POST → crea utente ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!(await checkAdmin(req)))
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })

  try {
    const { email, password, roleId } = await req.json()
    if (!email || !password || !roleId)
      return NextResponse.json({ error: "email, password e ruolo sono obbligatori" }, { status: 400 })

    const admin = createAdminClient()
    const supabase = createClientFromRequest(req)

    const { data: { user }, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 })
    if (!user) return NextResponse.json({ error: "Utente non creato" }, { status: 500 })

    const { error: roleErr } = await supabase
      .from("users_roles")
      .insert({ user_id: user.id, role_id: roleId })
    if (roleErr) return NextResponse.json({ error: roleErr.message }, { status: 500 })

    return NextResponse.json({ success: true, userId: user.id })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Errore server" }, { status: 500 })
  }
}

// ── PATCH → aggiorna ruolo utente ─────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin(req)))
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })

  try {
    const { userId, roleId } = await req.json()
    if (!userId || !roleId)
      return NextResponse.json({ error: "userId e roleId obbligatori" }, { status: 400 })

    const supabase = createClientFromRequest(req)
    await supabase.from("users_roles").delete().eq("user_id", userId)
    const { error } = await supabase.from("users_roles").insert({ user_id: userId, role_id: roleId })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Errore server" }, { status: 500 })
  }
}

// ── DELETE → elimina utente ───────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin(req)))
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })

  try {
    const { userId } = await req.json()
    if (!userId)
      return NextResponse.json({ error: "userId obbligatorio" }, { status: 400 })

    const admin = createAdminClient()
    const supabase = createClientFromRequest(req)

    await supabase.from("users_roles").delete().eq("user_id", userId)
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Errore server" }, { status: 500 })
  }
}
