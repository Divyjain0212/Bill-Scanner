import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Loader2, FileText, Trash2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import * as api from '../api';

const UploadModal = ({ bills = [], onClose, onUploadSuccess }) => {
  const uniqueNames = [...new Set(bills.map(b => b.appProperties?.personName).filter(Boolean))];
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    personName: '',
    billDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const valid = [];
    let hasInvalid = false;
    selected.forEach(file => {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        valid.push(file);
      } else {
        hasInvalid = true;
      }
    });
    
    if (hasInvalid) {
      setError('Some files were ignored. Only images (JPG, PNG) and PDFs are accepted.');
    } else {
      setError(null);
    }
    
    if (valid.length > 0) {
      setFiles(prev => [...prev, ...valid]);
    }
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const uploadPromises = files.map(async (file) => {
        let fileToUpload = file;
        
        if (file.type.startsWith('image/')) {
          try {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 2560,
              initialQuality: 0.9,
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
        data.append('billDate', formData.billDate);
        
        return api.uploadBill(data);
      });
      
      await Promise.all(uploadPromises);
      onUploadSuccess();
    } catch (err) {
      if (err.response?.status === 413) {
        setError("One of the files is too large! Please upload smaller photos.");
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
          
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 relative hover:bg-slate-100 transition-colors overflow-hidden min-h-[120px] flex items-center justify-center">
            <input 
              type="file" 
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              required={files.length === 0}
            />
            <div className="flex flex-col items-center gap-2 pointer-events-none py-2">
              <UploadCloud size={32} className="text-blue-500" />
              <div className="text-sm font-medium text-slate-700">
                Drag & drop or click to add files
              </div>
              <div className="text-xs text-slate-400">PDF, JPG, PNG</div>
            </div>
          </div>
          
          {files.length > 0 && (
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {file.type.startsWith('image/') ? (
                      <img src={previewUrls[idx]} alt="Preview" className="h-10 w-10 object-cover rounded shadow-sm border border-slate-200 shrink-0" />
                    ) : (
                      <div className="h-10 w-10 bg-white rounded shadow-sm border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                        <FileText size={20} />
                      </div>
                    )}
                    <span className="text-xs font-medium text-slate-700 truncate">{file.name}</span>
                  </div>
                  <button type="button" onClick={() => removeFile(idx)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

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
                        e.preventDefault(); 
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
              disabled={loading || files.length === 0}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed hover-lift"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : `Upload ${files.length > 0 ? files.length + ' File' + (files.length > 1 ? 's' : '') : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
