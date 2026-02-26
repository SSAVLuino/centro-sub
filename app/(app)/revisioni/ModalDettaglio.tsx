"use client"

import { X } from "lucide-react"
import type { RevisioneBombola, Bombola } from "@/types/database"

interface Props {
  revisione: RevisioneBombola
  bombole: Bombola[]
  onClose: () => void
  onSaved: () => void
}

export default function ModalDettaglio({ revisione, bombole, onClose, onSaved }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl mt-4 mb-4">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Dettaglio Revisione</h2>
            <p className="text-sm text-muted-foreground mt-1">{revisione["Centro Revisione"]} - {revisione["Date collaudo"]}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-blue-700">
              <strong>In sviluppo:</strong> Questo componente permetterà di gestire le singole bombole della sessione, 
              modificare lo stato di revisione (In Attesa/OK/Bocciata), gestire i pagamenti, 
              e cambiare lo stato della sessione a "Tornate".
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Informazioni Sessione</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Centro Revisione</p>
                  <p className="font-medium">{revisione["Centro Revisione"]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stato</p>
                  <p className="font-medium">{revisione["Stato"]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Costo Totale</p>
                  <p className="font-medium">€ {revisione["Costo Revisione"]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data Collaudo</p>
                  <p className="font-medium">{revisione["Date collaudo"]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}
