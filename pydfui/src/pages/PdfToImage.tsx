import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiOutlinePicture } from 'react-icons/ai';
import PDFPreview from '../components/Adjuster';

const PdfToImage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { files } = location.state || {};
  const file: File | null = files && files.length > 0 ? files[0] : null;

  const [dpi, setDpi] = useState('150');
  const [format, setFormat] = useState('png');
  const [pageRange, setPageRange] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      alert('Please upload a PDF file');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dpi', dpi);
    formData.append('image_format', format);
    if (pageRange.trim()) {
      formData.append('pages', pageRange.trim());
    }

    try {
      const response = await fetch(`${API_BASE_URL}/pdf_to_images`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = format === 'png' ? 'images.zip' : 'images.zip';
        
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+)"?/);
          if (match) filename = match[1];
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);

        setTimeout(() => {
          navigate('/end/', {
            state: {
              processType: 'pdftoimage',
              status: response.status,
              filename,
            },
          });
        }, 1000);
      } else {
        // Get error details from response
        let errorMessage = 'Failed to convert PDF to images';
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch {
          // If response is not JSON, use status text
          errorMessage = `Failed to convert PDF to images: ${response.statusText}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while converting the PDF. Please check your connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">No file selected. Please go back and upload a PDF.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen">
      <div className="w-1/2 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">PDF to Images</h2>
          <p className="text-gray-600">Convert PDF pages to JPG or PNG images.</p>
        </div>
        <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-md">
          <PDFPreview files={[file]} />
        </div>
      </div>

      <div className="w-1/2 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-500 pb-2 flex items-center">
          <AiOutlinePicture className="mr-2 text-indigo-500" />
          Conversion Settings
        </h2>

        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <label className="block text-sm font-semibold mb-2 text-gray-800">Image Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="png">PNG (Better quality, larger size)</option>
            <option value="jpg">JPG (Smaller size, good quality)</option>
          </select>
        </div>

        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <label className="block text-sm font-semibold mb-2 text-gray-800">DPI (Resolution)</label>
          <select
            value={dpi}
            onChange={(e) => setDpi(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="72">72 DPI (Screen)</option>
            <option value="150">150 DPI (Standard)</option>
            <option value="300">300 DPI (High Quality)</option>
          </select>
        </div>

        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <label className="block text-sm font-semibold mb-2 text-gray-800">Page Range (Optional)</label>
          <input
            type="text"
            value={pageRange}
            onChange={(e) => setPageRange(e.target.value)}
            placeholder="e.g., 1,3-5,8 or leave empty for all"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <p className="text-xs text-gray-500 mt-2">Leave empty to convert all pages</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className={`w-full ${
            isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 transform hover:scale-105'
          } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
        >
          {isProcessing ? 'Converting...' : 'Convert to Images'}
        </button>

        <div className="mt-6 bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-indigo-800 mb-2">💡 Tips</h4>
          <ul className="text-xs text-indigo-700 space-y-1">
            <li>• PNG for screenshots and graphics</li>
            <li>• JPG for photos and scanned documents</li>
            <li>• Higher DPI = better quality but larger files</li>
            <li>• Multiple pages will be zipped together</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PdfToImage;
