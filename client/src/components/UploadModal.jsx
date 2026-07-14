import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Loader2, FileText } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import * as api from '../api';

const UploadModal = ({ bills = [], onClose, onUploadSuccess }) => {
  const uniqueNames = [...new Set(bills.map(b => b.appProperties?.personName).filter(Boolean))];
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    personName: '',
    totalAmount: '',
    billDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    setLoading(true);
    setError(null);
    
    let fileToUpload = file;
    
    // Compress image if it's an image to prevent Vercel 4.5MB limits
    if (file.type.startsWith('image/')) {
      try {
        const options = {
          maxSizeMB: 3.5, // High quality, but kept safely under Vercel's 4.5MB limit
          maxWidthOrHeight: 4096, // Extremely high resolution
          useWebWorker: true
        };
        const compressedFile = await imageCompression(file, options);
        fileToUpload = new File([compressedFile], file.name, { type: compressedFile.type });
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    }
    
    const data = new FormData();
    data.append('file', fileToUpload);
    data.append('personName', formData.personName);
    data.append('totalAmount', formData.totalAmount);
    data.append('billDate', formData.billDate);

    try {
      await api.uploadBill(data);
      onUploadSuccess();
    } catch (err) {
      if (err.response?.status === 413) {
        setError("File is too large! Please upload a smaller photo.");
      } else {
        setError(err.response?.data?.error || err.message || "Upload failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-xl w-full max-w-md max-h-[95vh] flex flex-col mt-10 md:mt-0 relative">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-semibold text-slate-800">Upload New Bill</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto pb-8 md:pb-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 relative hover:bg-slate-100 transition-colors overflow-hidden min-h-[160px] flex items-center justify-center">
            {!file && (
              <input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const selected = e.target.files[0];
                  if (selected && (selected.type.startsWith('image/') || selected.type === 'application/pdf')) {
                    setFile(selected);
                    setError(null);
                  } else if (selected) {
                    setError('Only image files (JPG, PNG) and PDFs are accepted.');
                    e.target.value = ''; // reset input
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                required
              />
            )}
            
            {file ? (
              <div className="flex flex-col items-center gap-3 w-full z-20 relative">
                {file.type.startsWith('image/') ? (
                  <img src={previewUrl} alt="Preview" className="h-32 object-contain rounded-lg shadow-sm border border-slate-200" />
                ) : file.type === 'application/pdf' ? (
                  <div className="h-32 w-full max-w-[200px] rounded-lg shadow-sm border border-slate-200 overflow-hidden bg-white">
                    <object data={previewUrl} type="application/pdf" className="w-full h-full">
                      <div className="flex flex-col items-center justify-center h-full bg-slate-100 text-slate-500 p-2">
                        <FileText size={24} className="mb-1" />
                        <span className="text-xs font-medium">PDF Document</span>
                      </div>
                    </object>
                  </div>
                ) : null}
                <div className="text-sm font-medium text-slate-700 truncate max-w-[250px] px-2">
                  {file.name}
                </div>
                <button 
                  type="button" 
                  onClick={() => setFile(null)} 
                  className="text-xs text-red-600 hover:text-red-700 font-semibold bg-red-50 hover:bg-red-100 transition-colors px-3 py-1.5 rounded-lg"
                >
                  Remove & Select Different File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 pointer-events-none py-4">
                <UploadCloud size={32} className="text-blue-500" />
                <div className="text-sm font-medium text-slate-700">
                  Drag & drop or click to upload
                </div>
                <div className="text-xs text-slate-400">PDF, JPG, PNG up to 10MB</div>
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Person Name</label>
            <input 
              type="text" 
              required
              value={formData.personName}
              onChange={(e) => {
                setFormData({...formData, personName: e.target.value});
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full rounded-xl border-slate-200 bg-white border py-2.5 px-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              placeholder="Enter name"
            />
            {showSuggestions && formData.personName.trim().length > 0 && uniqueNames.filter(n => n.toLowerCase().includes(formData.personName.toLowerCase()) && n.toLowerCase() !== formData.personName.toLowerCase()).length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-auto py-1">
                {uniqueNames
                  .filter(n => n.toLowerCase().includes(formData.personName.toLowerCase()))
                  .map(name => (
                    <li 
                      key={name}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        setFormData({...formData, personName: name});
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount</label>
            <input 
              type="number" 
              step="0.01"
              required
              value={formData.totalAmount}
              onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
              className="w-full rounded-xl border-slate-200 bg-white border py-2.5 px-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bill Date</label>
            <input 
              type="date" 
              required
              value={formData.billDate}
              onChange={(e) => setFormData({...formData, billDate: e.target.value})}
              className="w-full rounded-xl border-slate-200 bg-white border py-2.5 px-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          <div className="mt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed hover-lift"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Upload Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
