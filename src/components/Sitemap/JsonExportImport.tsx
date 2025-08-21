import React from 'react';
import './JsonExportImport.sass';

type JsonExportImportProps = {
  exportJson: () => void;
  importJson: (json: string) => void;
};

const JsonExportImport: React.FC<JsonExportImportProps> = ({ exportJson, importJson }) => {
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          importJson(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="json-export-import">
      <button
        className="secondary-button"
        onClick={exportJson}
        aria-label="Export JSON"
        tabIndex={0}
      >
        Export JSON
      </button>
      <input
        type="file"
        accept=".json"
        onChange={handleImport}
        aria-label="Import JSON"
        tabIndex={0}
      />
    </div>
  );
};

export default JsonExportImport; 
