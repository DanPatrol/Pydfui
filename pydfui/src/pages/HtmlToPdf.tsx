import { API_BASE_URL } from '../config';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCloudUpload, IoCode } from 'react-icons/io5';
import { FiFileText, FiSettings } from 'react-icons/fi';

type InputMethod = 'file' | 'content';

const HtmlToPdf: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [inputMethod, setInputMethod] = useState<InputMethod>('file');
  const [file, setFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [pageSize, setPageSize] = useState('A4');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageSizes = ['A4', 'Letter', 'Legal', 'A3', 'A5', 'Tabloid'];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/html' || selectedFile.name.endsWith('.html') || selectedFile.name.endsWith('.htm')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select an HTML file (.html or .htm)');
        setFile(null);
      }
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    setError(null);
    
    // Validation
    if (inputMethod === 'file' && !file) {
      setError('Please select an HTML file');
      return;
    }
    if (inputMethod === 'content' && !htmlContent.trim()) {
      setError('Please enter HTML content');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();

    // Add input based on method
    if (inputMethod === 'file' && file) {
      formData.append('file', file);
    } else if (inputMethod === 'content') {
      formData.append('html_content', htmlContent);
    }

    // Add page size
    formData.append('page_size', pageSize);

    let filename = 'downloaded_file';

    try {
      const response = await fetch(`${API_BASE_URL}/html_to_pdf`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');

        if (contentDisposition) {
          filename = contentDisposition.split('filename=')[1] || filename;
        } else {
          filename = 'converted.pdf';
        }

        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(downloadUrl);

        setTimeout(() => {
          navigate('/end/', {
            state: {
              processType: 'html_to_pdf',
              status: response.status,
              filename,
            },
          });
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        setError(errorData.detail || 'Failed to convert HTML to PDF');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error while converting:', error);
      setError('Network error. Please check your connection and try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex w-full h-screen">
      {/* Left side - Input Area */}
      <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">HTML to PDF Converter</h2>
          <p className="text-gray-600">
            Convert HTML files, web pages, or HTML content to PDF format
          </p>
        </div>

        {/* Input Method Selector */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Select Input Method</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setInputMethod('file');
                setError(null);
              }}
              className={`p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                inputMethod === 'file'
                  ? 'bg-blue-500 text-white border-blue-600 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              <IoCloudUpload className="text-3xl mx-auto mb-2" />
              <p className="font-semibold">Upload File</p>
              <p className="text-xs mt-1 opacity-80">HTML file from computer</p>
            </button>
            <button
              onClick={() => {
                setInputMethod('content');
                setError(null);
              }}
              className={`p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                inputMethod === 'content'
                  ? 'bg-blue-500 text-white border-blue-600 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              <IoCode className="text-3xl mx-auto mb-2" />
              <p className="font-semibold">HTML Content</p>
              <p className="text-xs mt-1 opacity-80">Paste HTML code</p>
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200">
          {inputMethod === 'file' && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
                <FiFileText className="mr-2 text-blue-500" />
                Upload HTML File
              </h3>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".html,.htm,text/html"
                className="hidden"
              />
              <div
                onClick={handleFileClick}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                {file ? (
                  <div>
                    <FiFileText className="text-5xl text-green-500 mx-auto mb-3" />
                    <p className="text-lg font-semibold text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <p className="text-xs text-blue-600 mt-3">Click to change file</p>
                  </div>
                ) : (
                  <div>
                    <IoCloudUpload className="text-5xl text-gray-400 mx-auto mb-3" />
                    <p className="text-lg font-semibold text-gray-700">
                      Click to upload HTML file
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Supports .html and .htm files
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {inputMethod === 'content' && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
                <IoCode className="mr-2 text-blue-500" />
                Paste HTML Content
              </h3>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="<html>&#10;  <head>&#10;    <title>My Document</title>&#10;  </head>&#10;  <body>&#10;    <h1>Hello World</h1>&#10;  </body>&#10;</html>"
                className="w-full h-96 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Paste your HTML code here. CSS styles will be preserved.
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p className="text-red-700 font-semibold">⚠️ {error}</p>
          </div>
        )}
      </div>

      {/* Right side - Settings & Convert */}
      <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-500 pb-2">
          PDF Settings
        </h2>

        {/* Page Size Selector */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
          <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
            <FiSettings className="mr-2 text-gray-600" />
            Page Size
          </h3>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base font-medium"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <div className="mt-4 text-xs text-gray-600 space-y-1">
            <p>• <strong>A4:</strong> 210 × 297 mm (standard)</p>
            <p>• <strong>Letter:</strong> 8.5 × 11 in (US)</p>
            <p>• <strong>Legal:</strong> 8.5 × 14 in (US)</p>
          </div>
        </div>

        {/* Convert Button */}
        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className={`w-full ${
            isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
          } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Converting...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <FiFileText className="mr-2 text-xl" />
              Convert to PDF
            </span>
          )}
        </button>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Features</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Preserves CSS styling</li>
            <li>• Includes external images</li>
            <li>• Supports custom fonts</li>
            <li>• Maintains page layout</li>
            <li>• Handles responsive design</li>
          </ul>
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">ℹ️ Note</h4>
          <p className="text-xs text-yellow-700">
            JavaScript and animations will not be executed. The PDF will show the static HTML content.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HtmlToPdf;
