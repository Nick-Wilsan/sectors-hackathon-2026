import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { App } from './App'
import { ScreenerPage } from './pages/ScreenerPage'
import { EmitenDetailPage } from './pages/EmitenDetailPage'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<ScreenerPage />} />
          <Route path="emiten/:symbol" element={<EmitenDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
