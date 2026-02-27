"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Waves, Package, UserPlus, BarChart3, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import DistribuzionePackage from "./components/DistribuzionePackage"
import RegistrazioneIngresso from "./components/RegistrazioneIngresso"
import StatistichePresenze from "./components/StatistichePresenze"

interface PiscinaStats {
  oggiPresenti: number
  oggiIngressi: number
  pachettiAttivi: number
  ingressiTotaliMese: number
}

export default function PiscinaClient() {
  const [stats, setStats] = useState<PiscinaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      setLoading(true)
      const today = new Date().toISOString().split("T")[0]
      
      // Conteggio presenze oggi
      const { data: oggiData, error: oggiErr } = await supabase
        .from("SW_Presenze_Piscina")
        .select("id")
        .eq("Data Presenza", today)
      if (oggiErr) throw oggiErr

      // Conteggio pacchetti attivi
      const { data: pacchetti, error: pErr } = await supabase
        .from("SW_Abbonamenti_Piscina")
        .select("id")
        .eq("Attivo", true)
      if (pErr) throw pErr

      setStats({
        oggiPresenti: oggiData?.length ?? 0,
        oggiIngressi: oggiData?.length ?? 0,
        pachettiAttivi: pacchetti?.length ?? 0,
        ingressiTotaliMese: oggiData?.length ?? 0,
      })
    } catch (err) {
      console.error("Errore caricamento stats:", err)
      setError(err instanceof Error ? err.message : "Errore sconosciuto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Waves className="w-8 h-8 text-blue-600" />
          Gestione Piscina
        </h1>
        <p className="text-muted-foreground mt-1">Gestisci ingressi, pacchetti e presenze in piscina</p>
      </div>

      {/* Stats Cards */}
      {!loading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Presenti Oggi"
            value={stats.oggiPresenti}
            icon={<UserPlus className="w-5 h-5" />}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="Pacchetti Attivi"
            value={stats.pachettiAttivi}
            icon={<Package className="w-5 h-5" />}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            title="Ingressi (Mese)"
            value={stats.ingressiTotaliMese}
            icon={<Waves className="w-5 h-5" />}
            color="bg-purple-50 text-purple-600"
          />
          <StatCard
            title="Totale Socio Attivi"
            value="—"
            icon={<BarChart3 className="w-5 h-5" />}
            color="bg-orange-50 text-orange-600"
          />
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm text-destructive">{error}</div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Tabs Navigation */}
      {!loading && (
        <Tabs defaultValue="registrazione" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="registrazione">
              <UserPlus className="w-4 h-4 mr-2" />
              Registra Ingresso
            </TabsTrigger>
            <TabsTrigger value="distribuzione">
              <Package className="w-4 h-4 mr-2" />
              Distribuzione Pacchetti
            </TabsTrigger>
            <TabsTrigger value="statistiche">
              <BarChart3 className="w-4 h-4 mr-2" />
              Presenze per Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registrazione" className="space-y-4">
            <RegistrazioneIngresso onSuccess={() => loadStats()} />
          </TabsContent>

          <TabsContent value="distribuzione" className="space-y-4">
            <DistribuzionePackage />
          </TabsContent>

          <TabsContent value="statistiche" className="space-y-4">
            <StatistichePresenze />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: number | string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-white rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}
