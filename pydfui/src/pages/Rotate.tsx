import { API_BASE_URL } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useLocation, useNavigate } from 'react-router-dom';
import PDFPreview from '../components/Adjuster';
import { IoAddCircle, IoClose } from 'react-icons/io5';
import { FiRotateCw, FiRotateCcw, FiRefreshCw } from 'react-icons/fi';
import { AiOutlineUndo } from 'react-icons/ai';

const ItemType = 'GRID_ITEM';

interface DraggableItemProps {
  id: number;
  index: number;
  moveItem: (fromIndex: number, toIndex: number) => void;
  onRemove: (index: number) => void;
  rotation: number;
  children: React.ReactNode;
  onSelect: (index: number) => void;
  isSelected: boolean;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  index,
  moveItem,
  onRemove,
  children,
  onSelect,
  isSelected,
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
      onClick={() => onSelect(index)}
      className={`relative flex flex-col items-center justify-center w-full aspect-square border bg-white rounded-lg shadow-md p-2 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
        isSelected ? 'border-4 border-blue-500 ring-4 ring-blue-200' : 'border-2 border-gray-300'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-700 z-10 transition-all"
        aria-label="Remove PDF"
      >
        <IoClose size={16} />
      </button>
      {children}
    </div>
  );
};

const Rotate = () => {
  const location = useLocation();
  const { files, processType } = location.state || {};
  const uploadedFiles: File[] = files ? Array.from(files) : [];
  
  const [items, setItems] = useState<File[]>(uploadedFiles);
  const [rotationDegrees, setRotationDegrees] = useState<number[]>([]);
  const [pageInput, setPageInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length > 0 && selectedIndex === null) {
      setSelectedIndex(0);
    }
  }, [items]);

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
    setRotationDegrees(rotationDegrees.filter((_, i) => i !== index));
  };

  const handleRotateSelectedItem = (direction: number) => {
    if (selectedIndex !== null) {
      setRotationDegrees((prevDegrees) => {
        const newDegrees = [...prevDegrees];
        newDegrees[selectedIndex] = (newDegrees[selectedIndex] || 0) + direction;
        return newDegrees;
      });
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const resetRotation = () => {
    if (selectedIndex !== null) {
      setRotationDegrees((prevDegrees) => {
        const newDegrees = [...prevDegrees];
        newDegrees[selectedIndex] = 0;
        return newDegrees;
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const formData = new FormData();

    items.forEach((file, index) => {
      formData.append('files', file);
      formData.append(`rotation_${index}`, (rotationDegrees[index] || 0).toString());
    });

    formData.append('pages', pageInput);

    let filename = 'rotated_document.pdf';

    try {
      const response = await fetch('${API_BASE_URL}/rotatepdf', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');

        if (contentDisposition) {
          const matches = contentDisposition.match(/filename="?(.+)"?/);
          if (matches && matches[1]) {
            filename = matches[1];
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          a.remove();

          navigate('/end/', {
            state: {
              processType: 'rotate',
              status: response.status,
              filename,
            },
          });
        }, 500);
      } else {
        console.error('Failed to process PDFs:', response.statusText);

        navigate('/end/', {
          state: {
            processType: 'rotate',
            status: response.status,
            filename,
          },
        });
      }
    } catch (error) {
      console.error('Error while sending files:', error);

      navigate('/end/', {
        state: {
          processType: 'rotate',
          status: 'error',
          filename,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex w-full h-screen">
        {/* Left side - PDF Grid */}
        <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Rotate Pages</h2>
            <p className="text-gray-600">
              Select a PDF and use the rotation controls. Click to select, drag to reorder.
            </p>
          </div>

          <button
            onClick={handleAddClick}
            className="mb-6 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
          >
            <IoAddCircle className="text-2xl" />
            Add PDF
          </button>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              multiple
              className="hidden"
            />
            {items.map((file, index) => (
              <DraggableItem
                key={index}
                id={index}
                index={index}
                moveItem={moveItem}
                onRemove={handleRemoveItem}
                rotation={rotationDegrees[index] || 0}
                onSelect={setSelectedIndex}
                isSelected={selectedIndex === index}
              >
                <PDFPreview files={[file]} rotation={rotationDegrees[index] || 0} />
                {/* Rotation indicator */}
                {rotationDegrees[index] !== 0 && (
                  <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {rotationDegrees[index]}°
                  </div>
                )}
              </DraggableItem>
            ))}
          </div>
        </div>

        {/* Right side - Controls */}
        <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-500 pb-2">
            Rotation Controls
          </h2>

          {selectedIndex !== null && items[selectedIndex] && (
            <div className="mb-6 bg-white p-5 rounded-lg shadow-md border-2 border-blue-200">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Selected PDF</h3>
              <p className="text-sm text-gray-600 mb-2">{items[selectedIndex].name}</p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-center text-3xl font-bold text-blue-600">
                  {rotationDegrees[selectedIndex] || 0}°
                </p>
                <p className="text-center text-xs text-gray-600 mt-1">Current Rotation</p>
              </div>
            </div>
          )}

          {/* Rotation buttons */}
          <div className="mb-6 space-y-3">
            <button
              onClick={() => handleRotateSelectedItem(90)}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <FiRotateCw className="text-2xl" />
              Rotate Right (+90°)
            </button>
            <button
              onClick={() => handleRotateSelectedItem(-90)}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <FiRotateCcw className="text-2xl" />
              Rotate Left (-90°)
            </button>
            <button
              onClick={resetRotation}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <AiOutlineUndo className="text-xl" />
              Reset Rotation
            </button>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading || items.length === 0}
            className={`w-full ${
              loading || items.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105'
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
              <span className="flex items-center justify-center">
                <FiRefreshCw className="mr-2 text-xl" />
                Apply Rotation
              </span>
            )}
          </button>

          {/* Help text */}
          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Tips</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Click a PDF to select it</li>
              <li>• Use buttons to rotate 90° at a time</li>
              <li>• Drag PDFs to reorder them</li>
              <li>• Reset removes all rotation</li>
            </ul>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default Rotate;
