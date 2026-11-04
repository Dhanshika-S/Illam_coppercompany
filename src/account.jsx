import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AccountPage from './pages/AccountPage.jsx'
import ProtectedApp from './components/ProtectedApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProtectedApp>
    <AccountPage />
    </ProtectedApp>
  </StrictMode>,
)
