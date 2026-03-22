import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import HabitTrackerPreview from './HabitTrackerPreview'

// Disable right-click globally
document.addEventListener('contextmenu', e => e.preventDefault())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HabitTrackerPreview />
  </StrictMode>,
)
