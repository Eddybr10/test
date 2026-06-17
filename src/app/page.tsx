"use client";

import { useState, useEffect } from 'react';
import Auth from '@/components/Auth';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Basic check if we have session in memory (masterKey)
    const masterKey = sessionStorage.getItem('masterKey');
    if (masterKey) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    sessionStorage.removeItem('masterKey');
    sessionStorage.removeItem('sessionSalt');
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'}}>Cargando bóveda...</div>;

  return (
    <main>
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Auth onAuthenticated={() => setIsAuthenticated(true)} />
      )}
    </main>
  );
}
