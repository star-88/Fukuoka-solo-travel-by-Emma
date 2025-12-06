import React from 'react';
import { ClipboardList, Briefcase, Luggage } from 'lucide-react';
import { TodosState, TodoCategory } from '../types';
import { TodoSection } from './TodoSection';

interface PreTripPageProps {
  todos: TodosState;
  onUpdate: (newTodos: TodosState) => void;
}

export const PreTripPage: React.FC<PreTripPageProps> = ({ todos, onUpdate }) => {
  
  const updateList = (category: TodoCategory, action: 'add' | 'toggle' | 'delete', payload: any) => {
    const list = [...todos[category]];
    
    if (action === 'add') {
      list.push({ id: `todo-${Date.now()}`, text: payload, completed: false });
    } else if (action === 'toggle') {
      const idx = list.findIndex(i => i.id === payload);
      if (idx !== -1) list[idx].completed = !list[idx].completed;
    } else if (action === 'delete') {
      const idx = list.findIndex(i => i.id === payload);
      if (idx !== -1) list.splice(idx, 1);
    }

    onUpdate({ ...todos, [category]: list });
  };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">行前準備</h2>
        <p className="text-gray-500 text-sm">檢查清單，確保萬無一失！</p>
      </div>

      <TodoSection 
        title="行前任務" 
        icon={<ClipboardList className="text-lavender-400" />}
        items={todos.tasks}
        onAdd={(text) => updateList('tasks', 'add', text)}
        onToggle={(id) => updateList('tasks', 'toggle', id)}
        onDelete={(id) => updateList('tasks', 'delete', id)}
      />

      <TodoSection 
        title="隨身行李" 
        icon={<Briefcase className="text-lavender-400" />}
        items={todos.carryOn}
        onAdd={(text) => updateList('carryOn', 'add', text)}
        onToggle={(id) => updateList('carryOn', 'toggle', id)}
        onDelete={(id) => updateList('carryOn', 'delete', id)}
      />

      <TodoSection 
        title="托運行李" 
        icon={<Luggage className="text-lavender-400" />}
        items={todos.checked}
        onAdd={(text) => updateList('checked', 'add', text)}
        onToggle={(id) => updateList('checked', 'toggle', id)}
        onDelete={(id) => updateList('checked', 'delete', id)}
      />
    </div>
  );
};