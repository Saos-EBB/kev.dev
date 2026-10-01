// YourBrand's white-label sales page, taken over unchanged from the b2b-cv
// repo (app/whitelabel/page.tsx and the lib/ files it uses). It is its own
// page (/yourbrand/) with React + Tailwind, so its styles never touch the
// portfolio; kev.dev shows it in an iframe from the YourBrand card's
// "B2B-Seite" button (facet-overlay.ts), and it also works standalone.
//
// Changes against b2b-cv, all Next.js-specific: next/link → <a> (inside the
// overlay it asks the parent to close instead), NEXT_PUBLIC_* env vars →
// their built-in defaults, the dev-only palette editor and the logo
// carousel's 37 font files left out, legal links → kev.dev's own.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/globals.css'
import B2BPage from './app/whitelabel/page'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <B2BPage />
  </StrictMode>,
)
