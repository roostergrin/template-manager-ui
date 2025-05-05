import React from 'react';

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
    <div className="flex gap-4 items-center mt-2 mb-4">
      <button
        className="app__export-json-button bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
        className="border rounded px-2 py-1"
      />
    </div>
  );
};

export default JsonExportImport; 