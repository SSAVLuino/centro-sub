import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/Sidebar"
import { getUserRole } from "@/lib/roles"
import type { UserRole } from "@/lib/roles"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const userRole = await getUserRole()

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={userRole} />
      {/* Desktop: flex row con sidebar fissa. Mobile: colonna, sidebar è topbar fixed */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
