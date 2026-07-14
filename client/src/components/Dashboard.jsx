import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Search, RefreshCw, FileText, Lock } from 'lucide-react';
import axios from 'axios';
import * as api from '../api';
import UploadModal from './UploadModal';
import BillTable from './BillTable';

const Dashboard = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filters, setFilters] = useState({ personName: '', startDate: '', endDate: '' });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const uniqueNames = [...new Set(bills.map(b => b.appProperties?.personName).filter(Boolean))];
  
  // Auth state
  const [authUrl, setAuthUrl] = useState(null);
  const [authError, setAuthError] = useState(null);

  const checkAuthAndFetch = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const authRes = await axios.get('/api/auth/url');
      if (!authRes.data.authenticated) {
        setAuthUrl(authRes.data.url);
        setLoading(false);
        return;
      }
      
      // If authenticated, fetch bills
      setAuthUrl(null);
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
      const data = await api.getBills(activeFilters);
      setBills(data || []);
    } catch (error) {
      console.error('Error in auth or fetch:', error);
      if (error.response?.data?.error) {
        setAuthError(error.response.data.error);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    checkAuthAndFetch();
  }, [checkAuthAndFetch]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleBillDeleted = (id) => {
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const handleBillUpdated = (updatedBill) => {
    setBills(prev => prev.map(b => b.id === updatedBill.id ? { ...b, appProperties: updatedBill.appProperties } : b));
  };

  if (authError && authError.includes('credentials.json not found')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-lg fade-in">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Missing Credentials</h2>
          <p className="text-slate-600 mb-6 text-sm">
            To use this app with your personal Google Drive, you must create an <strong>OAuth 2.0 Client ID</strong> (Web application) in Google Cloud, download it, rename it to <code>credentials.json</code>, and place it in the <code>server/</code> folder.
          </p>
          <div className="text-left bg-slate-50 p-4 rounded-xl text-sm text-slate-600 mb-6 border border-slate-200">
            <strong>Authorized redirect URIs:</strong><br/>
            <code>{window.location.origin}/api/auth/callback</code>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            I've added it, reload page
          </button>
        </div>
      </div>
    );
  }

  if (authUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center max-w-md fade-in hover-lift">
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Google Drive Access</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Please authorize this app to securely store and manage bills directly in your Google Drive.
          </p>
          <a 
            href={authUrl} 
            target="_blank" 
            rel="noreferrer" 
            className="block w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all"
          >
            Connect to Google Drive
          </a>
          <button 
            onClick={() => checkAuthAndFetch()} 
            className="block w-full mt-4 py-3 text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
          >
            I have authorized, continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30 text-white">
              <FileText size={24} />
            </div>
            Bill Scanner
          </h1>
          <p className="mt-2 text-sm text-slate-500">Manage and store your bills securely in Google Drive.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all hover-lift"
          >
            <Upload size={18} />
            Upload Bill
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Search by Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input 
              type="text" 
              name="personName"
              value={filters.personName}
              onChange={(e) => {
                handleFilterChange(e);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="e.g. John Doe"
              className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border py-2.5 px-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
            {showSuggestions && uniqueNames.filter(n => n.toLowerCase().includes(filters.personName.toLowerCase())).length > 0 && (
              <ul className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-auto py-1">
                {uniqueNames
                  .filter(n => n.toLowerCase().includes(filters.personName.toLowerCase()))
                  .map(name => (
                    <li 
                      key={name}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFilters(prev => ({ ...prev, personName: name }));
                        setShowSuggestions(false);
                      }}
                      className="px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
                    >
                      {name}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
          <input 
            type="date" 
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="w-full rounded-xl border-slate-200 bg-slate-50 border py-2.5 px-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
          <input 
            type="date" 
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="w-full rounded-xl border-slate-200 bg-slate-50 border py-2.5 px-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </div>
        <button 
          onClick={checkAuthAndFetch}
          className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
          title="Refresh Data"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <BillTable 
          bills={bills} 
          loading={loading} 
          onDelete={handleBillDeleted}
          onUpdate={handleBillUpdated}
        />
      </div>

      {/* Modals */}
      {isUploadOpen && (
        <UploadModal 
          bills={bills}
          onClose={() => setIsUploadOpen(false)} 
          onUploadSuccess={() => {
            setIsUploadOpen(false);
            checkAuthAndFetch();
          }} 
        />
      )}
    </div>
  );
};

export default Dashboard;
