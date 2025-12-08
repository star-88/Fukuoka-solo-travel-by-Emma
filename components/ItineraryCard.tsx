import React, { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MapPin, Clock, Truck, FileText, GripVertical, Trash2, Utensils, CheckCircle2, Circle } from 'lucide-react';
import { ItineraryItem } from '../types';
import { clsx } from 'clsx';

interface ItineraryCardProps {
  item: ItineraryItem;
  onDelete: (id: string) => void;
  onEdit: (item: ItineraryItem) => void;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ item, onDelete, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { ...item } });

  // DND Kit style (Vertical Sorting)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
    touchAction: 'pan-y', // Allow vertical scroll, we handle horizontal manually
  };

  // -- Swipe Logic State --
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const isSwiping = useRef(false);
  const swipeThreshold = 80; // Distance to trigger open

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX.current;
    const deltaY = currentY - startY.current;

    // Determine if user is scrolling vertically or swiping horizontally
    if (!isSwiping.current) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
        isSwiping.current = true;
      }
    }

    if (isSwiping.current) {
      let newOffset = deltaX;
      
      // If already open (offsetX is negative), we are dragging from open state
      if (offsetX < 0) {
        newOffset = Math.min(0, -swipeThreshold + deltaX);
      } else {
        newOffset = Math.min(0, deltaX);
      }
      
      // Clamp
      if (newOffset < -120) newOffset = -120;
      
      setOffsetX(newOffset);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    
    // Snap logic
    if (offsetX < -40) {
      setOffsetX(-swipeThreshold); // Snap Open
    } else {
      setOffsetX(0); // Snap Close
    }
    isSwiping.current = false;
  };

  const handleClick = () => {
    if (offsetX < -10) {
      setOffsetX(0);
    } else {
      onEdit(item);
    }
  };

  const contentStyle = {
    transform: `translateX(${offsetX}px)`,
    transition: isSwiping.current ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
  };

  const isDining = item.type === 'dining';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative mb-3 touch-pan-y select-none"
    >
      {/* Background Layer (Delete Button) */}
      <div className="absolute inset-0 bg-red-500 rounded-[16px] flex justify-end items-center pr-5 overflow-hidden">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="text-white flex flex-col items-center gap-1 font-bold text-xs"
        >
          <Trash2 size={24} />
          刪除
        </button>
      </div>

      {/* Foreground Layer (Card Content) */}
      <div 
        className="relative overflow-hidden bg-[#F3F2F8] rounded-[16px]"
        style={contentStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {isDining ? (
          // --- Dining Layout ---
          <div className="py-[14px] px-[16px] flex items-center gap-3">
            <div className="bg-orange-50 p-2 rounded-[8px] text-orange-400 shrink-0">
              <Utensils size={20} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-[#515152] truncate text-base">
                  {item.title}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className={clsx(
                  "text-xs px-2 py-0.5 rounded-[8px] flex items-center gap-1 font-medium",
                  item.isReserved ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                )}>
                  {item.isReserved ? <CheckCircle2 size={10} /> : <Circle size={10} />}
                  {item.isReserved ? '已預訂' : '無預訂'}
                </span>
                
                {item.link && (
                    <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-orange-400 hover:text-orange-600 text-xs flex items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                    >
                    <MapPin size={10} /> 地圖
                    </a>
                )}
              </div>
              
              {/* Dining Notes (if any) */}
               {item.notes && (
                <div className="mt-2 text-sm bg-[#FDFDFF] text-[#79769A] rounded-[12px] p-2 flex items-start gap-1.5">
                  <FileText size={14} className="mt-0.5 shrink-0 opacity-70" />
                  <p className="leading-snug line-clamp-2">{item.notes}</p>
                </div>
              )}
            </div>

            {/* Grip */}
            <div 
              {...attributes} 
              {...listeners}
              className="p-2 -mr-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={20} />
            </div>
          </div>
        ) : (
          // --- Activity Layout ---
          <div className="py-[14px] px-[16px] flex justify-between items-start">
            <div className="flex-1 pr-4">
              {/* Header: Time & Transport */}
              <div className="flex items-center gap-2 text-xs font-semibold mb-2">
                {/* Time Tag */}
                <div className="flex items-center gap-1 bg-[#F3CCF9] text-[#C239D4] px-2 py-1 rounded-[8px]">
                  <Clock size={12} />
                  {item.time}
                </div>
                {/* Transport Tag */}
                {item.transport && (
                  <div className="flex items-center gap-1 bg-[#F3CCF9] text-[#C239D4] px-2 py-1 rounded-[8px]">
                    <Truck size={12} />
                    {item.transport}
                  </div>
                )}
              </div>

              {/* Title */}
              <h4 className="font-bold text-[#515152] text-lg mb-2 leading-tight flex items-center gap-2">
                 <span>{item.title}</span>
                 {item.link && (
                   <a 
                     href={item.link} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="text-[#C239D4] opacity-80 hover:opacity-100"
                     onClick={(e) => e.stopPropagation()} 
                   >
                     <MapPin size={16} />
                   </a>
                 )}
              </h4>

              {/* Notes */}
              {item.notes && (
                <div className="text-sm bg-[#FDFDFF] text-[#79769A] rounded-[12px] p-2 flex items-start gap-1.5">
                  <FileText size={14} className="mt-0.5 shrink-0 opacity-70" />
                  <p className="leading-snug line-clamp-2">{item.notes}</p>
                </div>
              )}
            </div>

            {/* Grip */}
            <div className="flex flex-col gap-1 items-end h-full justify-center -mr-2">
              <div 
                {...attributes} 
                {...listeners}
                className="p-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical size={20} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
