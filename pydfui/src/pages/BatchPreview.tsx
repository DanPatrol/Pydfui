import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiUpload, FiTrash2, FiCheckCircle, FiXCircle, FiFile, FiPlus } from 'react-icons/fi';

const BatchPreview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { files: initialFiles, processType, endpoint, acceptedTypes, title, description } = location.state || {};
  
  const [files, setFiles] = useState<File[]>(initialFiles ? Array.from(initialFiles) : []);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set(files.map((_, i) => i)));
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files;
    if (newFiles) {
      const fileArray = Array.from(newFiles);
      setFiles((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const uniqueFiles = fileArray.filter((f) => !existingNames.has(f.name));
        const newLength = prev.length;
        // Auto-select newly added files
        setSelectedFiles((prevSelected) => {
          const updated = new Set(prevSelected);
          uniqueFiles.forEach((_, index) => updated.add(newLength + index));
          return updated;
        });
        return [...prev, ...uniqueFiles];
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => {
      const updated = new Set(prev);
      updated.delete(index);
      // Adjust indices for files after the removed one
      const newSet = new Set<number>();
      updated.forEach((i) => {
        if (i < index) newSet.add(i);
        else if (i > index) newSet.add(i - 1);
      });
      return newSet;
    });
  };

  const toggleFileSelection = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = new Set(prev);
      if (updated.has(index)) {
        updated.delete(index);
      } else {
        updated.add(index);
      }
      return updated;
    });
  };

  const selectAll = () => {
    setSelectedFiles(new Set(files.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedFiles(new Set());
  };

  const handleSubmit = async () => {
    const selectedFilesList = files.filter((_, i) => selectedFiles.has(i));
    
    if (selectedFilesList.length === 0) {
      alert('Please select at least one file to process');
      return;
    }

    setLoading(true);

    try {
      // Process files individually since backend doesn't support batch
      const processedFiles: { name: string; blob: Blob }[] = [];
      
      for (let i = 0; i < selectedFilesList.length; i++) {
        const file = selectedFilesList[i];
        setCurrentFileIndex(i + 1);
        setProcessingStatus(`Processing ${file.name}...`);
        
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const blob = await response.blob();
          // Generate output filename based on original filename
          const originalName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
          const extension = processType === 'repair' ? '.pdf' : 
                          processType === 'wtpdf' ? '.pdf' :
                          processType === 'jpegtopdf' ? '.pdf' :
                          processType === 'exceltopdf' ? '.pdf' : '.pdf';
          const outputName = `${originalName}_processed${extension}`;
          
          processedFiles.push({ name: outputName, blob });
        } else {
          console.error(`Failed to process ${file.name}:`, response.statusText);
          // Continue processing other files even if one fails
        }
      }

      if (processedFiles.length === 0) {
        throw new Error('All files failed to process');
      }

      // If only one file was processed, download it directly
      if (processedFiles.length === 1) {
        const { name, blob } = processedFiles[0];
        setProcessingStatus('Download starting...');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Create a ZIP file for multiple processed files
        setProcessingStatus('Creating ZIP file...');
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        processedFiles.forEach(({ name, blob }) => {
          zip.file(name, blob);
        });
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${processType}_batch_output.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      navigate('/end/', {
        state: {
          processType,
          status: 200,
          filename: processedFiles.length === 1 ? processedFiles[0].name : `${processType}_batch_output.zip`,
        },
      });
    } catch (error) {
      console.error('Error while processing files:', error);
      navigate('/end/', {
        state: {
          processType,
          error: true,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="flex w-full h-screen">
      {/* Left side: File list */}
      <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAddFiles}
          accept={acceptedTypes}
          multiple
          className="hidden"
        />

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <FiPlus />
            Add More Files
          </button>
          <button
            onClick={selectAll}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <FiCheckCircle />
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <FiXCircle />
            Deselect All
          </button>
        </div>

        {/* Statistics */}
        {files.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Files</p>
                  <p className="text-2xl font-bold text-blue-600">{files.length}</p>
                </div>
                <FiFile className="text-3xl text-blue-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Selected</p>
                  <p className="text-2xl font-bold text-green-600">{selectedFiles.size}</p>
                </div>
                <FiCheckCircle className="text-3xl text-green-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Not Selected</p>
                  <p className="text-2xl font-bold text-gray-600">{files.length - selectedFiles.size}</p>
                </div>
                <FiXCircle className="text-3xl text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {/* File list */}
        {files.length > 0 ? (
          <div className="space-y-3">
            {files.map((file, index) => {
              const isSelected = selectedFiles.has(index);
              return (
                <div
                  key={index}
                  className={`bg-white rounded-lg shadow-md p-4 transition-all duration-200 ${
                    isSelected
                      ? 'border-2 border-green-500 ring-2 ring-green-200'
                      : 'border-2 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFileSelection(index)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                      />

                      {/* File icon */}
                      <div className={`p-3 rounded-lg ${isSelected ? 'bg-green-100' : 'bg-blue-100'}`}>
                        <FiFile className={`text-2xl ${isSelected ? 'text-green-600' : 'text-blue-600'}`} />
                      </div>

                      {/* File info */}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 truncate">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                      </div>

                      {/* Status badge */}
                      {isSelected && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          SELECTED
                        </span>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="text-xl" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <FiUpload className="text-6xl text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">No files uploaded</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all"
            >
              Upload Files
            </button>
          </div>
        )}
      </div>

      {/* Right side: Controls */}
      <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg flex flex-col">
        <div className="flex-grow">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-500 pb-2">
            Batch Processing
          </h2>

          {/* Process info */}
          <div className="mb-6 bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Process Type</h3>
            <p className="text-gray-700 font-medium">{processType}</p>
          </div>

          {/* Selection summary */}
          {files.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-lg border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                  <span className="text-sm text-gray-600">Files to process:</span>
                  <span className="font-bold text-blue-600">{selectedFiles.size}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                  <span className="text-sm text-gray-600">Total files:</span>
                  <span className="font-bold text-gray-600">{files.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick tips */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Quick Tips</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Click checkbox to select/deselect files</li>
              <li>• Use "Add More Files" to upload additional files</li>
              <li>• Only selected files will be processed</li>
              <li>• Click trash icon to remove files</li>
              <li>• Results will be downloaded as ZIP</li>
            </ul>
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={loading || selectedFiles.size === 0}
          className={`w-full mt-6 ${
            loading || selectedFiles.size === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
          } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
        >
          {loading ? (
            <span className="flex flex-col items-center justify-center">
              <svg className="animate-spin h-5 w-5 mb-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">{processingStatus}</span>
              <span className="text-xs mt-1">File {currentFileIndex} of {selectedFiles.size}</span>
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <FiCheckCircle className="mr-2 text-xl" />
              Process {selectedFiles.size} File{selectedFiles.size !== 1 ? 's' : ''}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default BatchPreview;
