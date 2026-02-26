import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "SSAV — Gestionale",
  description: "Gestionale per centro sub: soci e compressore",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
