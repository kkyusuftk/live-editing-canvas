import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { fetchDeckById, updateDeckTitle } from '../lib/api/decks'
import { DeckWithSlides } from '../types/deck'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { RoomProvider, ClientSideSuspense } from '@liveblocks/react/suspense'
import { LiveEditor } from '../components/LiveEditor'

export function SlideEditorPage() {
  const { slideId } = useParams<{ slideId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [deck, setDeck] = useState<DeckWithSlides | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const params = new URLSearchParams(location.search)

  useEffect(() => {
    if (!slideId) {
      setError('No slide ID provided')
      setLoading(false)
      return
    }

    loadDeck()
  }, [slideId])

  const loadDeck = async () => {
    if (!slideId) return

    setLoading(true)
    setError(null)

    const { data, error } = await fetchDeckById(slideId)

    if (error || !data) {
      setError('Slide not found or you don\'t have access.')
      toast.error('Could not load slide deck')
      setLoading(false)
      return
    }

    setDeck(data)
    setLoading(false)
  }

  const handleBack = () => {
    navigate('/home')
  }

  const handleStartEditingTitle = () => {
    if (deck) {
      setEditedTitle(deck.title)
      setIsEditingTitle(true)
      // Focus the input after it renders
      setTimeout(() => titleInputRef.current?.focus(), 0)
    }
  }

  const handleCancelEditingTitle = () => {
    setIsEditingTitle(false)
    setEditedTitle('')
  }

  const handleSaveTitle = async () => {
    if (!deck || !editedTitle.trim()) {
      toast.error('Title cannot be empty')
      return
    }

    // If title hasn't changed, just exit edit mode
    if (editedTitle.trim() === deck.title) {
      setIsEditingTitle(false)
      return
    }

    setIsSavingTitle(true)
    const { data, error } = await updateDeckTitle(deck.id, editedTitle.trim())

    if (error || !data) {
      toast.error('Failed to update title')
      setIsSavingTitle(false)
      return
    }

    // Update local state with new title
    setDeck({ ...deck, title: data.title, updated_at: data.updated_at })
    setIsEditingTitle(false)
    setIsSavingTitle(false)
    toast.success('Title updated!')
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEditingTitle()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Back to dashboard"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Error
            </h1>
          </div>
        </div>

        {/* Error content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {error || 'Something went wrong'}
            </h2>
            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const activeSlide = deck?.slides?.[0]
  const computedRoomId = activeSlide ? `slide_${activeSlide.id}` : (slideId ? `slide_${slideId}` : undefined)
  const roomId = params.get('room') || computedRoomId

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Back to dashboard"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div className="flex-1 min-w-0 flex items-center group">
            {isEditingTitle ? (
              <div className="flex items-center space-x-2 flex-1">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  disabled={isSavingTitle}
                  className="flex-1 px-3 py-1.5 text-lg font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Enter deck title"
                  maxLength={100}
                />
                <button
                  onClick={handleSaveTitle}
                  disabled={isSavingTitle || !editedTitle.trim()}
                  className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Save title"
                  title="Save (Enter)"
                >
                  {isSavingTitle ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleCancelEditingTitle}
                  disabled={isSavingTitle}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Cancel editing"
                  title="Cancel (Esc)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {deck.title}
                </h1>
                <button
                  onClick={handleStartEditingTitle}
                  className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:opacity-100"
                  aria-label="Edit title"
                  title="Edit title"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {deck.slides.length} {deck.slides.length === 1 ? 'slide' : 'slides'}
            </span>
            {slideId && roomId && (
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/slide/${slideId}?room=${roomId}`
                  await navigator.clipboard.writeText(url)
                  toast.success('Link copied!')
                }}
                className="ml-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Share
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Collaborative editor (MVP) */}
      {roomId && activeSlide && (
        <RoomProvider id={roomId}>
          <ClientSideSuspense fallback={<div className="py-6"><LoadingSpinner /></div>}>
            <LiveEditor slideId={activeSlide.id} initialYUpdate={activeSlide.y_doc} />
          </ClientSideSuspense>
        </RoomProvider>
      )}
    </div>
  )
}

