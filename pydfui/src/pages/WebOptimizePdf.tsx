import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineGlobal } from 'react-icons/ai';
import PDFPreview from '../components/Adjuster';
import SEOHead from '../components/SEOHead';

const WebOptimizePdf: React.FC = () => {
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
      const response = await fetch(`${API_BASE_URL}/linearize_pdf`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'optimized.pdf';

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
            state: { processType: 'linearize_pdf', status: response.status, filename },
          });
        }, 1000);
      } else {
        alert('Failed to optimize PDF');
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
        title="Web-Optimize PDF - Linearize PDF for Fast Viewing | PDF Workshop"
        description="Optimize PDF for fast web viewing. Linearize PDFs for progressive loading in browsers. Free online tool."
        url="https://www.pdfworkshop.sbs/weboptimize"
        keywords="web optimize pdf, linearize pdf, fast loading pdf, optimize pdf online, pdf for web"
      />
      <div className="w-1/2 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Web-Optimize PDF</h2>
          <p className="text-gray-600">Optimize PDF for fast web viewing (linearize).</p>
        </div>
        <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-md">
          <PDFPreview files={[file]} />
        </div>
      </div>

      <div className="w-1/2 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-600 pb-2 flex items-center">
            <AiOutlineGlobal className="mr-2 text-blue-600" />
            Web-Optimize PDF
          </h2>

          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">What is linearization?</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">*</span>
                <span>Enables "fast web view" in browsers</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">*</span>
                <span>First page loads before entire file downloads</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">*</span>
                <span>Optimizes internal PDF structure</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">*</span>
                <span>No visible quality difference</span>
              </li>
            </ul>
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
                Optimizing...
              </span>
            ) : (
              'Optimize for Web'
            )}
          </button>

          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Best for</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>- PDFs hosted on websites</li>
              <li>- Documents shared via download links</li>
              <li>- Large PDFs that need faster loading</li>
              <li>- Improving user experience on slow connections</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebOptimizePdf;
