import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

function init() {
  const el = document.getElementById('root')
  if (!el) {
    document.body.innerHTML = '<div style="padding:2rem;font-family:sans-serif;color:#f87171">Root element not found</div>'
    return
  }
  try {
    createRoot(el).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    el.innerHTML = `<div style="padding:2rem;font-family:sans-serif;color:#f87171"><h2>React failed to render</h2><pre style="background:#1a1a1a;padding:1rem;border-radius:8px;overflow:auto">${msg}</pre></div>`
    console.error(err)
  }
}

init()
