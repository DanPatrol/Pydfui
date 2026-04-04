import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineFileImage } from 'react-icons/ai';
import PDFPreview from '../components/Adjuster';
import SEOHead from '../components/SEOHead';

const PdfToJpg: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { files } = location.state || {};
  const file: File | null = files && files.length > 0 ? files[0] : null;

  const [isProcessing, setIsProcessing] = useState(false);
  const [dpi, setDpi] = useState('150');
  const [quality, setQuality] = useState(85);

  const handleSubmit = async () => {
    if (!file) {
      alert('Please upload a PDF file');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', 'jpg');
    formData.append('dpi', dpi);
    formData.append('quality', quality.toString());

    try {
      const response = await fetch(`${API_BASE_URL}/pdf_to_images`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'pages.zip';

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
            state: { processType: 'pdf_to_jpg', status: response.status, filename },
          });
        }, 1000);
      } else {
        alert('Failed to convert PDF to JPG');
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
    <div className="flex w-full h-screen">
      <SEOHead
        title="PDF to JPG - Convert PDF Pages to JPEG Images | PDF Workshop"
        description="Convert PDF pages to high-quality JPG images. Choose DPI and quality settings. Free online PDF to JPG converter."
        url="https://www.pdfworkshop.sbs/pdftojpg"
        keywords="pdf to jpg, pdf to jpeg, convert pdf to jpg, pdf to image, pdf jpg converter"
      />
      <div className="w-1/2 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">PDF to JPG</h2>
          <p className="text-gray-600">Convert PDF pages to JPG images.</p>
        </div>
        <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-md">
          <PDFPreview files={[file]} />
        </div>
      </div>

      <div className="w-1/2 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-yellow-600 pb-2 flex items-center">
            <AiOutlineFileImage className="mr-2 text-yellow-600" />
            PDF to JPG
          </h2>

          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Options</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resolution (DPI)</label>
                <div className="flex gap-3">
                  {['72', '150', '300'].map((d) => (
                    <label
                      key={d}
                      className={`flex-1 text-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        dpi === d
                          ? 'bg-yellow-50 border-blue-500 font-semibold'
                          : 'bg-white border-gray-300 hover:border-yellow-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dpi"
                        value={d}
                        checked={dpi === d}
                        onChange={(e) => setDpi(e.target.value)}
                        className="hidden"
                      />
                      {d} DPI
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  72 = screen, 150 = standard, 300 = high quality
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality: {quality}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Smaller file</span>
                  <span>Best quality</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`w-full ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
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
              'Convert to JPG'
            )}
          </button>

          <div className="mt-6 bg-yellow-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Info</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>- Each page becomes a separate JPG image</li>
              <li>- All images are packaged in a ZIP file</li>
              <li>- Higher DPI = larger files but better quality</li>
              <li>- JPG is best for photos and complex images</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfToJpg;
