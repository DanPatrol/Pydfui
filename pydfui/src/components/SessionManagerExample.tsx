import React, { useState, useEffect } from 'react';
import { useSessionManager, FileReference, SessionData } from './SessionManager';

/**
 * Example component demonstrating how to use SessionManager
 * This shows integration with a PDF processing workflow
 */
const SessionManagerExample: React.FC = () => {
  const [files, setFiles] = useState<FileReference[]>([]);
  const [operation, setOperation] = useState<string>('merge');
  const [options, setOptions] = useState<Record<string, any>>({});
  const [sessionRestored, setSessionRestored] = useState(false);

  const { saveSession, clearSession } = useSessionManager({
    sessionKey: 'pdf-tool-session',
    expirationTime: 60 * 60 * 1000, // 1 hour
    onSessionRestored: (sessionData: SessionData) => {
      // Restore the application state from session
      setFiles(sessionData.files);
      setOperation(sessionData.operation);
      setOptions(sessionData.options);
      setSessionRestored(true);
      console.log('Session restored:', sessionData);
    },
    onSessionExpired: () => {
      console.log('Session expired');
      alert('Your session has expired. Please start over.');
    },
    onSessionCleared: () => {
      console.log('Session cleared');
    },
  });

  // Save session whenever state changes
  useEffect(() => {
    if (files.length > 0 || operation || Object.keys(options).length > 0) {
      const sessionData: SessionData = {
        files,
        operation,
        options,
        timestamp: Date.now(),
      };
      saveSession(sessionData);
    }
  }, [files, operation, options, saveSession]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (uploadedFiles) {
      const fileRefs: FileReference[] = Array.from(uploadedFiles).map(file => ({
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      }));
      setFiles(prev => [...prev, ...fileRefs]);
    }
  };

  const handleOperationComplete = () => {
    // Clear session after successful operation
    clearSession();
    setFiles([]);
    setOperation('merge');
    setOptions({});
    alert('Operation completed! Session cleared.');
  };

  const handleClearSession = () => {
    // Clear session with warning
    const cleared = clearSession(true);
    if (cleared) {
      setFiles([]);
      setOperation('merge');
      setOptions({});
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Session Manager Example</h2>
      
      {sessionRestored && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Session restored! Your previous work has been recovered.
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Upload Files:
        </label>
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Operation:
        </label>
        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="merge">Merge</option>
          <option value="split">Split</option>
          <option value="compress">Compress</option>
          <option value="rotate">Rotate</option>
          <option value="watermark">Watermark</option>
        </select>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Uploaded Files ({files.length}):</h3>
        <ul className="list-disc list-inside">
          {files.map(file => (
            <li key={file.id} className="text-sm">
              {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleOperationComplete}
          disabled={files.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Complete Operation
        </button>
        <button
          onClick={handleClearSession}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Session
        </button>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h4 className="font-semibold mb-2">Session Info:</h4>
        <p className="text-sm">Files: {files.length}</p>
        <p className="text-sm">Operation: {operation}</p>
        <p className="text-sm text-gray-600">
          Session will expire after 1 hour of inactivity
        </p>
      </div>
    </div>
  );
};

export default SessionManagerExample;
