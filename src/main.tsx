import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LiveblocksProvider } from '@liveblocks/react/suspense'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LiveblocksProvider publicApiKey={import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY}>
      <App />
    </LiveblocksProvider>
  </StrictMode>,
)

