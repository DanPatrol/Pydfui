import { API_BASE_URL } from '../config';
import React, { useState, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useLocation, useNavigate } from 'react-router-dom';
import PDFPreview from '../components/Adjuster';
import { IoAddCircle, IoClose } from 'react-icons/io5';
import { FiMinimize2, FiTrendingDown, FiZap, FiSettings } from 'react-icons/fi`;
import { AiOutlineFileZip } from 'react-icons/ai`;

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
  
  // New state for advanced compression options
  const [compressionLevel, setCompressionLevel] = useState(50); // 1-100 slider
  const [targetDPI, setTargetDPI] = useState(150); // DPI configuration
  const [preset, setPreset] = useState<'maximum-quality' | 'balanced' | 'maximum-compression'>('balanced');
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Update compression settings when preset changes
  useEffect(() => {
    if (preset === 'maximum-quality') {
      setCompressionLevel(25);
      setTargetDPI(300);
    } else if (preset === 'balanced') {
      setCompressionLevel(50);
      setTargetDPI(150);
    } else if (preset === 'maximum-compression') {
      setCompressionLevel(85);
      setTargetDPI(72);
    }
  }, [preset]);

  // Estimate file size when settings change
  useEffect(() => {
    if (items.length > 0) {
      estimateFileSize();
    }
  }, [compressionLevel, targetDPI, items]);

  const estimateFileSize = async () => {
    if (items.length === 0) return;
    
    setIsEstimating(true);
    const formData = new FormData();
    formData.append('file', items[0]); // Estimate for first file
    formData.append('compression_level', compressionLevel.toString());
    formData.append('target_dpi', targetDPI.toString());

    try {
      const response = await fetch(`${API_BASE_URL}/estimate_compression`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setOriginalSize(data.original_size);
        setEstimatedSize(data.estimated_size);
      }
    } catch (error) {
      console.error('Error estimating file size:', error);
    } finally {
      setIsEstimating(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

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
        (file) => file.type === 'application/pdf`
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
    setIsProcessing(true);
    const formData = new FormData();

    // Append files in the current order
    items.forEach((file) => {
      formData.append('files', file);
    });

    // Append the compression settings
    formData.append('compression_level', compressionLevel.toString());
    formData.append('target_dpi', targetDPI.toString());

    let filename = 'downloaded_file';

    try {
      const response = await fetch(`${API_BASE_URL}/compress`, {
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
        if (contentType === 'application/zip`) {
          filename += '.zip';
        } else if (contentType === 'application/pdf`) {
          filename += '.pdf';
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);

        setTimeout(() => {
          navigate('/end/`, {
            state: {
              processType: 'compress',
              status: response.status,
              filename,
            },
          });
        }, 2000);
      } else {
        console.error('Failed to compress PDFs:', response.statusText);
        setTimeout(() => {
          navigate('/end/`, {
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
        navigate('/end/`, {
          state: {
            processType: 'compress',
            status: 'error',
            filename,
          },
        });
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex w-full h-screen">
        {/* Left side - PDF Grid */}
        <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Compress PDFs</h2>
            <p className="text-gray-600">
              Reduce file size while maintaining quality. Drag to reorder files.
            </p>
          </div>

          <div className="relative w-full grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              multiple
              className="hidden"
            />
            <button
              onClick={handleAddClick}
              className="absolute -top-14 right-0 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
            >
              <IoAddCircle className="text-2xl" />
              Add Files
            </button>
            
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

        {/* Right side - Controls */}
        <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-500 pb-2">
            Compression Settings
          </h2>
          
          {/* Preset Options */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
              <FiZap className="mr-2 text-yellow-500" />
              Quick Presets
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setPreset('maximum-quality')}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  preset === 'maximum-quality'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>🎯 Maximum Quality</span>
                  {preset === 'maximum-quality' && <span className="text-xs">✓</span>}
                </div>
                <p className="text-xs mt-1 opacity-80">Best quality, larger file</p>
              </button>
              <button
                onClick={() => setPreset('balanced')}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  preset === 'balanced'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>⚖️ Balanced</span>
                  {preset === 'balanced' && <span className="text-xs">✓</span>}
                </div>
                <p className="text-xs mt-1 opacity-80">Good quality & size</p>
              </button>
              <button
                onClick={() => setPreset('maximum-compression')}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  preset === 'maximum-compression'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>🗜️ Maximum Compression</span>
                  {preset === 'maximum-compression' && <span className="text-xs">✓</span>}
                </div>
                <p className="text-xs mt-1 opacity-80">Smallest file size</p>
              </button>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="mb-6 bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
            <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
              <FiSettings className="mr-2 text-gray-600" />
              Advanced Settings
            </h3>
            
            {/* Compression Level Slider */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Compression Level
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={compressionLevel}
                onChange={(e) => {
                  setCompressionLevel(Number(e.target.value));
                  setPreset('balanced');
                }}
                className="w-full h-2 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #3b82f6 50%, #a855f7 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Low (1)</span>
                <span className="font-bold text-blue-600 text-base">{compressionLevel}</span>
                <span>High (100)</span>
              </div>
            </div>

            {/* Target DPI */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Target DPI
              </label>
              <input
                type="number"
                min="72"
                max="300"
                value={targetDPI}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 72 && value <= 300) {
                    setTargetDPI(value);
                    setPreset('balanced');
                  }
                }}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">Range: 72-300 DPI</p>
            </div>
          </div>

          {/* File Size Comparison */}
          {originalSize && estimatedSize && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-lg border-2 border-blue-200 shadow-md">
              <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
                <FiTrendingDown className="mr-2 text-blue-500" />
                Size Comparison
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                  <span className="text-sm text-gray-600">Original:</span>
                  <span className="font-bold text-gray-800">{formatFileSize(originalSize)}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                  <span className="text-sm text-gray-600">Estimated:</span>
                  <span className="font-bold text-green-600">
                    {isEstimating ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Calculating...
                      </span>
                    ) : (
                      formatFileSize(estimatedSize)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-gradient-to-r from-green-500 to-blue-500 text-white p-3 rounded-lg">
                  <span className="text-sm font-semibold">Reduction:</span>
                  <span className="font-bold text-lg">
                    {((1 - estimatedSize / originalSize) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isProcessing || items.length === 0}
            className={`w-full ${
              isProcessing || items.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
            } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Compressing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <FiMinimize2 className="mr-2 text-xl" />
                Compress {items.length} PDF{items.length !== 1 ? 's' : ''}
              </span>
            )}
          </button>

          {/* Help Text */}
          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Tips</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Higher compression = smaller file</li>
              <li>• Lower DPI = more compression</li>
              <li>• Use presets for quick results</li>
              <li>• Drag files to reorder them</li>
            </ul>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default Compress;
