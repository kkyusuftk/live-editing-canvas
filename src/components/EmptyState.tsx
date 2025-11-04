export function EmptyState() {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M12 8v4m0 4h.01"
        />
      </svg>
      <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
        No slide decks yet
      </h3>
      <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        You don't have any slides yet. Click <span className="font-semibold">Add Slides</span> to start your first deck!
      </p>
      <div className="mt-8">
        <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>Start creating beautiful presentations</span>
        </div>
      </div>
    </div>
  )
}

