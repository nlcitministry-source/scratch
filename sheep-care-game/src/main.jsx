import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './debug.css'
import App from './App.jsx'
import { GameProvider } from './context/GameContext.jsx'
import ErrorBoundary from './components/ErrorBoundary';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GameProvider>
        <App />
      </GameProvider>
    </ErrorBoundary>
  </StrictMode>,
)
