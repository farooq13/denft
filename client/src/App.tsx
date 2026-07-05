// src/App.tsx
// Sprint 1: Wired in AppLayout wrapper, removed standalone Navbar/Footer,
//           removed 2s splash screen (Sprint 0), code-split all routes.

import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HeroUIProvider } from '@heroui/react'
import { WalletProvider }    from '@/contexts/WalletContext'
import { FileProvider }      from '@/contexts/FileContext'
import { ToasterProvider }   from '@/contexts/ToasterContext'
import { ThemeProvider }     from '@/contexts/ThemeContext'
import { AppLayout }         from '@/components/layout/AppLayout'
import { ProtectedRoute }    from '@/components/auth/ProtectedRoute'
import { Toaster }           from '@/components/ui/toaster'
import { Skeleton }          from '@/components/ui/skeleton'
import '@/styles/globals.css'

// ── Code-split pages ──────────────────────────────────────────
const Home      = lazy(() => import('@/pages/Home').then(m      => ({ default: m.Home })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Upload    = lazy(() => import('@/pages/Upload').then(m    => ({ default: m.Upload })))
const Files     = lazy(() => import('@/pages/Files').then(m     => ({ default: m.Files })))

/** Skeleton fallback while a page chunk loads */
function PageLoader() {
  return (
    <div className="flex flex-col gap-4 py-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

/**
 * App — root component.
 *
 * Provider order (outer → inner):
 *   HeroUIProvider → ThemeProvider → ToasterProvider → WalletProvider → FileProvider
 *
 * NOTE: HeroUIProvider is kept for backward compat with WalletButton & remaining
 * HeroUI components. It will be removed progressively through Sprints 2–8.
 */
function App() {
  return (
    <HeroUIProvider>
      <ThemeProvider>
        <ToasterProvider>
          <WalletProvider>
            <FileProvider>
              <Router>
                <AppLayout>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Home />} />

                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/upload"
                        element={
                          <ProtectedRoute>
                            <Upload />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/files"
                        element={
                          <ProtectedRoute>
                            <Files />
                          </ProtectedRoute>
                        }
                      />

                      {/* TODO Sprint 5: /files/:id — file detail modal */}
                      {/* TODO Sprint 6: /explore  — public file browser */}
                      {/* TODO Sprint 7: /settings — user settings & profile */}
                    </Routes>
                  </Suspense>
                </AppLayout>

                {/* Sonner toast container — positioned bottom-right */}
                <Toaster />
              </Router>
            </FileProvider>
          </WalletProvider>
        </ToasterProvider>
      </ThemeProvider>
    </HeroUIProvider>
  )
}

export default App