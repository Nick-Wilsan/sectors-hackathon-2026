import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { App } from './App'
import { ScreenerPage } from './pages/ScreenerPage'
import { EmitenDetailPage } from './pages/EmitenDetailPage'
import { NewsPage } from './pages/NewsPage'
import { NewsDetailPage } from './pages/NewsDetailPage'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Every page now shares App's chrome (nav, ticker tape, disclaimer).
            The emiten page used to opt out as a fullscreen workstation; the
            reference mockup shows it as a normal scrolling page inside the
            same shell, and losing the nav there was a dead end for the user. */}
        <Route element={<App />}>
          <Route index element={<ScreenerPage />} />
          <Route path="berita" element={<NewsPage />} />
          <Route path="berita/:id" element={<NewsDetailPage />} />
          <Route path="emiten/:symbol" element={<EmitenDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
