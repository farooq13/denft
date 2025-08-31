import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NextUIProvider } from '@nextui-org/react';
import { WalletProvider } from './contexts/WalletContext.tsx';
import { FileProvider } from './contexts/FileContext';
import { ToasterProvider } from './contexts/ToasterContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { ParticleBackground } from './components/ui/ParticleBackground';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
// import { Verify } from './pages/Verify';
import { Files } from './pages/Files';
// import { SharedFiles } from './pages/SharedFiles';
// import { Profile } from './pages/Profile';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Toaster } from './components/ui/Toaster';
import './styles/globals.css';

// Enhanced animated background with floating elements
const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Primary gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900" />
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse" />
      
      {/* Floating geometric shapes */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-bounce" 
           style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '8s' }} />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl animate-ping" 
           style={{ animationDuration: '4s' }} />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Particle effect container */}
      <ParticleBackground />
    </div>
  );
};

// Main App component with enhanced features
function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [mountAnimation, setMountAnimation] = useState(false);

  // Initialize app with smooth loading transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
      setMountAnimation(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading screen during initial app load
  if (isAppLoading) {
    return <LoadingScreen />;
  }

  return (
    <NextUIProvider>
      <ThemeProvider>
        <ToasterProvider>
          <WalletProvider>
            <FileProvider>
              <Router>
                <div className={`min-h-screen relative transition-all duration-1000 ${
                  mountAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}>
                  {/* Enhanced animated background */}
                  <AnimatedBackground />
                  
                  {/* Main app structure with glassmorphism effect */}
                  <div className="relative z-10 min-h-screen backdrop-blur-sm">
                    {/* Enhanced navbar with blur effect */}
                    <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-blue-500/20">
                      <Navbar />
                    </div>
                    
                    {/* Main content area with enhanced styling */}
                    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-140px)]">
                      <div className="transition-all duration-500 ease-out">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          {/* <Route path="/verify" element={<Verify />} /> */}
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
                          {/* <Route
                            path="/shared"
                            element={
                              <ProtectedRoute>
                                <SharedFiles />
                              </ProtectedRoute>
                            }
                          /> */}
                          {/* <Route
                            path="/profile"
                            element={
                              <ProtectedRoute>
                                <Profile />
                              </ProtectedRoute>
                            }
                          /> */}
                        </Routes>
                      </div>
                    </main>
                    
                    {/* Enhanced footer */}
                    <Footer />
                    
                    {/* Toast notifications */}
                    <Toaster />
                  </div>
                </div>
              </Router>
            </FileProvider>
          </WalletProvider>
        </ToasterProvider>
      </ThemeProvider>
    </NextUIProvider>
  );
}

export default App;