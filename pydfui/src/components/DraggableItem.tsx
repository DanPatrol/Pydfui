import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

interface DraggableItemProps {
  id: number;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  onRemove?: (index: number) => void;
  onSelect?: (index: number) => void;
  isSelected?: boolean;
  rotation?: number;
  showPosition?: boolean;
  totalItems?: number;
  children: React.ReactNode;
}

const ItemType = 'DRAGGABLE_ITEM';

const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  index,
  moveItem,
  onRemove,
  onSelect,
  isSelected = false,
  rotation,
  showPosition = false,
  totalItems,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ItemType,
    hover: (item: { id: number; index: number }) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      onClick={() => onSelect?.(index)}
      className={`relative bg-white rounded-lg shadow-md overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        ${isOver ? 'border-2 border-green-400 ring-2 ring-green-200' : 'border-2 border-transparent'}
        ${isSelected ? 'border-2 border-blue-500 ring-2 ring-blue-200' : ''}
        hover:shadow-lg hover:scale-[1.02]`}
    >
      {/* Position badge */}
      {showPosition && (
        <div className="absolute top-1 right-1 z-10 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
          {index + 1}
        </div>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(index); }}
          className="absolute top-1 left-1 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow transition"
          title="Remove"
        >
          ×
        </button>
      )}

      {/* Rotation badge */}
      {rotation !== undefined && rotation !== 0 && (
        <div className="absolute bottom-1 left-1 z-10 bg-blue-500 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow">
          {rotation}°
        </div>
      )}

      {/* Content */}
      <div className="aspect-[3/4] flex items-center justify-center p-1 overflow-hidden">
        {children}
      </div>

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center rounded-lg">
          <span className="text-blue-700 font-bold text-xs bg-white/80 px-2 py-1 rounded">DRAGGING</span>
        </div>
      )}
      {isOver && !isDragging && (
        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center rounded-lg">
          <span className="text-green-700 font-bold text-xs bg-white/80 px-2 py-1 rounded">DROP HERE</span>
        </div>
      )}
    </div>
  );
};

export default DraggableItem;
