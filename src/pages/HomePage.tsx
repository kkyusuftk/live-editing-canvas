import { useAuthStore } from '../store/auth'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { DeckCard } from '../components/DeckCard'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { fetchUserDecks, createDeck } from '../lib/api/decks'
import { Deck } from '../types/deck'

export function HomePage() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadDecks()
  }, [])

  // Reload decks when returning to this page (to show updated titles)
  useEffect(() => {
    const handleFocus = () => {
      loadDecks()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadDecks = async () => {
    setLoading(true)
    const { data, error } = await fetchUserDecks()

    if (error) {
      toast.error('Could not load slides')
      setLoading(false)
      return
    }

    setDecks(data || [])
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleAddSlides = async () => {
    if (creating) return // Prevent double-clicks

    setCreating(true)
    const { data, error } = await createDeck()

    if (error || !data) {
      toast.error('Failed to create slide, please try again.')
      setCreating(false)
      return
    }

    toast.success('Slide deck created!')
    navigate(`/slide/${data.id}`)
  }

  const handleDeckClick = (deckId: string) => {
    navigate(`/slide/${deckId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Live Editing Canvas
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300 hidden sm:inline">
                {user?.user_metadata?.username || user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Header with Add Slides button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Slide Decks
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Create and manage your presentations
              </p>
            </div>
            <button
              onClick={handleAddSlides}
              disabled={creating}
              className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              {creating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Slides
                </>
              )}
            </button>
          </div>

          {/* Deck list */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : decks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <EmptyState />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  onClick={() => handleDeckClick(deck.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

