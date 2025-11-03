import { useAuthStore } from '../store/auth'
import { useNavigate } from 'react-router-dom'

export function HomePage() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
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
              <span className="text-gray-700 dark:text-gray-300">
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
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to Live Editing Canvas! 🎨
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You have successfully authenticated. This is your protected home page.
            </p>
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Your Profile:
              </h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="inline font-medium text-gray-700 dark:text-gray-300">Email: </dt>
                  <dd className="inline text-gray-600 dark:text-gray-400">{user?.email}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-gray-700 dark:text-gray-300">Username: </dt>
                  <dd className="inline text-gray-600 dark:text-gray-400">
                    {user?.user_metadata?.username || 'Not set'}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium text-gray-700 dark:text-gray-300">User ID: </dt>
                  <dd className="inline text-gray-600 dark:text-gray-400 font-mono text-xs">
                    {user?.id}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

