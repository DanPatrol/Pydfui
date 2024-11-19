import React, { useState, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { useLocation, useNavigate } from 'react-router-dom';
import PDFPreview from '../components/Adjuster';

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
      className={`relative flex flex-col items-center justify-center w-full aspect-square border bg-white bg-whiteborder-gray-300 rounded-lg shadow-sm p-2 cursor-pointer ${
        isSelected ? 'border-blue-500' : 'border-gray-300'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      {children}
    </div>
  );
};

const Rotate = () => {
  const location = useLocation();
  const { files, processType } = location.state || {};
  const uploadedFiles: File[] = files ? Array.from(files) : [];
  
  // Initialize state with 'File[]' type
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

 

  const handleSubmit = async () => {
    setLoading(true);
    const formData = new FormData();

    items.forEach((file, index) => {
      formData.append('files', file);
      formData.append(`rotation_${index}`, (rotationDegrees[index] || 0).toString()); // Convert number to string
    });
    

    formData.append('pages', pageInput);

    let filename = 'rotated_document.pdf';

    try {
      const response = await fetch('https://pydf-api.vercel.app/rotatepdf', {
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
        <div className="w-3/4 border-r border-gray-300 p-4 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
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
            </DraggableItem>
          ))}
        </div>

        <div className="w-1/4 flex flex-col p-4 gap-4 bg-gray-100">
          <h2 className="text-xl font-bold mb-4">{processType}</h2>
          <input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            placeholder="Enter pages (e.g., 1,4,7)"
            className="border rounded p-2 hidden"
          />

          <div className="flex gap-4">
            <button
              onClick={() => handleRotateSelectedItem(90)}
              className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600"
            >
              +90°
            </button>
            <button
              onClick={() => handleRotateSelectedItem(-90)}
              className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600"
            >
              -90°
            </button>
          </div>

          <button
            onClick={handleSubmit}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-auto ${
              loading ? 'bg-gray-400 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border animate-spin border-4 border-t-4 border-white rounded-full w-5 h-5"></span>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </div>
    </DndProvider>
  );
};

export default Rotate;
