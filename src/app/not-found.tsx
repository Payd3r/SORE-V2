import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20">
          <div className="text-8xl mb-6">🔍</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Pagina Non Trovata
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            La pagina che stai cercando non esiste o è stata spostata.
          </p>
          <Link 
            href="/"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Torna alla Home
          </Link>
        </div>
      </div>
    </div>
  )
} 