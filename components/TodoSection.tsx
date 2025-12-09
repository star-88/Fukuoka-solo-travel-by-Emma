import React, { useState, useRef } from 'react';
import { Plus, Trash2, Circle, CheckCircle2 } from 'lucide-react';
import { TodoItem } from '../types';
import { Button } from './Button';
import { clsx } from 'clsx';

// --- Sub-component for individual Swipeable Row ---
interface TodoItemRowProps {
  item: TodoItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TodoItemRow: React.FC<TodoItemRowProps> = ({ item, onToggle, onDelete }) => {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const isSwiping = useRef(false);
  const swipeThreshold = 70; // Width of delete button

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

    // Detect horizontal swipe vs vertical scroll
    if (!isSwiping.current) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isSwiping.current = true;
      }
    }

    if (isSwiping.current) {
      let newOffset = deltaX;
      // Constraint logic
      if (offsetX < 0) {
        // Already open
        newOffset = Math.min(0, -swipeThreshold + deltaX);
      } else {
        // Closed
        newOffset = Math.min(0, deltaX);
      }
      // Limit max drag
      if (newOffset < -100) newOffset = -100;
      setOffsetX(newOffset);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;

    if (offsetX < -35) {
      setOffsetX(-swipeThreshold); // Snap open
    } else {
      setOffsetX(0); // Snap close
    }
    isSwiping.current = false;
  };

  const handleClick = () => {
    // If currently showing delete button, close it first
    if (offsetX < -10) {
      setOffsetX(0);
    } else {
      onToggle(item.id);
    }
  };

  const contentStyle = {
    transform: `translateX(${offsetX}px)`,
    transition: isSwiping.current ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
  };

  return (
    <div className="relative mb-2 select-none overflow-hidden rounded-xl">
      {/* Background (Delete Layer) */}
      <div className="absolute inset-0 bg-red-500 flex justify-end items-center pr-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="text-white flex items-center justify-center w-12 h-full"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Foreground (Content Layer) */}
      <div
        style={contentStyle}
        className="relative bg-white flex items-center gap-3 p-3 transition-colors hover:bg-gray-50 active:bg-gray-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <div className={clsx(
          "transition-colors text-lavender-400",
          item.completed && "text-lavender-300"
        )}>
          {item.completed ? <CheckCircle2 size={22} fill="#B481BB" className="text-white" /> : <Circle size={22} />}
        </div>
        
        <span className={clsx(
          "flex-1 text-sm font-medium transition-colors",
          item.completed ? "text-gray-400 line-through" : "text-gray-700"
        )}>
          {item.text}
        </span>
      </div>
    </div>
  );
};


// --- Main Component ---

interface TodoSectionProps {
  title: string;
  icon: React.ReactNode;
  items: TodoItem[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TodoSection: React.FC<TodoSectionProps> = ({ 
  title, 
  icon,
  items, 
  onAdd, 
  onToggle, 
  onDelete 
}) => {
  const [newItemText, setNewItemText] = useState('');

  const handleAdd = () => {
    if (newItemText.trim()) {
      onAdd(newItemText.trim());
      setNewItemText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        {icon}
        <h3 className="font-bold text-gray-700 text-lg">{title}</h3>
      </div>

      <div className="space-y-0.5">
        {items.map((item) => (
          <TodoItemRow 
            key={item.id} 
            item={item} 
            onToggle={onToggle} 
            onDelete={onDelete} 
          />
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="新增項目..."
          className="flex-1 px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-lavender-200 outline-none shadow-sm"
        />
        <Button size="sm" onClick={handleAdd} className="rounded-xl aspect-square p-0 w-[46px] h-[46px] flex items-center justify-center shadow-sm">
          <Plus size={20} />
        </Button>
      </div>
    </div>
  );
};