import React, { useState } from 'react';
import { ExternalLink, Edit2, Trash2, FileText, Calendar, User, Check, X, Layers } from 'lucide-react';
import * as api from '../api';

const formatDate = (dateString) => {
  if (!dateString || dateString === 'Unknown') return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString;
};

const BillTable = ({ bills, loading, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isDeleting, setIsDeleting] = useState(null);

  const groupedBills = React.useMemo(() => {
    const grouped = {};
    bills.forEach(bill => {
      const pName = bill.appProperties?.personName || 'Unknown';
      const bDate = bill.appProperties?.billDate || 'Unknown';
      const key = `${pName}_${bDate}`;
      if (!grouped[key]) {
        grouped[key] = {
          id: key,
          personName: pName,
          billDate: bDate,
          files: []
        };
      }
      grouped[key].files.push(bill);
    });
    return Object.values(grouped).sort((a, b) => {
      if (a.billDate === 'Unknown') return 1;
      if (b.billDate === 'Unknown') return -1;
      return new Date(b.billDate) - new Date(a.billDate);
    });
  }, [bills]);

  const startEditing = (group) => {
    setEditingId(group.id);
    setEditForm({
      personName: group.personName === 'Unknown' ? '' : group.personName,
      billDate: group.billDate === 'Unknown' ? '' : group.billDate
    });
  };

  const handleSave = async (group) => {
    try {
      const dataToSubmit = {
        personName: editForm.personName,
        billDate: editForm.billDate
      };
      
      const updatedFiles = await Promise.all(
        group.files.map(f => api.updateBill(f.id, dataToSubmit))
      );
      
      updatedFiles.forEach(updated => onUpdate(updated));
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update:', error);
      alert('Failed to update bills');
    }
  };

  const handleDelete = async (group) => {
    if (!window.confirm(`Are you sure you want to delete ALL ${group.files.length} bills in this group?`)) return;
    
    setIsDeleting(group.id);
    try {
      await Promise.all(group.files.map(f => api.deleteBill(f.id)));
      group.files.forEach(f => onDelete(f.id));
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete some bills');
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

  if (!groupedBills || groupedBills.length === 0) {
    return (
      <div className="p-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-slate-400">
          <Layers size={24} />
        </div>
        <h3 className="text-lg font-medium text-slate-800 mb-1">No bills found</h3>
        <p className="text-slate-500 max-w-sm mx-auto">Upload a new bill or adjust your search filters to see results.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-4">
        {groupedBills.map((group) => {
          const isEditing = editingId === group.id;
          return (
            <div key={group.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 leading-tight">{group.personName}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} />
                      {formatDate(group.billDate)}
                    </div>
                  </div>
                </div>
                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEditing(group)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(group)} disabled={isDeleting === group.id} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="flex flex-col gap-3 bg-slate-50 p-3.5 rounded-xl border border-blue-100">
                  <input type="text" placeholder="Person Name" value={editForm.personName} onChange={e => setEditForm({...editForm, personName: e.target.value})} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 outline-none"/>
                  <input type="date" value={editForm.billDate} onChange={e => setEditForm({...editForm, billDate: e.target.value})} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 outline-none"/>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => handleSave(group)} className="flex-1 py-2 bg-green-500 hover:bg-green-600 transition-colors text-white rounded-lg font-medium text-sm flex justify-center items-center gap-1"><Check size={16}/> Save</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 transition-colors text-slate-700 rounded-lg font-medium text-sm flex justify-center items-center gap-1"><X size={16}/> Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase ml-1">Attached Bills ({group.files.length})</span>
                  <div className="flex flex-col gap-2">
                    {group.files.map((file, idx) => (
                      <a 
                        key={file.id}
                        href={file.webViewLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-xl transition-colors group/link"
                      >
                        <div className="p-1.5 bg-white shadow-sm rounded-md text-slate-400 group-hover/link:text-blue-500">
                          <FileText size={16} />
                        </div>
                        <span className="text-sm font-medium text-slate-700 group-hover/link:text-blue-700 flex-1 truncate">
                          Bill {idx + 1}
                        </span>
                        <ExternalLink size={14} className="text-slate-300 group-hover/link:text-blue-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
        <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 font-medium w-1/4">Person Name</th>
            <th className="px-6 py-4 font-medium w-1/6">Date</th>
            <th className="px-6 py-4 font-medium w-2/5">Attached Bills</th>
            <th className="px-6 py-4 font-medium text-right w-1/5">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {groupedBills.map((group) => {
            const isEditing = editingId === group.id;
            
            return (
              <tr key={group.id} className="hover:bg-slate-50/50 transition-colors group/row">
                {isEditing ? (
                  <>
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
                        type="date" 
                        value={editForm.billDate}
                        onChange={(e) => setEditForm({...editForm, billDate: e.target.value})}
                        className="w-full rounded border-slate-200 border px-2 py-1 focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-slate-400 italic">
                      {group.files.length} files attached
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleSave(group)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
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
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2 font-medium text-slate-800 pt-1.5">
                        <User size={16} className="text-slate-400" />
                        {group.personName}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2 pt-1.5 text-slate-600">
                        <Calendar size={16} className="text-slate-400" />
                        {formatDate(group.billDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {group.files.map((file, idx) => (
                          <a 
                            key={file.id}
                            href={file.webViewLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-colors text-slate-700 hover:text-blue-700 shadow-sm"
                            title={file.name}
                          >
                            <FileText size={14} className="text-slate-400" />
                            Bill {idx + 1}
                          </a>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex items-center justify-end gap-1 pt-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEditing(group)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit metadata for all bills"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(group)}
                          disabled={isDeleting === group.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete entire group from Drive"
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
    </div>
  );
};

export default BillTable;
