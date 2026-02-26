"use client"

import { useState } from "react"
import { X, Loader2, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useSignedUrl } from "@/lib/useSignedUrl"
import type { RevisioneBombola } from "@/types/database"

interface Props {
  revisione: RevisioneBombola
  onClose: () => void
  onSaved: (updated: RevisioneBombola) => void
}

export default function ModalCertificato({ revisione, onClose, onSaved }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [certificatoFile, setCertificatoFile] = useState<File | null>(null)
  const [certificatoPreview, setCertificatoPreview] = useState(revisione["Certificato"] ? "PDF caricato" : null)
  const supabase = createClient()

  async function handleUpload() {
    if (!certificatoFile) {
      setError("Seleziona un file PDF")
      return
    }

    if (!certificatoFile.type.includes("pdf")) {
      setError("Il file deve essere un PDF")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const fileName = `revisione_${revisione.id}_${Date.now()}.pdf`

      const { error: uploadErr } = await supabase.storage
        .from("Revisioni")
        .upload(fileName, certificatoFile, { upsert: false, contentType: "application/pdf" })

      if (uploadErr) throw uploadErr

      if (revisione["Certificato"]) {
        await supabase.storage.from("Revisioni").remove([revisione["Certificato"]])
      }

      const { data: updated, error: dbErr } = await supabase
        .from("AT_Revisioni")
        .update({ "Certificato": fileName })
        .eq("id", revisione.id)
        .select()
        .single()

      if (dbErr) throw dbErr

      onSaved(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold">Carica Certificato</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div
            onClick={() => document.getElementById("pdf-input")?.click()}
            className="border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/40 transition-all cursor-pointer bg-secondary/30 flex flex-col items-center justify-center text-center"
          >
            <FileText className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">{certificatoPreview ?? "Clicca per selezionare PDF"}</p>
            <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
            <input
              id="pdf-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  if (file.size > 10 * 1024 * 1024) {
                    setError("Il file non può superare i 10MB")
                    return
                  }
                  setCertificatoFile(file)
                  setCertificatoPreview(file.name)
                  setError(null)
                }
              }}
            />
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="p-6 border-t border-border flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all"
          >
            Annulla
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !certificatoFile}
            className="ocean-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? "Carico..." : "Carica"}
          </button>
        </div>
      </div>
    </div>
  )
}
