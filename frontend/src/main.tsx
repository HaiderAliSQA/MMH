import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/mmh.css'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { startKeepAlive } from './utils/keepAlive'

// Start keep-alive as soon as app loads
startKeepAlive()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
