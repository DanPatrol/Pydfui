import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineExpandAlt } from 'react-icons/ai';
import PDFPreview from '../components/Adjuster';
import SEOHead from '../components/SEOHead';

const ResizePdfPages: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { files } = location.state || {};
  const file: File | null = files && files.length > 0 ? files[0] : null;

  const [isProcessing, setIsProcessing] = useState(false);
  const [format, setFormat] = useState('A4');

  const pageSizes = [
    { value: 'A4', label: 'A4', desc: '210 x 297 mm' },
    { value: 'Letter', label: 'Letter', desc: '8.5 x 11 in' },
    { value: 'Legal', label: 'Legal', desc: '8.5 x 14 in' },
    { value: 'A3', label: 'A3', desc: '297 x 420 mm' },
    { value: 'A5', label: 'A5', desc: '148 x 210 mm' },
  ];

  const handleSubmit = async () => {
    if (!file) {
      alert('Please upload a PDF file');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);

    try {
      const response = await fetch(`${API_BASE_URL}/resize_pdf_pages`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'resized.pdf';

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
            state: { processType: 'resize_pdf_pages', status: response.status, filename },
          });
        }, 1000);
      } else {
        alert('Failed to resize PDF pages');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
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
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      <SEOHead
        title="Change PDF Page Size - A4, Letter, Legal | PDF Workshop"
        description="Resize PDF pages to A4, Letter, Legal, A3, or A5. Change PDF page dimensions easily. Free online tool."
        url="https://www.pdfworkshop.sbs/resizepdf"
        keywords="resize pdf, change pdf page size, pdf a4, pdf letter size, pdf dimensions"
      />
      <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-200 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Change PDF Page Size</h2>
          <p className="text-gray-600">Resize PDF pages to A4, Letter, Legal, A3, or A5.</p>
        </div>
        <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-md">
          <PDFPreview files={[file]} />
        </div>
      </div>

      <div className="w-full md:w-1/2 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-500 pb-2 flex items-center">
            <AiOutlineExpandAlt className="mr-2 text-blue-500" />
            Change PDF Page Size
          </h2>

          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Select Page Size</h3>
            <div className="space-y-3">
              {pageSizes.map((size) => (
                <label
                  key={size.value}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    format === size.value
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="pageSize"
                    value={size.value}
                    checked={format === size.value}
                    onChange={(e) => setFormat(e.target.value)}
                    className="mr-3 w-4 h-4 text-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-gray-800">{size.label}</span>
                    <span className="text-sm text-gray-500 ml-2">({size.desc})</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`w-full ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 transform hover:scale-105'
            } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Resizing...
              </span>
            ) : (
              'Resize Pages'
            )}
          </button>

          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Tips</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>- Content is scaled to fit the new page size</li>
              <li>- Aspect ratio is maintained</li>
              <li>- All pages are resized uniformly</li>
              <li>- A4 is the most common international size</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResizePdfPages;
