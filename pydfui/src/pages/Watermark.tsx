import { API_BASE_URL } from '../config';
import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document, pdfjs } from 'react-pdf';
import Splitpreview from '../components/Splitpreview';
import { IoAddCircle } from 'react-icons/io5';
import { FiImage, FiType, FiDroplet, FiRotateCw, FiLayers } from 'react-icons/fi';
import { AiOutlineFileImage } from 'react-icons/ai';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const Grid = ({
  onSelect,
  selectedGrid,
}: {
  onSelect: (index: number) => void;
  selectedGrid: number | null;
}) => {
  const positions = [
    'Top Left', 'Top Center', 'Top Right',
    'Middle Left', 'Center', 'Middle Right',
    'Bottom Left', 'Bottom Center', 'Bottom Right'
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {[...Array(9)].map((_, index) => (
        <div
          key={index}
          onClick={() => onSelect(index)}
          className={`h-16 border-2 rounded-lg flex flex-col justify-center items-center cursor-pointer transition-all transform hover:scale-105 ${
            selectedGrid === index
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg'
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
          }`}
        >
          <span className="text-xs font-semibold">{positions[index]}</span>
        </div>
      ))}
    </div>
  );
};

const Watermark = () => {
  const location = useLocation();
  const { files } = location.state || {};
  const uploadedFiles: File[] = files ? Array.from(files) : [];
  
  const [items, setItems] = useState<File[]>(uploadedFiles);
  const [numPages, setNumPages] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [pageInput, setPageInput] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [selectedGrid, setSelectedGrid] = useState<number | null>(4);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [opacity, setOpacity] = useState('50');
  const [rotation, setRotation] = useState('0');
  const [fontSize, setFontSize] = useState('48');
  const [fontName, setFontName] = useState('helv');
  const [bold, setBold] = useState(false);
  const [pageRange, setPageRange] = useState('');
  const [pageRangeError, setPageRangeError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files;
    if (newFiles) {
      const pdfFiles = Array.from(newFiles).filter((file) => file.type === 'application/pdf');
      setItems((prevItems) => {
        const existingNames = new Set(prevItems.map((file) => file.name));
        const uniqueFiles = pdfFiles.filter((file) => !existingNames.has(file.name));
        return [...prevItems, ...uniqueFiles];
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const imageFiles = event.target.files;
    if (imageFiles && imageFiles[0].type.startsWith('image/')) {
      setUploadedImage(imageFiles[0]);
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageButtonClick = () => {
    imageInputRef.current?.click();
  };

  const validatePageRange = (range: string): boolean => {
    if (!range.trim()) return true; // Empty is valid (means all pages)
    
    // Check format: should be comma-separated numbers or ranges (e.g., "1,3,5" or "1-5,8,10-12")
    const pageRangeRegex = /^(\d+(-\d+)?\s*)(,\s*\d+(-\d+)?\s*)*$/;
    if (!pageRangeRegex.test(range.trim())) {
      setPageRangeError('Invalid format. Use comma-separated page numbers or ranges (e.g., 1,3-5,8)');
      return false;
    }
    
    // Parse and validate page numbers and ranges
    const parts = range.split(',').map(p => p.trim());
    const allPages: number[] = [];
    
    for (const part of parts) {
      if (part.includes('-')) {
        // Handle range (e.g., "4-7")
        const [start, end] = part.split('-').map(p => parseInt(p.trim()));
        if (isNaN(start) || isNaN(end)) {
          setPageRangeError('Invalid range format');
          return false;
        }
        if (start > end) {
          setPageRangeError(`Invalid range ${part}: start must be less than or equal to end`);
          return false;
        }
        for (let i = start; i <= end; i++) {
          allPages.push(i);
        }
      } else {
        // Handle single page
        const page = parseInt(part);
        if (isNaN(page)) {
          setPageRangeError('Invalid page number');
          return false;
        }
        allPages.push(page);
      }
    }
    
    if (allPages.length === 0) {
      setPageRangeError('Please enter valid page numbers or ranges');
      return false;
    }
    
    // Check if all pages are within range
    const invalidPages = allPages.filter(p => p < 1 || p > numPages);
    if (invalidPages.length > 0) {
      const uniqueInvalid = [...new Set(invalidPages)].sort((a, b) => a - b);
      setPageRangeError(`Invalid page numbers. PDF has ${numPages} pages. Invalid: ${uniqueInvalid.join(', ')}`);
      return false;
    }
    
    setPageRangeError('');
    return true;
  };

  const handlePageRangeChange = (value: string) => {
    setPageRange(value);
    if (value.trim() && numPages > 0) {
      validatePageRange(value);
    } else {
      setPageRangeError('');
    }
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      alert('Please upload at least one PDF file.');
      return;
    }
    
    // Validate page range if provided
    if (pageRange.trim() && !validatePageRange(pageRange)) {
      return;
    }
  
    setLoading(true);
    const formData = new FormData();
  
    items.forEach((item) => {
      formData.append('files', item);
    });
  
    if (selectedGrid !== null) {
      const positionMap = [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'middle-center', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right',
      ];
      const selectedPosition = positionMap[selectedGrid];
      formData.append('position', selectedPosition);
    }
  
    if (pageRange.trim()) {
      formData.append('pages', pageRange.trim());
    }
  
    if (activeTab === 'text') {
      if (pageInput.trim()) {
        formData.append('watermark_text', pageInput);
        formData.append('font_size', fontSize);
        formData.append('font_name', fontName);
        formData.append('bold', bold.toString());
        formData.append('opacity', (parseFloat(opacity) / 100).toString());
        formData.append('rotation', rotation);
      } else {
        alert('Please enter text for the watermark.');
        setLoading(false);
        return;
      }
    } else if (activeTab === 'image') {
      if (uploadedImage) {
        formData.append('watermark_image', uploadedImage);
        const opacityValue = opacity.trim() ? parseFloat(opacity) / 100 : 0.5;
        const rotationValue = rotation.trim() ? parseFloat(rotation) : 0.0;
        formData.append('opacity', opacityValue.toString());
        formData.append('rotation', rotationValue.toString());
      } else {
        alert('Please upload an image for the watermark.');
        setLoading(false);
        return;
      }
    }
  
    try {
      const response = await fetch(`${API_BASE_URL}/add_watermark`, {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'watermarked_output.pdf';
  
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
  
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
  
        await navigate('/end/', {
          state: {
            processType: 'watermark',
            status: response.status,
            filename,
          },
        });
      } else {
        const errorText = await response.text();
        console.error('Failed to add watermark:', errorText);
  
        await navigate('/end/', {
          state: {
            processType: 'watermark',
            status: response.status,
            filename: 'watermarked_output.pdf',
          },
        });
      }
    } catch (error) {
      console.error('Error while sending files:', error);
  
      await navigate('/end/', {
        state: {
          processType: 'watermark',
          status: 'error',
          filename: 'watermarked_output.pdf',
        },
      });
    } finally {
      setLoading(false);
    }
  };
  
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const renderGridOverlay = () => (
    <div className="absolute top-0 left-0 w-full h-full grid grid-cols-3 gap-0.5 opacity-20 bg-black pointer-events-none">
      {[...Array(9)].map((_, index) => (
        <div
          key={index}
          className={`border border-white w-full h-full flex justify-center items-center text-white text-xs ${
            selectedGrid === index ? 'bg-blue-500 opacity-50' : ''
          }`}
        >
          {index + 1}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex w-full h-screen">
      <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          multiple
          className="hidden"
        />

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Add Watermark</h2>
          <p className="text-gray-600">
            Add text or image watermarks to your PDFs. Preview shows watermark position.
          </p>
        </div>

        <button
          onClick={handleAddClick}
          className="mb-6 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
        >
          <IoAddCircle className="text-2xl" />
          Add PDF
        </button>

        {items.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {[...Array(numPages)].map((_, index) => (
              <div key={index} className="relative bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200">
                <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Page {index + 1}
                </div>
                <div className="relative w-full h-full flex justify-center items-center">
                  <Splitpreview file={items[0]} action={index + 1} />
                  {renderGridOverlay()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-purple-500 pb-2">
          Watermark Settings
        </h2>

        {items.length > 0 && <Document file={items[0]} onLoadSuccess={onDocumentLoadSuccess} />}

        <div className="flex mb-6 bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'text'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiType />
            Text
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-3 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'image'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiImage />
            Image
          </button>
        </div>

        {activeTab === 'text' ? (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
              <label className="block text-sm font-semibold mb-2 text-gray-800">Watermark Text</label>
              <input
                type="text"
                placeholder="Enter watermark text"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
              />
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
              <label className="block text-sm font-semibold mb-2 text-gray-800">Font</label>
              <select
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={fontName}
                onChange={(e) => setFontName(e.target.value)}
              >
                <option value="helv">Helvetica</option>
                <option value="times">Times Roman</option>
                <option value="cour">Courier</option>
              </select>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
              <label className="block text-sm font-semibold mb-2 text-gray-800">Font Size (8-72pt)</label>
              <input
                type="number"
                min="8"
                max="72"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
              />
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={bold}
                  onChange={(e) => setBold(e.target.checked)}
                />
                <span className="ml-3 text-sm font-semibold text-gray-800">Bold Text</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={handleImageButtonClick}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <AiOutlineFileImage className="text-2xl" />
              {uploadedImage ? `${uploadedImage.name}` : 'Upload Image'}
            </button>
            {uploadedImage && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 text-center">
                <p className="text-sm text-green-700 font-semibold">✓ Image uploaded successfully</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div className="bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
            <label className="block text-sm font-semibold mb-3 text-gray-800 flex items-center gap-2">
              <FiDroplet />
              Opacity (0-100%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              className="w-full h-2 bg-gradient-to-r from-transparent to-blue-500 rounded-lg appearance-none cursor-pointer"
              value={opacity}
              onChange={(e) => setOpacity(e.target.value)}
            />
            <div className="text-center mt-2 text-2xl font-bold text-blue-600">{opacity}%</div>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
            <label className="block text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
              <FiRotateCw />
              Rotation
            </label>
            <select
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={rotation}
              onChange={(e) => setRotation(e.target.value)}
            >
              <option value="0">0° (No rotation)</option>
              <option value="90">90° (Clockwise)</option>
              <option value="180">180° (Upside down)</option>
              <option value="270">270° (Counter-clockwise)</option>
            </select>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
            <label className="block text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
              <FiLayers />
              Page Range (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., 1,3-5,8 or leave empty for all"
              className={`w-full border-2 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 ${
                pageRangeError 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
              value={pageRange}
              onChange={(e) => handlePageRangeChange(e.target.value)}
            />
            {pageRangeError ? (
              <p className="text-xs text-red-600 mt-2 font-semibold">⚠ {pageRangeError}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-2">
                {numPages > 0 
                  ? `Enter page numbers or ranges (1-${numPages}), e.g., 1,3-5,8. Leave empty for all pages`
                  : 'Leave empty to apply to all pages'
                }
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Watermark Position</h3>
          <Grid selectedGrid={selectedGrid} onSelect={setSelectedGrid} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || items.length === 0}
          className={`w-full mt-6 ${
            loading || items.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transform hover:scale-105'
          } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            'Apply Watermark'
          )}
        </button>

        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Tips</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Choose text or image watermark</li>
            <li>• Enable bold for stronger text visibility</li>
            <li>• Adjust opacity for transparency (0-100%)</li>
            <li>• Select position on the grid</li>
            <li>• Use ranges for pages: 1,3-5,8 (pages 1, 3, 4, 5, 8)</li>
            <li>• Leave page range empty for all pages</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Watermark;
