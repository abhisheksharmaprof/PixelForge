import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // Optional if we still use tailwind in index.css

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
