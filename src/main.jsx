import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ClaimPortal from './ClaimPortal.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClaimPortal />
  </StrictMode>,
)
