import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/mmh.css'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { startKeepAlive } from './utils/keepAlive'

// Start keep-alive as soon as app loads
startKeepAlive()

// Apply saved theme on startup
if (!localStorage.getItem('mmh-scheme')) {
  localStorage.setItem('mmh-scheme', 'dark')
  document.documentElement.setAttribute('data-scheme', 'dark')
}

const savedAccent = localStorage.getItem('mmh-accent') || 'default'
const savedScheme = localStorage.getItem('mmh-scheme') || 'dark'
document.documentElement.setAttribute('data-accent', savedAccent)
document.documentElement.setAttribute('data-scheme', savedScheme)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
