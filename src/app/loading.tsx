export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Caricamento...
          </h2>
          <p className="text-gray-600">
            Stiamo preparando la tua esperienza SORE-V2
          </p>
        </div>
      </div>
    </div>
  )
} 