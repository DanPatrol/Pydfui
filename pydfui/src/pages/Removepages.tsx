import React, { useState, useRef } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { Document } from 'react-pdf';
import Splitpreview from '../components/Splitpreview';





const Removepages = () => {
  const location = useLocation();
  const { files } = location.state || {};
  const uploadedFiles: File[] = files ? Array.from(files) : [];
  
  // Initialize state with 'File[]' type
  const [items, setItems] = useState<File[]>(uploadedFiles);
  const [numPages, setNumPages] = useState(0);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pageInput, setPageInput] = useState('');
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

 

  const handleSubmit = async () => {
    // Ensure there are items and selected indexes
    if (items.length === 0 || selectedIndexes.length === 0) {
      console.warn('No files or pages selected');
      return;
    }
  
    const formData = new FormData();
    formData.append('file', items[0]); // Use the first PDF file
  
    // Adjust selectedIndexes by incrementing each by 1 (1-based index)
    const adjustedIndexes = selectedIndexes.map((index) => index + 1);
    formData.append('pages_to_remove', adjustedIndexes.join(','));
  
    // Set a default filename in case extraction fails
    let filename = 'modified_output.pdf';
    const apiUrl = 'https://pydf-api.vercel.app/split';
  
    // Adding a loading state
   
  
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        // Create a blob from the response
        const blob = await response.blob();
  
        // Extract filename from response headers if available
        const contentDisposition = response.headers.get('Content-Disposition');
        const match = contentDisposition?.match(/filename="?(.+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
  
        // Create a URL for the blob and trigger the download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
  
        // Navigate after successful download
        navigate('/end/', {
          state: {
            processType: 'remove',
            status: response.status,
            filename,
          },
        });
      } else {
        console.error('Failed to process PDF:', response.statusText);
        navigate('/end/', {
          state: {
            processType: 'remove',
            status: response.status,
            filename,
          },
        });
      }
    } catch (error) {
      console.error('Error while processing PDF:', error);
      navigate('/end/', {
        state: {
          processType: 'remove',
          status: 'error',
          filename,
        },
      });
    } 
  };
  
  

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Handle item selection by mouse
  const handleItemClick = (index: number) => {
    setSelectedIndexes((prevSelected) => {
      const updatedSelected = prevSelected.includes(index)
        ? prevSelected.filter((i) => i !== index)
        : [...prevSelected, index];

      // Update input box with selected page numbers
      const pageNumbers = updatedSelected.map((num) => num + 1).join(', ');
      setPageInput(pageNumbers);
      return updatedSelected;
    });
  };

  // Handle input change for manual page selection
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPageInput(value);

    // Parse the input value to extract page numbers
    const pageNumbers = value
      .split(',')
      .map((num) => parseInt(num.trim(), 10))
      .filter((num) => !isNaN(num) && num > 0 && num <= numPages);

    // Update the selected indexes
    setSelectedIndexes(pageNumbers.map((num) => num - 1));
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden">
      {/* Left side: File input and Splitpreview components */}
      <div className="md:w-3/4 w-full border-b md:border-b-0 md:border-r border-gray-300 p-4 overflow-auto">
        <div className="flex flex-col gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            multiple
            className="hidden"
          />
         

          {/* Responsive Grid for Splitpreview components */}
          {items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(numPages)].map((_, index) => (
                <div
                  key={index}
                  className={`p-2 bg-white rounded shadow cursor-pointer ${
                    selectedIndexes.includes(index) ? 'border-2 border-red-500' : ''
                  }`}
                  onClick={() => handleItemClick(index)}
                >
                  <Splitpreview file={items[0]} action={index + 1} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: PDF Preview and Submit Button */}
      <div className="md:w-1/4 w-full flex flex-col p-6 bg-gray-100 overflow-auto">
        <h2 className="text-xl font-bold mb-4">PDF Preview</h2>
        <input
          type="text"
          placeholder="Enter the page numbers to remove"
          className="border border-gray-300 p-2 rounded w-full"
          value={pageInput}
          onChange={handleInputChange}
        />

        <button
          onClick={handleSubmit}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded mt-6"
        >
          Submit
        </button>

        <Document file={items[0]} onLoadSuccess={onDocumentLoadSuccess}></Document>
      </div>
    </div>
  );
};

export default Removepages;
