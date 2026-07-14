import React, { useState } from 'react';
import { ExternalLink, Edit2, Trash2, FileText, Calendar, IndianRupee, User, Check, X } from 'lucide-react';
import * as api from '../api';

const BillTable = ({ bills, loading, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isDeleting, setIsDeleting] = useState(null);

  const startEditing = (bill) => {
    setEditingId(bill.id);
    setEditForm({
      personName: bill.appProperties?.personName || '',
      totalAmount: bill.appProperties?.totalAmount || '',
      billDate: bill.appProperties?.billDate || '',
      file: null
    });
  };

  const handleSave = async (id) => {
    try {
      let dataToSubmit = editForm;
      
      if (editForm.file) {
        dataToSubmit = new FormData();
        dataToSubmit.append('file', editForm.file);
        dataToSubmit.append('personName', editForm.personName);
        dataToSubmit.append('totalAmount', editForm.totalAmount);
        dataToSubmit.append('billDate', editForm.billDate);
      }
      
      const updated = await api.updateBill(id, dataToSubmit);
      onUpdate(updated);
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update:', error);
      alert('Failed to update bill');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill? This will remove it from Google Drive as well.')) return;
    
    setIsDeleting(id);
    try {
      await api.deleteBill(id);
      onDelete(id);
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete bill');
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading bills from Google Drive...</p>
      </div>
    );
  }

  if (!bills || bills.length === 0) {
    return (
      <div className="p-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-slate-400">
          <FileText size={24} />
        </div>
        <h3 className="text-lg font-medium text-slate-800 mb-1">No bills found</h3>
        <p className="text-slate-500 max-w-sm mx-auto">Upload a new bill or adjust your search filters to see results.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 font-medium">Document Name</th>
            <th className="px-6 py-4 font-medium">Person Name</th>
            <th className="px-6 py-4 font-medium">Amount</th>
            <th className="px-6 py-4 font-medium">Date</th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bills.map((bill) => {
            const isEditing = editingId === bill.id;
            
            return (
              <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText size={16} />
                    </div>
                    <a 
                      href={bill.webViewLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-slate-800 hover:text-blue-600 truncate max-w-[200px] block transition-colors"
                      title={bill.name}
                    >
                      {bill.name}
                    </a>
                  </div>
                </td>
                
                {isEditing ? (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-slate-500 truncate max-w-[200px]">Current: {bill.name}</span>
                        <input 
                          type="file" 
                          onChange={(e) => setEditForm({...editForm, file: e.target.files[0]})}
                          className="text-xs w-full text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="text" 
                        value={editForm.personName}
                        onChange={(e) => setEditForm({...editForm, personName: e.target.value})}
                        className="w-full rounded border-slate-200 border px-2 py-1 focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number" 
                        value={editForm.totalAmount}
                        onChange={(e) => setEditForm({...editForm, totalAmount: e.target.value})}
                        className="w-full rounded border-slate-200 border px-2 py-1 focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="date" 
                        value={editForm.billDate}
                        onChange={(e) => setEditForm({...editForm, billDate: e.target.value})}
                        className="w-full rounded border-slate-200 border px-2 py-1 focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleSave(bill.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        {bill.appProperties?.personName || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <IndianRupee size={14} className="text-slate-400" />
                        {bill.appProperties?.totalAmount || '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {bill.appProperties?.billDate || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={bill.webViewLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View in Drive"
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button 
                          onClick={() => startEditing(bill)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit metadata"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(bill.id)}
                          disabled={isDeleting === bill.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete from Drive"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BillTable;
