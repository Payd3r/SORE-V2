'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface CoupleData {
  id: string
  name: string
  inviteCode: string
  anniversary: string | null
  users: {
    id: string
    name: string
    email: string
    image: string | null
  }[]
  isComplete: boolean
}

export default function CoupleSetup() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentCouple, setCurrentCouple] = useState<CoupleData | null>(null)
  const [hasCouple, setHasCouple] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create')

  // Form states
  const [coupleName, setCoupleName] = useState('')
  const [anniversary, setAnniversary] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Redirect se non autenticato
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Controlla se l'utente ha già una coppia
  useEffect(() => {
    if (session) {
      checkCurrentCouple()
    }
  }, [session])

  const checkCurrentCouple = async () => {
    try {
      const response = await fetch('/api/couples/me')
      const data = await response.json()
      
      if (data.hasCouple) {
        setHasCouple(true)
        setCurrentCouple(data.couple)
      } else {
        setHasCouple(false)
        setCurrentCouple(null)
      }
    } catch (error) {
      console.error('Errore nel controllo della coppia:', error)
    }
  }

  const handleCreateCouple = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/couples/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: coupleName,
          anniversary: anniversary || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Coppia creata con successo!')
        setCurrentCouple(data.couple)
        setHasCouple(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        setError(data.error || 'Errore nella creazione della coppia')
      }
    } catch (error) {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinCouple = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/couples/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteCode: inviteCode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Ti sei unito alla coppia con successo!')
        setCurrentCouple(data.couple)
        setHasCouple(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        setError(data.error || 'Errore nell\'unirti alla coppia')
      }
    } catch (error) {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  // Se l'utente ha già una coppia, mostra le informazioni
  if (hasCouple && currentCouple) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">La Tua Coppia</h1>
              <p className="text-gray-600">Ecco le informazioni della vostra coppia</p>
            </div>

            <div className="space-y-4">
              <div className="bg-pink-50 rounded-lg p-4">
                <h3 className="font-semibold text-pink-800 mb-2">Nome della Coppia</h3>
                <p className="text-pink-700">{currentCouple.name}</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">Codice di Invito</h3>
                <p className="text-purple-700 font-mono">{currentCouple.inviteCode}</p>
                <p className="text-sm text-purple-600 mt-1">Condividi questo codice con il tuo partner</p>
              </div>

              {currentCouple.anniversary && (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-800 mb-2">Anniversario</h3>
                  <p className="text-indigo-700">{new Date(currentCouple.anniversary).toLocaleDateString('it-IT')}</p>
                </div>
              )}

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Membri</h3>
                <div className="space-y-2">
                  {currentCouple.users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-green-700 font-medium">{user.name}</p>
                        <p className="text-green-600 text-sm">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Vai alla Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Configura la Tua Coppia</h1>
            <p className="text-gray-600">Crea una nuova coppia o unisciti a una esistente</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'create'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-gray-600 hover:text-pink-600'
              }`}
              onClick={() => setActiveTab('create')}
            >
              Crea Coppia
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'join'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
              onClick={() => setActiveTab('join')}
            >
              Unisciti
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Create Couple Form */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateCouple} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome della Coppia
                </label>
                <input
                  type="text"
                  value={coupleName}
                  onChange={(e) => setCoupleName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Ad esempio: Mario & Giulia"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anniversario (Opzionale)
                </label>
                <input
                  type="date"
                  value={anniversary}
                  onChange={(e) => setAnniversary(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creazione...' : 'Crea Coppia'}
              </button>
            </form>
          )}

          {/* Join Couple Form */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinCouple} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codice di Invito
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Inserisci il codice di invito"
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Chiedi al tuo partner di condividere il codice di invito della coppia
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Unione...' : 'Unisciti alla Coppia'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
} 