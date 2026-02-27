"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, Wind, LogOut, Menu, X, User, FileText, Package, CheckCircle2, Gift, Waves } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { canAccess } from "@/lib/roles-client"
import type { UserRole } from "@/lib/roles-client"
import { clsx } from "clsx"

const navItems: { href: string; label: string; icon: React.ElementType; minRole?: UserRole }[] = [
  { href: "/dashboard",   label: "Dashboard",        icon: LayoutDashboard },
  { href: "/soci",        label: "Soci",              icon: Users },
  { href: "/compressore", label: "Compressore",       icon: Wind,         minRole: "Staff" },
  { href: "/bombole",     label: "Bombole",           icon: Package,      minRole: "Consiglio" },
  { href: "/revisioni",   label: "Revisioni Bombole", icon: CheckCircle2, minRole: "Consiglio" },
  { href: "/certificati", label: "Certificati",       icon: FileText,     minRole: "Consiglio" },
  { href: "/inventario",  label: "Inventario",        icon: Package,      minRole: "Staff" },
  { href: "/noleggio",    label: "Noleggi",           icon: Gift,         minRole: "Staff" },
  { href: "/piscina",     label: "Piscina",           icon: Waves,        minRole: "Staff" },
  { href: "/profilo",     label: "Profilo",           icon: User },
]

// ... resto del componente rimane uguale
