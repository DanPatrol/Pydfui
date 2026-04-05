import { API_BASE_URL } from '../config';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCloudUpload } from 'react-icons/io5';
import { FiFileText, FiInfo } from 'react-icons/fi';
import { AiOutlineFileMarkdown } from 'react-icons/ai';
import SEOHead from '../components/SEOHead';

const MarkdownToPdf: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a Markdown file (.md or .markdown)');
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
      setError('Please select a Markdown file');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    let filename = 'converted.pdf';

    try {
      const response = await fetch(`${API_BASE_URL}/markdown_to_pdf`, {
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
            state: { processType: 'markdown_to_pdf', status: response.status, filename },
          });
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        setError(errorData.detail || 'Failed to convert Markdown to PDF');
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
        title="Markdown to PDF - Convert MD Files to PDF | PDF Workshop"
        description="Convert Markdown files to beautifully formatted PDF documents. Free online Markdown to PDF converter."
        url="https://www.pdfworkshop.sbs/markdowntopdf"
        keywords="markdown to pdf, md to pdf, convert markdown pdf, markdown converter, md file to pdf"
      />
      <div className="w-full lg:w-3/4 border-b lg:border-b-0 lg:border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <AiOutlineFileMarkdown className="mr-3 text-gray-800" />
            Markdown to PDF
          </h2>
          <p className="text-gray-600">Convert Markdown files to beautifully formatted PDFs</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200">
          <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
            <FiFileText className="mr-2 text-gray-500" />
            Upload Markdown File
          </h3>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".md,.markdown"
            className="hidden"
          />
          <div
            onClick={handleFileClick}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 hover:bg-gray-50 transition-all"
          >
            {file ? (
              <div>
                <AiOutlineFileMarkdown className="text-5xl text-gray-800 mx-auto mb-3" />
                <p className="text-lg font-semibold text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <p className="text-xs text-gray-500 mt-3">Click to change file</p>
              </div>
            ) : (
              <div>
                <IoCloudUpload className="text-5xl text-gray-400 mx-auto mb-3" />
                <p className="text-lg font-semibold text-gray-700">Click to upload Markdown file</p>
                <p className="text-sm text-gray-500 mt-1">Supports .md and .markdown files</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p className="text-blue-700 font-semibold">Warning: {error}</p>
          </div>
        )}

        <div className="mt-6 bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
            <FiInfo className="mr-2" />
            Supported Markdown Features
          </h4>
          <ul className="text-xs text-gray-700 space-y-1">
            <li>- Headings, bold, italic, strikethrough</li>
            <li>- Ordered and unordered lists</li>
            <li>- Code blocks with syntax highlighting</li>
            <li>- Tables, blockquotes, and horizontal rules</li>
            <li>- Links and images</li>
          </ul>
        </div>
      </div>

      <div className="w-full lg:w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-gray-800 pb-2">
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
                <span className="text-gray-600">Output:</span>
                <span className="font-medium text-gray-800">PDF</span>
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
              : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 transform hover:scale-105'
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
            <span className="flex items-center justify-center">
              <AiOutlineFileMarkdown className="mr-2 text-xl" />
              Convert to PDF
            </span>
          )}
        </button>

        <div className="mt-6 bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Tips</h4>
          <ul className="text-xs text-gray-700 space-y-1">
            <li>- Use standard Markdown syntax</li>
            <li>- Images referenced by URL are included</li>
            <li>- Output is professionally formatted</li>
            <li>- Great for documentation and reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MarkdownToPdf;
