import { API_BASE_URL } from '../config';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCloudUpload } from 'react-icons/io5';
import { FiFileText, FiInfo } from 'react-icons/fi';
import { AiOutlineFileText } from 'react-icons/ai';
import SEOHead from '../components/SEOHead';

const TxtToPdf: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fontSize, setFontSize] = useState(11);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      if (fileName.endsWith('.txt')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a .txt file');
        setFile(null);
      }
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    setError(null);
    if (!file) {
      setError('Please select a text file');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('font_size', fontSize.toString());

    let filename = 'converted.pdf';

    try {
      const response = await fetch(`${API_BASE_URL}/txt_to_pdf`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+)"?/);
          if (match) filename = match[1];
        }

        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(downloadUrl);

        setTimeout(() => {
          navigate('/end/', {
            state: { processType: 'txt_to_pdf', status: response.status, filename },
          });
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        setError(errorData.detail || 'Failed to convert text to PDF');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error while converting:', error);
      setError('Network error. Please check your connection and try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      <SEOHead
        title="Text to PDF - Convert TXT Files to PDF | PDF Workshop"
        description="Convert plain text files to PDF format. Customize font size and formatting. Free online text to PDF converter."
        url="https://www.pdfworkshop.sbs/txttopdf"
        keywords="text to pdf, txt to pdf, convert text to pdf, notepad to pdf, plain text pdf"
      />
      <div className="w-full lg:w-3/4 border-b lg:border-b-0 lg:border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <AiOutlineFileText className="mr-3 text-gray-600" />
            Text to PDF Converter
          </h2>
          <p className="text-gray-600">Convert plain text files to PDF format</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200">
          <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
            <FiFileText className="mr-2 text-gray-500" />
            Upload Text File
          </h3>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt"
            className="hidden"
          />
          <div
            onClick={handleFileClick}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 hover:bg-gray-50 transition-all"
          >
            {file ? (
              <div>
                <AiOutlineFileText className="text-5xl text-gray-600 mx-auto mb-3" />
                <p className="text-lg font-semibold text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <p className="text-xs text-gray-500 mt-3">Click to change file</p>
              </div>
            ) : (
              <div>
                <IoCloudUpload className="text-5xl text-gray-400 mx-auto mb-3" />
                <p className="text-lg font-semibold text-gray-700">Click to upload text file</p>
                <p className="text-sm text-gray-500 mt-1">Supports .txt files</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow-md border-2 border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Options</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min={6}
              max={24}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Default: 11pt</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p className="text-blue-700 font-semibold">Warning: {error}</p>
          </div>
        )}
      </div>

      <div className="w-full lg:w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-gray-600 pb-2">
          Conversion
        </h2>

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
                <span className="font-medium text-gray-800">{(file.size / 1024).toFixed(2)} KB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Font:</span>
                <span className="font-medium text-gray-800">{fontSize}pt</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isProcessing || !file}
          className={`w-full ${
            isProcessing || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 transform hover:scale-105'
          } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Converting...
            </span>
          ) : (
            'Convert to PDF'
          )}
        </button>

        <div className="mt-6 bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
            <FiInfo className="mr-2" />
            Tips
          </h4>
          <ul className="text-xs text-gray-700 space-y-1">
            <li>- UTF-8 encoded text files work best</li>
            <li>- Line breaks are preserved</li>
            <li>- Long lines are wrapped automatically</li>
            <li>- Output uses A4 page size</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TxtToPdf;
