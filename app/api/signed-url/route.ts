import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Bucket privati supportati
const ALLOWED_BUCKETS = ["Bombole", "Certificati"]

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const bucket = searchParams.get("bucket")
  const path   = searchParams.get("path")

  if (!bucket || !path) {
    return NextResponse.json({ error: "Missing bucket or path" }, { status: 400 })
  }
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: "Bucket not allowed" }, { status: 403 })
  }

  const supabase = createClient()

  // Verifica che l'utente sia autenticato
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Genera signed URL valida 60 minuti
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? "Failed to create signed URL" }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
