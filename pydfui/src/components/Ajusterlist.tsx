import React, { useState, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useLocation, useNavigate } from 'react-router-dom';
import PDFPreview from './Adjuster';
import { IoAddCircle } from 'react-icons/io5';

interface ResponsiveGridProps {
  onReorder?: (newOrder: React.ReactNode[]) => void;
}

interface DraggableItemProps {
  id: number;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
}

const ItemType = 'GRID_ITEM';

const DraggableItem: React.FC<DraggableItemProps> = ({ index, moveItem, children }) => {
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
      className={`relative flex items-center justify-center w-full aspect-square border border-gray-300 rounded-lg shadow-sm p-2 bg-white ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {children}
    </div>
  );
};

const Ajusterlist: React.FC<ResponsiveGridProps> = () => {
  const location = useLocation();
  const { files, processType } = location.state || {};
  const uploadedFiles: File[] = files ? Array.from(files) : [];
  
  // Initialize state with 'File[]' type
  const [items, setItems] = useState<File[]>(uploadedFiles);
  const [loading, setLoading] = useState<boolean>(false);  // Added loading state
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const moveItem = (fromIndex: number, toIndex: number) => {
    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setItems(updatedItems);
  };

  

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files;
    if (newFiles) {
      const pdfFiles = Array.from(newFiles).filter((file) => file.type === 'application/pdf');
      setItems((prevItems) => [...prevItems, ...pdfFiles]);
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    setLoading(true); // Start loading

    const formData = new FormData();
    items.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('https://pydf-api.vercel.app/merge_pdfs', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'merged_output.pdf';
        a.click();
        window.URL.revokeObjectURL(url);

        setTimeout(() => {
          navigate('/end/', {
            state: {
              processType: 'merge',
              status: response.status,
              filename: 'merged_output.pdf',
            },
          });
        }, 500);
      } else {
        console.error('Failed to merge PDFs:', response.statusText);
        navigate('/end/', {
          state: {
            processType: 'merge',
            status: response.status,
            filename: 'error',
          },
        });
      }
    } catch (error) {
      console.error('Error while sending files:', error);
      navigate('/end/', {
        state: {
          processType: 'merge',
          status: 'failed',
          filename: 'error',
        },
      });
    } finally {
      setLoading(false); // Stop loading when the request completes
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex w-full h-screen bg-transparent">
        <div className="w-3/4 border-r-4 border-gray-300 p-4">
          <div className="relative w-full grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 ">
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
              <DraggableItem key={index} id={index} index={index} moveItem={moveItem}>
                <PDFPreview files={[file]} />
              </DraggableItem>
            ))}
          </div>
        </div>

        <div className="w-1/4 flex flex-col justify-between p-4 bg-gray-100">
          <div>
            <h2 className="text-xl font-bold mb-4">{processType}</h2>
            <p className="text-gray-700">{processType || 'No process type specified'}</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading} // Disable the button while loading
            className={`${
              loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'
            } text-white font-bold py-2 px-4 rounded mt-auto`}
          >
            {loading ? 'Processing...' : 'Submit'}
          </button>

          {loading && (
            <div className="mt-4 text-gray-500">
              <p>Merge in progress, please wait...</p>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default Ajusterlist;
