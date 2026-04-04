import { API_BASE_URL } from '../config';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCloudUpload } from 'react-icons/io5';
import { FiInfo } from 'react-icons/fi';
import { AiOutlinePicture } from 'react-icons/ai';
import SEOHead from '../components/SEOHead';

const PngToPdf: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const pngFiles: File[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const f = selectedFiles[i];
        if (f.name.toLowerCase().endsWith('.png') || f.type === 'image/png') {
          pngFiles.push(f);
        }
      }
      if (pngFiles.length > 0) {
        setFiles(pngFiles);
        setError(null);
      } else {
        setError('Please select PNG image files');
        setFiles([]);
      }
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    setError(null);
    if (files.length === 0) {
      setError('Please select at least one PNG file');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    files.forEach((f) => {
      formData.append('files', f);
    });

    let filename = 'converted.pdf';

    try {
      const response = await fetch(`${API_BASE_URL}/png_to_pdf`, {
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
            state: { processType: 'png_to_pdf', status: response.status, filename },
          });
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        setError(errorData.detail || 'Failed to convert PNG to PDF');
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
      <SEOHead
        title="PNG to PDF - Convert PNG Images to PDF | PDF Workshop"
        description="Convert PNG images to PDF format. Combine multiple PNG files into a single PDF. Free online converter."
        url="https://www.pdfworkshop.sbs/pngtopdf"
        keywords="png to pdf, convert png to pdf, image to pdf, png pdf converter, photo to pdf"
      />
      <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <AiOutlinePicture className="mr-3 text-green-500" />
            PNG to PDF Converter
          </h2>
          <p className="text-gray-600">Convert PNG images to PDF format</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200">
          <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
            <AiOutlinePicture className="mr-2 text-green-500" />
            Upload PNG Images
          </h3>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,.png"
            multiple
            className="hidden"
          />
          <div
            onClick={handleFileClick}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-green-50 transition-all"
          >
            {files.length > 0 ? (
              <div>
                <AiOutlinePicture className="text-5xl text-green-500 mx-auto mb-3" />
                <p className="text-lg font-semibold text-gray-800">
                  {files.length} image{files.length > 1 ? 's' : ''} selected
                </p>
                <div className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <p key={i} className="text-sm text-gray-600">
                      {f.name} ({(f.size / 1024).toFixed(2)} KB)
                    </p>
                  ))}
                </div>
                <p className="text-xs text-green-600 mt-3">Click to change files</p>
              </div>
            ) : (
              <div>
                <IoCloudUpload className="text-5xl text-gray-400 mx-auto mb-3" />
                <p className="text-lg font-semibold text-gray-700">Click to upload PNG images</p>
                <p className="text-sm text-gray-500 mt-1">You can select multiple PNG files</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p className="text-blue-700 font-semibold">Warning: {error}</p>
          </div>
        )}

        <div className="mt-6 bg-green-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
            <FiInfo className="mr-2" />
            How it works
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>- Each PNG image becomes one PDF page</li>
            <li>- Images are scaled to fit the page</li>
            <li>- Original quality is preserved</li>
            <li>- Multiple images are combined into one PDF</li>
          </ul>
        </div>
      </div>

      <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-500 pb-2">
          Conversion
        </h2>

        {files.length > 0 && (
          <div className="mb-6 bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Images:</span>
                <span className="font-medium text-gray-800">{files.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total size:</span>
                <span className="font-medium text-gray-800">
                  {(files.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(2)} KB
                </span>
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
          disabled={isProcessing || files.length === 0}
          className={`w-full ${
            isProcessing || files.length === 0
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
            <span className="flex items-center justify-center">
              <AiOutlinePicture className="mr-2 text-xl" />
              Convert to PDF
            </span>
          )}
        </button>

        <div className="mt-6 bg-green-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Tips</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>- Select multiple images at once</li>
            <li>- Images are added in selection order</li>
            <li>- Transparent backgrounds are preserved</li>
            <li>- High-resolution images work best</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PngToPdf;
