import React, { useState } from 'react';
import { Plus, Trash2, Circle, CheckCircle2 } from 'lucide-react';
import { TodoItem } from '../types';
import { Button } from './Button';

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
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
      <div className="flex items-center gap-2 mb-4 text-lavender-700">
        {icon}
        <h3 className="font-bold text-lg">{title}</h3>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="group flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <button 
              onClick={() => onToggle(item.id)}
              className="text-lavender-400 hover:text-lavender-600 transition-colors focus:outline-none"
            >
              {item.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </button>
            <span className={`flex-1 text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {item.text}
            </span>
            <button 
              onClick={() => onDelete(item.id)}
              className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all px-2"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="新增項目..."
          className="flex-1 px-3 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-lavender-200 outline-none"
        />
        <Button size="sm" onClick={handleAdd} className="rounded-xl aspect-square p-0 w-9 h-9 flex items-center justify-center">
          <Plus size={18} />
        </Button>
      </div>
    </div>
  );
};