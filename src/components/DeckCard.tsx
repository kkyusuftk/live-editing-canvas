import { Deck } from '../types/deck'

interface DeckCardProps {
  deck: Deck
  onClick: () => void
}

export function DeckCard({ deck, onClick }: DeckCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      if (hours === 0) {
        const minutes = Math.floor(diffInMs / (1000 * 60))
        return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`
      }
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      })
    }
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-2">
            {deck.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last edited {formatDate(deck.updated_at)}
          </p>
        </div>
        <svg 
          className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5l7 7-7 7" 
          />
        </svg>
      </div>
      
      {/* Placeholder for thumbnail - future enhancement */}
      <div className="mt-4 aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-md flex items-center justify-center">
        <svg 
          className="w-12 h-12 text-gray-400 dark:text-gray-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
          />
        </svg>
      </div>
    </button>
  )
}

