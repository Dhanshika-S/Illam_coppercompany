import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ProtectedApp from './components/ProtectedApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProtectedApp>
      <App />
    </ProtectedApp>
  </StrictMode>,
)
