import { API_BASE_URL } from '../config';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCloudUpload } from 'react-icons/io5';
import { FiFileText, FiInfo } from 'react-icons/fi';
import { SiMicrosoftpowerpoint } from 'react-icons/si';
import { AiOutlineFilePdf } from 'react-icons/ai';

const PdfToPowerPoint: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check file extension
      const fileName = selectedFile.name.toLowerCase();
      if (fileName.endsWith('.pdf')) {
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

    let filename = 'downloaded_file';

    try {
      const response = await fetch(`${API_BASE_URL}/pdf_to_pptx`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');

        if (contentDisposition) {
          filename = contentDisposition.split('filename=')[1] || filename;
        } else {
          filename = 'converted.pptx';
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
              processType: 'pdf_to_pptx',
              status: response.status,
              filename,
            },
          });
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        setError(errorData.detail || 'Failed to convert PDF to PowerPoint');
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
      {/* Left side - Upload Area */}
      <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <AiOutlineFilePdf className="mr-3 text-red-600" />
            PDF to PowerPoint Converter
          </h2>
          <p className="text-gray-600">
            Convert PDF documents to editable PowerPoint presentations (.pptx)
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
                <AiOutlineFilePdf className="text-5xl text-red-600 mx-auto mb-3" />
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
                  Supports .pdf files
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p className="text-red-700 font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
            <FiInfo className="mr-2" />
            What gets converted?
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• One slide per PDF page</li>
            <li>• Page rendered as background image</li>
            <li>• Text extracted as editable text boxes</li>
            <li>• Images and graphics preserved</li>
            <li>• Formatting maintained where possible</li>
          </ul>
        </div>

        {/* Warning Box */}
        <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
            <FiInfo className="mr-2" />
            Important Note
          </h4>
          <p className="text-xs text-yellow-700">
            Scanned PDFs (image-based) will be converted with images only. Text will not be editable unless OCR is applied first.
          </p>
        </div>
      </div>

      {/* Right side - Convert Button & Info */}
      <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-orange-500 pb-2">
          Conversion
        </h2>

        {/* File Info */}
        {file && (
          <div className="mb-6 bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">File Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-800 truncate ml-2" title={file.name}>
                  {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium text-gray-800">
                  {(file.size / 1024).toFixed(2)} KB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium text-gray-800">PDF</span>
              </div>
            </div>
          </div>
        )}

        {/* Convert Button */}
        <button
          onClick={handleSubmit}
          disabled={isProcessing || !file}
          className={`w-full ${
            isProcessing || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transform hover:scale-105'
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
              <SiMicrosoftpowerpoint className="mr-2 text-xl" />
              Convert to PowerPoint
            </span>
          )}
        </button>

        {/* Help Text */}
        <div className="mt-6 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-orange-800 mb-2">💡 Tips</h4>
          <ul className="text-xs text-orange-700 space-y-1">
            <li>• Each PDF page becomes one slide</li>
            <li>• Text is extracted and editable</li>
            <li>• Images are preserved</li>
            <li>• Best for text-based PDFs</li>
          </ul>
        </div>

        {/* Note Box */}
        <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Use Cases</h4>
          <p className="text-xs text-blue-700">
            Perfect for converting reports, documents, and presentations back to editable PowerPoint format for further editing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PdfToPowerPoint;
