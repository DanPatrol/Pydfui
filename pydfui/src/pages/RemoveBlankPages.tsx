import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineFileUnknown } from 'react-icons/ai';
import { FiTrash2, FiEye } from 'react-icons/fi';
import PDFPreview from '../components/Adjuster';

const RemoveBlankPages: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { files } = location.state || {};
  const file: File | null = files && files.length > 0 ? files[0] : null;

  const [threshold, setThreshold] = useState(0.99);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [blankPages, setBlankPages] = useState<number[]>([]);
  const [hasDetected, setHasDetected] = useState(false);

  const thresholdPresets = [
    { value: 0.99, label: 'Very Strict', description: 'Only completely blank pages' },
    { value: 0.95, label: 'Strict', description: 'Mostly blank pages' },
    { value: 0.90, label: 'Moderate', description: 'Pages with minimal content' },
  ];

  const handleDetect = async () => {
    if (!file) return;

    setIsDetecting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('threshold', threshold.toString());

    try {
      const response = await fetch('http://localhost:8001/detect_blank_pages', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setBlankPages(data.blank_pages);
        setHasDetected(true);
      } else {
        console.error('Failed to detect blank pages:', response.statusText);
        alert('Failed to detect blank pages. Please try again.');
      }
    } catch (error) {
      console.error('Error detecting blank pages:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleRemove = async () => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('threshold', threshold.toString());

    try {
      const response = await fetch('http://localhost:8001/remove_blank_pages', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const removedCount = response.headers.get('X-Removed-Count') || '0';
        const removedPages = response.headers.get('X-Removed-Pages') || '';
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cleaned.pdf';
        a.click();
        window.URL.revokeObjectURL(url);

        setTimeout(() => {
          navigate('/end/', {
            state: {
              processType: 'removeblank',
              status: response.status,
              filename: 'cleaned.pdf',
              message: `Removed ${removedCount} blank page(s): ${removedPages}`,
            },
          });
        }, 1000);
      } else {
        console.error('Failed to remove blank pages:', response.statusText);
        navigate('/end/', { state: { processType: 'removeblank', status: response.status } });
      }
    } catch (error) {
      console.error('Error removing blank pages:', error);
      navigate('/end/', { state: { processType: 'removeblank', status: 'error' } });
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Remove Blank Pages</h2>
          <p className="text-gray-600">Automatically detect and remove blank pages from your PDF.</p>
        </div>
        <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-md">
          <PDFPreview files={[file]} />
        </div>
      </div>

      {/* Right side - Settings */}
      <div className="w-1/2 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-gray-500 pb-2 flex items-center">
          <FiTrash2 className="mr-2 text-gray-500" />
          Blank Page Detection
        </h2>

        {/* Threshold Presets */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <label className="block text-sm font-semibold mb-3 text-gray-700">
            Detection Sensitivity
          </label>
          <div className="space-y-2">
            {thresholdPresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  setThreshold(preset.value);
                  setHasDetected(false);
                }}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all text-left ${
                  threshold === preset.value
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{preset.label}</div>
                    <div className="text-xs opacity-75">{preset.description}</div>
                  </div>
                  {threshold === preset.value && <span className="text-lg">✓</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Threshold */}
          <div className="mt-4">
            <label className="block text-xs font-semibold mb-2 text-gray-600">
              Custom Threshold: {threshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.85"
              max="0.99"
              step="0.01"
              value={threshold}
              onChange={(e) => {
                setThreshold(Number(e.target.value));
                setHasDetected(false);
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Less Strict</span>
              <span>More Strict</span>
            </div>
          </div>
        </div>

        {/* Detect Button */}
        <button
          onClick={handleDetect}
          disabled={isDetecting}
          className={`w-full mb-4 ${
            isDetecting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105'
          } text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200`}
        >
          {isDetecting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Detecting...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <FiEye className="mr-2 text-xl" />
              Detect Blank Pages
            </span>
          )}
        </button>

        {/* Detection Results */}
        {hasDetected && (
          <div className={`mb-6 p-5 rounded-lg shadow-md ${
            blankPages.length > 0 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-green-50 border-2 border-green-300'
          }`}>
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              {blankPages.length > 0 ? (
                <>
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <span className="text-yellow-800">Blank Pages Found</span>
                </>
              ) : (
                <>
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-green-800">No Blank Pages</span>
                </>
              )}
            </h3>
            {blankPages.length > 0 ? (
              <>
                <p className="text-sm text-yellow-700 mb-2">
                  Found {blankPages.length} blank page(s):
                </p>
                <div className="flex flex-wrap gap-2">
                  {blankPages.map((pageNum) => (
                    <span
                      key={pageNum}
                      className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-semibold"
                    >
                      Page {pageNum}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-green-700">
                No blank pages detected with current sensitivity setting.
              </p>
            )}
          </div>
        )}

        {/* Remove Button */}
        <button
          onClick={handleRemove}
          disabled={isProcessing}
          className={`w-full ${
            isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transform hover:scale-105'
          } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Removing...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <AiOutlineFileUnknown className="mr-2 text-xl" />
              Remove Blank Pages
            </span>
          )}
        </button>

        {/* Help Text */}
        <div className="mt-6 bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">🔍 How It Works</h4>
          <ul className="text-xs text-gray-700 space-y-1">
            <li>• Analyzes each page for content</li>
            <li>• Detects text, images, and graphics</li>
            <li>• Removes pages based on threshold</li>
            <li>• Preview detection before removing</li>
            <li>• Original file remains unchanged</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RemoveBlankPages;
