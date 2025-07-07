import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20">
          <h1 className="text-6xl font-bold text-gray-800 mb-6">
            SORE-V2
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Sistema Avanzato di Gestione Ricordi per Coppie
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">📸</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Galleria Intelligente</h3>
              <p className="text-gray-600 text-sm">Classificazione automatica delle immagini con AI</p>
            </div>
            
            <div className="bg-white/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">📍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Timeline & Mappe</h3>
              <p className="text-gray-600 text-sm">Visualizza i tuoi ricordi nel tempo e nello spazio</p>
            </div>
            
            <div className="bg-white/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">💝</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Momenti Speciali</h3>
              <p className="text-gray-600 text-sm">Cattura momenti sincronizzati con il tuo partner</p>
              <Link href="/momento" className="text-purple-600 hover:underline mt-2 inline-block">
                Prova ora
              </Link>
            </div>
          </div>
          
          <div className="mt-12">
            <div className="bg-green-100 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                ✅ Next.js Project inizializzato con successo!
              </p>
              <p className="text-green-600 text-sm mt-1">
                Ambiente di sviluppo pronto per la configurazione delle dipendenze core.
              </p>
            </div>
            
            <p className="text-gray-500 text-sm">
              Progetto in fase di sviluppo - Task 1.1 completata
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 