import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';

interface ImportExportControlsProps {
  onExport: () => void;
  onImport: (file: File) => void;
}

const ImportExportControls: React.FC<ImportExportControlsProps> = ({ onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
      // Reset input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={onExport}
        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-600 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        title="Export Data (Backup)"
      >
        <Download className="w-4 h-4" /> <span className="hidden sm:inline">Backup</span>
      </button>
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-600 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        title="Import Data"
      >
        <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Import</span>
      </button>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />
    </div>
  );
};

export default ImportExportControls;