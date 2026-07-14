import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';

// Set up Axios interceptors for authentication
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('bill_scanner_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 403 || error.response.status === 401)) {
      window.dispatchEvent(new CustomEvent('auth-error', { detail: error.response.data.error }));
    }
    return Promise.reject(error);
  }
);

function App() {
  const [token, setToken] = useState(localStorage.getItem('bill_scanner_token'));
  const [clientId, setClientId] = useState(null);
  const [error, setError] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    // Check for Google script
    const checkGoogle = setInterval(() => {
      if (window.google) {
        setGoogleLoaded(true);
        clearInterval(checkGoogle);
      }
    }, 100);
    // Fetch client ID from backend
    axios.get('/api/auth/client-id')
      .then(res => setClientId(res.data.clientId))
      .catch(err => console.error("Could not fetch client ID", err));
      
    const handleAuthError = (e) => {
      setError(e.detail);
      localStorage.removeItem('bill_scanner_token');
      setToken(null);
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
      clearInterval(checkGoogle);
    };
  }, []);

  useEffect(() => {
    if (!token && clientId && googleLoaded && window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            localStorage.setItem('bill_scanner_token', response.credential);
            setToken(response.credential);
            setError('');
          }
        }
      });
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(
          buttonRef.current,
          { theme: 'outline', size: 'large' }
        );
      }
    }
  }, [clientId, token, googleLoaded]);

  const handleLogout = () => {
    localStorage.removeItem('bill_scanner_token');
    setToken(null);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center max-w-md w-full fade-in hover-lift">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Bill Scanner</h2>
          <p className="text-slate-500 mb-8 text-sm">Please sign in with an authorized Google account to continue.</p>
          
          {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">{error}</div>}
          
          <div className="flex justify-center" ref={buttonRef}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Dashboard onLogout={handleLogout} />
    </div>
  );
}

export default App;
