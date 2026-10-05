import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AppProvider } from './store/AppContext'
import './index.css'
createRoot(document.getElementById('root')).render(<AppProvider><App /></AppProvider>)
