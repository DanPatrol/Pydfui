import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineScan } from 'react-icons/ai';
import PDFPreview from '../components/Adjuster';
import SEOHead from '../components/SEOHead';

const OcrPdf: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { files } = location.state || {};
  const file: File | null = files && files.length > 0 ? files[0] : null;

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      alert('Please upload a PDF file');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/ocr_pdf`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'searchable.pdf';

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
            state: { processType: 'ocr_pdf', status: response.status, filename },
          });
        }, 1000);
      } else {
        alert('Failed to OCR PDF');
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
        title="OCR PDF - Make Scanned PDFs Searchable | PDF Workshop"
        description="Convert scanned PDFs to searchable text using OCR. Make text selectable and copyable. Free online OCR tool."
        url="https://www.pdfworkshop.sbs/ocrpdf"
        keywords="ocr pdf, searchable pdf, scanned pdf to text, pdf ocr online, text recognition pdf"
      />
      <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-200 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">OCR PDF - Make Searchable</h2>
          <p className="text-gray-600">Convert scanned PDFs to searchable text using OCR.</p>
        </div>
        <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-md">
          <PDFPreview files={[file]} />
        </div>
      </div>

      <div className="w-full md:w-1/2 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-700 pb-2 flex items-center">
            <AiOutlineScan className="mr-2 text-blue-700" />
            OCR PDF
          </h2>

          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">What is OCR?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Optical Character Recognition (OCR) converts images of text into actual selectable, searchable text.
            </p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="text-blue-700 mr-2">*</span>
                <span>Makes scanned documents searchable</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-700 mr-2">*</span>
                <span>Text becomes selectable and copyable</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-700 mr-2">*</span>
                <span>Original appearance is preserved</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-700 mr-2">*</span>
                <span>Enables text extraction from scans</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`w-full ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105'
            } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing OCR...
              </span>
            ) : (
              'Run OCR'
            )}
          </button>

          <div className="mt-6 bg-yellow-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Note</h4>
            <p className="text-xs text-blue-700">
              OCR processing may take longer for large documents with many pages. The visual appearance of the PDF is not changed.
            </p>
          </div>

          <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Use Cases</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>- Make scanned documents searchable</li>
              <li>- Enable copy/paste from scanned PDFs</li>
              <li>- Prepare documents for text extraction</li>
              <li>- Improve accessibility of scanned content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OcrPdf;
