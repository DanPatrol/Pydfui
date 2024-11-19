import React, { useState,useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useLocation, useNavigate } from 'react-router-dom';
import PDFPreview from '../components/Adjuster';
import { IoAddCircle } from 'react-icons/io5';
import { IoClose } from 'react-icons/io5';

interface ResponsiveGridProps {
  onReorder?: (newOrder: React.ReactNode[]) => void;
}

interface DraggableItemProps {
  id: number;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  onRemove: (index: number) => void;
  children: React.ReactNode;
}

const ItemType = 'GRID_ITEM';

const DraggableItem: React.FC<DraggableItemProps> = ({
 
  index,
  moveItem,
  onRemove,
  children,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`relative flex items-center justify-center w-full aspect-square border bg-white border-gray-300 rounded-lg shadow-sm p-2 ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* "X" Button to Remove Item */}
      <button
        onClick={() => onRemove(index)}
        className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1  hover:bg-red-700 z-10"
        aria-label="Remove PDF"
      >
        <IoClose size={16} />
      </button>
      {children}
    </div>
  );
};

const Compress: React.FC<ResponsiveGridProps> = () => {
  const location = useLocation();
  const { files, processType } = location.state || {};
  const uploadedFiles: File[] = files ? Array.from(files) : [];
  
  // Initialize state with 'File[]' type
  const [items, setItems] = useState<File[]>(uploadedFiles);
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [compressionLevel, setCompressionLevel] = useState('standard');
  const [isProcessing, setIsProcessing] = useState(false); // Loading state for submit button

  const moveItem = (fromIndex: number, toIndex: number) => {
    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setItems(updatedItems);
  };

 

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files;
    if (newFiles) {
      const pdfFiles = Array.from(newFiles).filter(
        (file) => file.type === 'application/pdf'
      );
      setItems((prevItems) => [...prevItems, ...pdfFiles]);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    setIsProcessing(true); // Start processing
    const formData = new FormData();

    // Append files in the current order
    items.forEach((file) => {
      formData.append('files', file);
    });

    // Append the selected compression level
    formData.append('compression', compressionLevel);

    let filename = 'downloaded_file'; // Default fallback filename

    try {
      const response = await fetch('https://pydf-api.vercel.app/compress', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');

        if (contentDisposition) {
          filename = contentDisposition.split('filename=')[1] || filename;
        }

        const contentType = response.headers.get('Content-Type');
        if (contentType === 'application/zip') {
          filename += '.zip';
        } else if (contentType === 'application/pdf') {
          filename += '.pdf';
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);

        setTimeout(() => {
          navigate('/end/', {
            state: {
              processType: 'compress',
              status: response.status,
              filename,
            },
          });
        }, 2000); // 2-second delay
      } else {
        console.error('Failed to compress PDFs:', response.statusText);
        setTimeout(() => {
          navigate('/end/', {
            state: {
              processType: 'compress',
              status: response.status,
              filename,
            },
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error while sending files:', error);
      setTimeout(() => {
        navigate('/end/', {
          state: {
            processType: 'compress',
            status: 'error',
            filename,
          },
        });
      }, 2000);
    } finally {
      setIsProcessing(false); // Stop processing
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex w-full h-screen">
        <div className="w-3/4 border-r border-gray-300">
          <div className="relative w-full grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 p-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              multiple
              className="hidden"
            />
            <IoAddCircle
              className="absolute top-2 right-2 text-4xl text-blue-600 cursor-pointer z-10 hover:text-blue-800"
              onClick={handleAddClick}
            />
            {items.map((file: File, index) => (
              <DraggableItem
                key={index}
                id={index}
                index={index}
                moveItem={moveItem}
                onRemove={handleRemoveItem}
              >
                <PDFPreview files={[file]} />
              </DraggableItem>
            ))}
          </div>
        </div>

        <div className="w-1/4 flex flex-col justify-between p-4 bg-gray-100">
          <div>
            <h2 className="text-xl font-bold mb-4">{processType}</h2>
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Compression Level</h3>
              <div className="flex flex-col mt-2">
                <label className="flex items-center mb-2">
                  <input
                    type="radio"
                    value="high"
                    checked={compressionLevel === 'high'}
                    onChange={(e) => setCompressionLevel(e.target.value)}
                    className="mr-2"
                  />
                  High (Smaller size, lower quality)
                </label>
                <label className="flex items-center mb-2">
                  <input
                    type="radio"
                    value="standard"
                    checked={compressionLevel === 'standard'}
                    onChange={(e) => setCompressionLevel(e.target.value)}
                    className="mr-2"
                  />
                  Standard (Balanced size and quality)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="low"
                    checked={compressionLevel === 'low'}
                    onChange={(e) => setCompressionLevel(e.target.value)}
                    className="mr-2"
                  />
                  Low (Larger size, higher quality)
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-auto"
            disabled={isProcessing} // Disable button when processing
          >
            {isProcessing ? 'Processing...' : 'Submit'} {/* Show loading state */}
          </button>
        </div>
      </div>
    </DndProvider>
  );
};

export default Compress;
