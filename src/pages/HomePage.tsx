import { useAuthStore } from '../store/auth'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { DeckCard } from '../components/DeckCard'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { fetchUserDecks, createDeck } from '../lib/api/decks'
import { Deck } from '../types/deck'
import { Button } from '../components/ui'
import { PlusIcon } from '@radix-ui/react-icons'

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
              <Button variant='danger' onClick={handleSignOut}>
                Sign out
              </Button>
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
            <Button
              onClick={handleAddSlides}
              disabled={creating}
              size="lg"
            >
                <>
                  <PlusIcon className='mr-2'/>
                  Add Slides
                </>

            </Button>
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

