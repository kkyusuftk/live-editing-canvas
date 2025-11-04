// Canvas component - Phase 2 placeholder
// This will be enhanced in Phase 3+ with actual drawing/editing functionality

interface CanvasProps {
  deckId: string
}

export function Canvas({ deckId }: CanvasProps) {
  return (
    <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
      {/* Checkerboard pattern background */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: `
            linear-gradient(45deg, #f3f4f6 25%, transparent 25%),
            linear-gradient(-45deg, #f3f4f6 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f3f4f6 75%),
            linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }}
      />
      
      {/* Canvas content area */}
      <div className="relative h-full flex items-center justify-center p-8">
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-lg w-full max-w-4xl aspect-video flex items-center justify-center">
          <div className="text-center p-8">
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
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Canvas Ready
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drawing and editing tools coming in Phase 3
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 font-mono">
              Deck ID: {deckId.slice(0, 8)}...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

