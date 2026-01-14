import { API_BASE_URL } from '../config';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCloudUpload, IoShieldCheckmark } from 'react-icons/io5';
import { FiFileText, FiSettings, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const PdfToPdfA: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pdfaVersion, setPdfaVersion] = useState('PDF/A-2b');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pdfaVersions = [
    { value: 'PDF/A-1b', label: 'PDF/A-1b', description: 'ISO 19005-1 (2005) - Basic compliance' },
    { value: 'PDF/A-2b', label: 'PDF/A-2b', description: 'ISO 19005-2 (2011) - Recommended' },
    { value: 'PDF/A-3b', label: 'PDF/A-3b', description: 'ISO 19005-3 (2012) - Allows embedded files' },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a PDF file');
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
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pdfa_version', pdfaVersion);

    let filename = 'downloaded_file';

    try {
      const response = await fetch(`${API_BASE_URL}/pdf_to_pdfa`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');

        if (contentDisposition) {
          filename = contentDisposition.split('filename=')[1] || filename;
        } else {
          filename = 'converted_pdfa.pdf';
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
              processType: 'pdf_to_pdfa',
              status: response.status,
              filename,
            },
          });
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        setError(errorData.detail || 'Failed to convert PDF to PDF/A');
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <IoShieldCheckmark className="mr-3 text-blue-500" />
            PDF to PDF/A Converter
          </h2>
          <p className="text-gray-600">
            Convert your PDF files to archival-compliant PDF/A format for long-term preservation
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200">
          <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
            <FiFileText className="mr-2 text-blue-500" />
            Upload PDF File
          </h3>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
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
                  Click to upload PDF file
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Select a PDF file to convert to PDF/A format
                </p>
              </div>
            )}
          </div>
        </div>

        {/* What is PDF/A Info */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
          <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            <FiCheckCircle className="mr-2" />
            What is PDF/A?
          </h4>
          <p className="text-sm text-blue-700 mb-3">
            PDF/A is an ISO-standardized version of PDF specialized for digital preservation and long-term archiving of electronic documents.
          </p>
          <ul className="text-sm text-blue-700 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Self-contained:</strong> All fonts and resources are embedded</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Device-independent:</strong> Consistent appearance across all systems</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Long-term preservation:</strong> Designed for archival storage</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Compliance:</strong> Meets legal and regulatory requirements</span>
            </li>
          </ul>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p className="text-red-700 font-semibold flex items-center">
              <FiAlertCircle className="mr-2" />
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Right side - Settings & Convert */}
      <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-500 pb-2">
          Conversion Settings
        </h2>

        {/* PDF/A Version Selector */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
          <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
            <FiSettings className="mr-2 text-gray-600" />
            PDF/A Version
          </h3>
          <div className="space-y-3">
            {pdfaVersions.map((version) => (
              <label
                key={version.value}
                className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  pdfaVersion === version.value
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white border-gray-300 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="pdfaVersion"
                  value={version.value}
                  checked={pdfaVersion === version.value}
                  onChange={(e) => setPdfaVersion(e.target.value)}
                  className="mt-1 mr-3"
                />
                <div>
                  <p className="font-semibold text-gray-800">{version.label}</p>
                  <p className="text-xs text-gray-600 mt-1">{version.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Version Details */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
          <h3 className="text-sm font-semibold mb-3 text-gray-800">Version Details</h3>
          {pdfaVersion === 'PDF/A-1b' && (
            <div className="text-xs text-gray-700 space-y-2">
              <p><strong>Best for:</strong> Basic archival needs</p>
              <p><strong>Features:</strong> Visual appearance preservation</p>
              <p><strong>Limitations:</strong> No transparency, JPEG2000, or layers</p>
            </div>
          )}
          {pdfaVersion === 'PDF/A-2b' && (
            <div className="text-xs text-gray-700 space-y-2">
              <p><strong>Best for:</strong> Modern archival (recommended)</p>
              <p><strong>Features:</strong> JPEG2000, transparency, layers</p>
              <p><strong>Benefits:</strong> Better compression, smaller files</p>
            </div>
          )}
          {pdfaVersion === 'PDF/A-3b' && (
            <div className="text-xs text-gray-700 space-y-2">
              <p><strong>Best for:</strong> Archival with attachments</p>
              <p><strong>Features:</strong> All PDF/A-2b features + embedded files</p>
              <p><strong>Use case:</strong> Attach source files (XML, spreadsheets)</p>
            </div>
          )}
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
              <IoShieldCheckmark className="mr-2 text-xl" />
              Convert to PDF/A
            </span>
          )}
        </button>

        {/* Conversion Features */}
        <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-2">✓ Conversion Features</h4>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• Automatic font embedding</li>
            <li>• Color space compliance</li>
            <li>• Metadata validation</li>
            <li>• Standards compliance check</li>
            <li>• Archival-ready output</li>
          </ul>
        </div>

        {/* Use Cases */}
        <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">📋 Common Use Cases</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Legal document archiving</li>
            <li>• Government records</li>
            <li>• Medical records storage</li>
            <li>• Academic publications</li>
            <li>• Corporate compliance</li>
          </ul>
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-purple-800 mb-2">ℹ️ Note</h4>
          <p className="text-xs text-purple-700">
            The conversion process validates compliance and may report errors if the source PDF cannot be fully converted to PDF/A standards.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PdfToPdfA;
