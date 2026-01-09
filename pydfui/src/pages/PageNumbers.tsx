import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineNumber } from 'react-icons/ai';
import { FiHash } from 'react-icons/fi';
import PDFPreview from '../components/Adjuster';

const PageNumbers: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { files } = location.state || {};
  const file: File | null = files && files.length > 0 ? files[0] : null;

  const [position, setPosition] = useState('bottom-center');
  const [formatString, setFormatString] = useState('{page}');
  const [startPage, setStartPage] = useState(1);
  const [skipFirst, setSkipFirst] = useState(false);
  const [fontSize, setFontSize] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);

  const positions = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-right', label: 'Bottom Right' },
  ];

  const formats = [
    { value: '{page}', label: '1, 2, 3...', example: '1' },
    { value: 'Page {page}', label: 'Page 1, Page 2...', example: 'Page 1' },
    { value: '{page} of {total}', label: '1 of 10, 2 of 10...', example: '1 of 10' },
    { value: 'Page {page}/{total}', label: 'Page 1/10...', example: 'Page 1/10' },
  ];

  const handleSubmit = async () => {
    if (!file) {
      alert('No file selected');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('position', position);
    formData.append('format_string', formatString);
    formData.append('start_page', startPage.toString());
    formData.append('skip_first', skipFirst.toString());
    formData.append('font_size', fontSize.toString());

    try {
      const response = await fetch('http://localhost:8001/add_page_numbers', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'numbered.pdf';
        a.click();
        window.URL.revokeObjectURL(url);

        setTimeout(() => {
          navigate('/end/', {
            state: {
              processType: 'pagenumbers',
              status: response.status,
              filename: 'numbered.pdf',
            },
          });
        }, 1000);
      } else {
        console.error('Failed to add page numbers:', response.statusText);
        navigate('/end/', { state: { processType: 'pagenumbers', status: response.status } });
      }
    } catch (error) {
      console.error('Error adding page numbers:', error);
      navigate('/end/', { state: { processType: 'pagenumbers', status: 'error' } });
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
      {/* Left side - PDF Preview */}
      <div className="w-1/2 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Add Page Numbers</h2>
          <p className="text-gray-600">Add customizable page numbers to your PDF.</p>
        </div>
        <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-md">
          <PDFPreview files={[file]} />
        </div>
      </div>

      {/* Right side - Settings */}
      <div className="w-1/2 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-500 pb-2 flex items-center">
          <FiHash className="mr-2 text-blue-500" />
          Page Number Settings
        </h2>

        {/* Position */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <label className="block text-sm font-semibold mb-3 text-gray-700">Position</label>
          <div className="grid grid-cols-3 gap-2">
            {positions.map((pos) => (
              <button
                key={pos.value}
                onClick={() => setPosition(pos.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  position === pos.value
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Format */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <label className="block text-sm font-semibold mb-3 text-gray-700">Number Format</label>
          <div className="space-y-2">
            {formats.map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => setFormatString(fmt.value)}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all text-left ${
                  formatString === fmt.value
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{fmt.label}</span>
                  <span className="text-xs opacity-75">Example: {fmt.example}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3">
            <label className="block text-xs font-semibold mb-2 text-gray-600">Custom Format</label>
            <input
              type="text"
              value={formatString}
              onChange={(e) => setFormatString(e.target.value)}
              placeholder="e.g., Page {page} of {total}"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Use {'{page}'} and {'{total}'} as placeholders</p>
          </div>
        </div>

        {/* Additional Options */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Additional Options</h3>
          
          <div className="space-y-4">
            {/* Start Page */}
            <div>
              <label className="block text-xs font-semibold mb-2 text-gray-600">
                Start Numbering From
              </label>
              <input
                type="number"
                min="1"
                value={startPage}
                onChange={(e) => setStartPage(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-xs font-semibold mb-2 text-gray-600">
                Font Size: {fontSize}pt
              </label>
              <input
                type="range"
                min="6"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Small (6pt)</span>
                <span>Large (24pt)</span>
              </div>
            </div>

            {/* Skip First Page */}
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={skipFirst}
                onChange={(e) => setSkipFirst(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                Skip first page (cover page)
              </span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className={`w-full ${
            isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105'
          } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Adding Numbers...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <AiOutlineNumber className="mr-2 text-xl" />
              Add Page Numbers
            </span>
          )}
        </button>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Tips</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Choose position for page numbers</li>
            <li>• Customize format with {'{page}'} and {'{total}'}</li>
            <li>• Skip first page for cover pages</li>
            <li>• Adjust font size for readability</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PageNumbers;
