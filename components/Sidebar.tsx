"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Waves, LayoutDashboard, Users, Wind, LogOut, Menu, X, User, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { clsx } from "clsx"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/soci", label: "Soci", icon: Users },
  { href: "/compressore", label: "Compressore", icon: Wind },
  { href: "/certificati", label: "Certificati", icon: FileText },
  { href: "/profilo", label: "Profilo", icon: User },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link key={href} href={href} onClick={onClick}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              active ? "ocean-gradient text-white shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}>
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* ── DESKTOP sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-64 min-h-screen glass border-r border-border flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl ocean-gradient flex items-center justify-center shadow-sm">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>Centro Sub</p>
              <p className="text-xs text-muted-foreground mt-0.5">Gestionale</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full">
            <LogOut className="w-4 h-4" /> Esci
          </button>
        </div>
      </aside>

      {/* ── MOBILE topbar ───────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg ocean-gradient flex items-center justify-center shadow-sm">
            <Waves className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Centro Sub</span>
        </div>
        <button onClick={() => setMobileOpen(v => !v)}
          className="p-2 rounded-xl hover:bg-secondary transition-all">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── MOBILE drawer ───────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute top-14 left-0 right-0 glass border-b border-border p-4 space-y-1 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <NavLinks onClick={() => setMobileOpen(false)} />
            <div className="pt-2 border-t border-border mt-2">
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full">
                <LogOut className="w-4 h-4" /> Esci
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE spacer (pushes content below topbar) ─ */}
      <div className="md:hidden h-14 shrink-0" />
    </>
  )
}
