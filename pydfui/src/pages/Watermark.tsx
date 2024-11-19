import React, { useState, useRef } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { Document } from 'react-pdf';
import Splitpreview from '../components/Splitpreview';
import { IoAddCircle } from 'react-icons/io5';

const Grid = ({
  onSelect,
  selectedGrid,
}: {
  onSelect: (index: number) => void;
  selectedGrid: number | null;
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[...Array(9)].map((_, index) => (
        <div
          key={index}
          onClick={() => onSelect(index)}
          className={`w-10 h-10 bg-gray-300 border rounded flex justify-center items-center cursor-pointer hover:bg-gray-400 ${
            selectedGrid === index ? 'bg-blue-500 text-white' : ''
          }`}
        >
          {index + 1}
        </div>
      ))}
    </div>
  );
};

const Watermark = () => {
  const location = useLocation();
  const { files } = location.state || {};
  const uploadedFiles: File[] = files ? Array.from(files) : [];
  
  // Initialize state with 'File[]' type
  const [items, setItems] = useState<File[]>(uploadedFiles);
  const [numPages, setNumPages] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [pageInput, setPageInput] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [selectedGrid, setSelectedGrid] = useState<number | null>(null);

  // Variables for storing image, opacity, and rotation
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [opacity, setOpacity] = useState('');
  const [rotation, setRotation] = useState('');
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

  const handleSubmit = async () => {
    // Ensure there are files selected
    if (items.length === 0) {
      alert('Please upload at least one PDF file.');
      return;
    }
  
    const formData = new FormData();
  
    // Append all selected files to formData
    items.forEach((item) => {
      formData.append('files', item); // FastAPI expects 'files' (plural)
    });
  
    // Handle the selected grid position (if any)
    if (selectedGrid !== null) {
      const positionMap = [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'middle-center', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right',
      ];
      const selectedPosition = positionMap[selectedGrid];
      formData.append('position', selectedPosition);
    }
  
    // Add watermark text or image based on active tab
    if (activeTab === 'text') {
      if (pageInput.trim()) {
        formData.append('watermark_text', pageInput);
      } else {
        alert('Please enter text for the watermark.');
        return;
      }
    } else if (activeTab === 'image') {
      if (uploadedImage) {
        formData.append('watermark_image', uploadedImage);
  
        // Add opacity and rotation for the image watermark
        const opacityValue = opacity.trim() ? parseFloat(opacity) : 1.0;
        const rotationValue = rotation.trim() ? parseFloat(rotation) : 0.0;
  
        formData.append('opacity', opacityValue.toString());
        formData.append('rotation', rotationValue.toString());
      } else {
        alert('Please upload an image for the watermark.');
        return;
      }
    }
  
    try {
      // Send request to the FastAPI server
      const response = await fetch('https://pydf-api.vercel.app/add_watermark', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'watermarked_output.pdf';
  
        // Extract filename from response headers if available
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
  
        // Create a URL for the blob and trigger the download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
  
        // Navigate to the end page after successful response
        await navigate('/end/', {
          state: {
            processType: 'watermark',
            status: response.status,
            filename,
          },
        });
      } else {
        // Handle non-OK response status
        const errorText = await response.text();
        console.error('Failed to add watermark:', errorText);
  
        // Navigate with error status
        await navigate('/end/', {
          state: {
            processType: 'watermark',
            status: response.status,
            filename: 'watermarked_output.pdf',
          },
        });
      }
    } catch (error) {
      // Catch and log any errors during the fetch
      console.error('Error while sending files:', error);
  
      // Navigate on error with status
      await navigate('/end/', {
        state: {
          processType: 'watermark',
          status: 'error',
          filename: 'watermarked_output.pdf',
        },
      });
    }
  };
  
  
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Adjusted grid overlay to highlight selected grid areas
  const renderGridOverlay = () => (
    <div className="absolute top-0 left-0 w-full h-full grid grid-cols-3 gap-0.5 opacity-30 bg-black">
      {[...Array(9)].map((_, index) => (
        <div
          key={index}
          className={`border-2 border-white w-full h-full flex justify-center items-center text-white text-xs ${
            selectedGrid === index ? 'bg-blue-500' : ''
          }`}
        >
          {index + 1}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden">
      {/* Left side: File input and Splitpreview components */}
      <div className="md:w-3/4 w-full border-b md:border-b-0 md:border-r border-gray-300 p-4 relative">
        <div className="flex flex-col gap-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            multiple
            className="hidden"
          />
          <IoAddCircle
            className="text-3xl text-blue-600 cursor-pointer hover:text-blue-800"
            onClick={handleAddClick}
          />

          {items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              {[...Array(numPages)].map((_, index) => (
                <div key={index} className="relative p-4 bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="relative w-full h-full flex justify-center items-center">
                    <Splitpreview file={items[0]} action={index + 1} />
                    {renderGridOverlay()} {/* Overlay on preview */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Two Tabs with Input/Action based on the tab */}
      <div className="md:w-1/4 w-full flex flex-col p-6 bg-gray-100 overflow-auto">
        <div className="flex justify-between mb-6">
          <button
            onClick={() => setActiveTab('text')}
            className={`w-1/2 py-3 ${activeTab === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
          >
            Text
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`w-1/2 py-3 ${activeTab === 'image' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
          >
            Image
          </button>
        </div>

        {activeTab === 'text' ? (
          <input
            type="text"
            placeholder="Enter text here"
            className="border border-gray-300 p-3 rounded-lg w-full mb-6"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
          />
        ) : (
          <div>
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={handleImageButtonClick}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded mb-6"
            >
              Upload Image
            </button>
            <input
              type="text"
              placeholder="Enter Opacity"
              className="border border-gray-300 p-3 rounded-lg w-full mb-6"
              value={opacity}
              onChange={(e) => setOpacity(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter Rotation (leave blank for 0)"
              className="border border-gray-300 p-3 rounded-lg w-full mb-6"
              value={rotation}
              onChange={(e) => setRotation(e.target.value)}
            />
          </div>
        )}
        <p>After submitting please wait a while</p>

        <button
          onClick={handleSubmit}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded mb-6"
        >
          Submit
        </button>

        {items.length > 0 && <Document file={items[0]} onLoadSuccess={onDocumentLoadSuccess} />}

        <div className="mt-6">
          <h3 className="text-lg font-bold">Grid Gadget</h3>
          <Grid selectedGrid={selectedGrid} onSelect={setSelectedGrid} />
        </div>
      </div>
    </div>
  );
};

export default Watermark;
