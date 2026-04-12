import React, { useState, useMemo } from 'react';
import { Download, Edit2, Save, Trash2, X, Search, Check, Database, Cloud } from 'lucide-react';
import Papa from 'papaparse';

const EditableTable = ({ data, setData, columns, title, isDark, onSyncRow, isSyncAvailable }) => {
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCells, setExpandedCells] = useState({}); // { 'rowIdx-colIdx': true }

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(lowerSearch)
      )
    );
  }, [data, searchTerm]);

  const toggleExpand = (rowIdx, colIdx) => {
    const key = `${rowIdx}-${colIdx}`;
    setExpandedCells(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleEditClick = (rowIndex, row) => {
    setEditingRowIndex(rowIndex);
    setEditFormData({ ...row });
  };

  const handleCancelClick = () => {
    setEditingRowIndex(null);
    setEditFormData({});
  };

  const handleSaveClick = (originalIndex) => {
    const newData = [...data];
    const editedRow = { ...editFormData };
    newData[originalIndex] = editedRow;
    setData(newData);
    setEditingRowIndex(null);

    // Trigger Cloud Sync if configured
    if (isSyncAvailable && onSyncRow) {
      onSyncRow(originalIndex, editedRow);
    }
  };

  const handleDeleteClick = (originalIndex) => {
    if (window.confirm('Are you sure you want to delete this row?')) {
      const newData = [...data];
      newData.splice(originalIndex, 1);
      setData(newData);
    }
  };

  const handleInputChange = (e, column) => {
    setEditFormData({
      ...editFormData,
      [column]: e.target.value,
    });
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_Export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl mb-4">
          <Database className="w-8 h-8 text-slate-400 animate-pulse" />
        </div>
        <h3 className="text-slate-800 dark:text-slate-100 font-black mb-1">No Data Records Found</h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Waiting for synchronization or empty source...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isDark ? 'dark' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search all data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[300px]"
          />
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95"
        >
          <Download className="w-5 h-5" />
          Export CSV to Save
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl bg-white dark:bg-slate-800 flex-1 relative">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Actions</th>
                {columns.map((col, idx) => (
                  <th key={idx} scope="col" className="px-6 py-4 font-bold tracking-wider whitespace-nowrap">
                    {col || `Column ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredData.map((row) => {
                const originalIndex = data.indexOf(row);
                const isEditing = editingRowIndex === originalIndex;

                return (
                  <tr key={originalIndex} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap border-r border-slate-100 dark:border-slate-700">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleSaveClick(originalIndex)} 
                            className="relative p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 transition-colors" 
                            title={isSyncAvailable ? "Save & Sync to Sheet" : "Save Locally"}
                          >
                            <Check className="w-4 h-4" />
                            {isSyncAvailable && (
                              <div className="absolute -top-1 -right-1 p-0.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-800">
                                <Cloud className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </button>
                          <button onClick={handleCancelClick} className="p-2 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 rounded-lg hover:bg-rose-200 transition-colors" title="Cancel">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEditClick(originalIndex, row)} className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(originalIndex)} className="p-2 bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400 rounded-lg hover:bg-rose-100 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    {columns.map((col, colIdx) => {
                      const value = row[col] || '';
                      const isLongText = String(value).length > 50;
                      const isExpanded = expandedCells[`${originalIndex}-${colIdx}`];
                      const isFeedbackCol = String(col).toLowerCase().includes('feedback') || 
                                            String(col).toLowerCase().includes('improvement') ||
                                            String(col).toLowerCase().includes('remark');

                      return (
                        <td key={colIdx} className="px-6 py-4 text-slate-700 dark:text-slate-300">
                          {isEditing ? (
                            <textarea
                              rows={1}
                              value={editFormData[col] || ''}
                              onChange={(e) => handleInputChange(e, col)}
                              className="w-full min-w-[200px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white text-sm"
                            />
                          ) : (
                            <div 
                              className={`relative ${isLongText || isFeedbackCol ? 'cursor-pointer group' : ''}`}
                              onClick={() => (isLongText || isFeedbackCol) && toggleExpand(originalIndex, colIdx)}
                            >
                              <div className={`${!isExpanded && (isLongText || isFeedbackCol) ? 'max-w-[250px] truncate pr-8' : 'max-w-[500px] whitespace-pre-wrap'} transition-all duration-300`}>
                                {value}
                              </div>
                              {!isExpanded && (isLongText || isFeedbackCol) && (
                                <span className="absolute right-0 top-0 text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">
                                  MORE
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EditableTable;
