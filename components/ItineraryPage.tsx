
import React, { useState } from 'react';
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent, 
  DragOverEvent, 
  DragStartEvent, 
  defaultDropAnimationSideEffects, 
  DragOverlay, 
  useDroppable 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Plus, Sun, Sunset, Moon, Utensils } from 'lucide-react';
import { ItineraryItem, Period, ItemType } from '../types';
import { ItineraryCard } from './ItineraryCard';
import { Button } from './Button';
import { Modal } from './Modal';
import { clsx } from 'clsx';

// --- SortableSection Component ---
// This component makes the list container itself a droppable zone, 
// allowing items to be dropped even when the list is empty.

interface SortableSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: ItineraryItem[];
  isDining?: boolean;
  onDeleteItem: (id: string) => void;
  onEditItem: (item: ItineraryItem) => void;
}

const SortableSection: React.FC<SortableSectionProps> = ({ 
  id, title, icon, items, isDining = false, onDeleteItem, onEditItem 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className="mb-6 last:mb-24">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1 sticky top-0 bg-[#FDFDFF]/95 backdrop-blur-sm z-10 py-2">
        {icon}
        <h3 className="font-bold text-gray-700 text-lg">{title}</h3>
        <span className={clsx(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            isDining ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"
          )}>
          {items.length}
        </span>
      </div>

      <SortableContext 
        id={id}
        items={items.map(i => i.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div 
          ref={setNodeRef}
          className={clsx(
            "space-y-3 min-h-[100px] rounded-xl transition-colors border-2 p-2",
            isOver ? "bg-lavender-50 border-lavender-200" : "border-transparent",
            items.length === 0 && !isOver ? "border-dashed border-gray-200 bg-gray-50/50" : ""
          )}
        >
          {items.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium py-4 pointer-events-none">
              {isDining ? '尚無餐廳' : '拖曳至此新增行程'}
            </div>
          )}
          
          {items.map(item => (
            <ItineraryCard 
              key={item.id} 
              item={item} 
              onDelete={onDeleteItem} 
              onEdit={onEditItem}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};


// --- Main ItineraryPage Component ---

interface ItineraryPageProps {
  dateStr: string;
  items: ItineraryItem[];
  onUpdateItems: (items: ItineraryItem[]) => void;
}

export const ItineraryPage: React.FC<ItineraryPageProps> = ({ dateStr, items, onUpdateItems }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<ItineraryItem | null>(null);
  
  // -- Form State --
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formType, setFormType] = useState<ItemType>('activity');
  const [formTitle, setFormTitle] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formPeriod, setFormPeriod] = useState<Period>('morning');
  const [formTransport, setFormTransport] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsReserved, setFormIsReserved] = useState(false);
  const [formReservationTime, setFormReservationTime] = useState('');

  // -- DND Sensors --
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // -- Helper functions to split items --
  const morningItems = items.filter(i => i.type === 'activity' && i.period === 'morning');
  const afternoonItems = items.filter(i => i.type === 'activity' && i.period === 'afternoon');
  const eveningItems = items.filter(i => i.type === 'activity' && i.period === 'evening');
  const diningItems = items.filter(i => i.type === 'dining');

  // -- DND Handlers --

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const item = items.find(i => i.id === event.active.id);
    if (item) setActiveItem(item);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which container the item belongs to
    // Container IDs are: 'morning', 'afternoon', 'evening', 'dining'
    const findContainer = (id: string): string | undefined => {
      if (['morning', 'afternoon', 'evening', 'dining'].includes(id)) return id;
      return items.find(i => i.id === id)?.period || 
             (items.find(i => i.id === id)?.type === 'dining' ? 'dining' : undefined);
    };

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Logic for moving between containers (periods)
    // We only allow moving Activities between periods. 
    // Moving Activity <-> Dining usually involves type change logic which is complex for drag, 
    // so we restrict to Activity <-> Activity periods or Dining <-> Dining (if multiple dining sections existed).
    
    // Allow Activity to move between morning/afternoon/evening
    const isActivityMove = ['morning', 'afternoon', 'evening'].includes(activeContainer) && 
                           ['morning', 'afternoon', 'evening'].includes(overContainer);

    if (isActivityMove) {
      const updatedItems = items.map(item => {
        if (item.id === activeId) {
          return { ...item, period: overContainer as Period };
        }
        return item;
      });
      onUpdateItems(updatedItems);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dropped on the same item, do nothing
    if (activeId === overId) return;

    // Handle reordering within the items array
    const oldIndex = items.findIndex(i => i.id === activeId);
    const newIndex = items.findIndex(i => i.id === overId);

    // Note: If dropping onto an empty container, overId is the container ID.
    // In handleDragOver, we already switched the item's period to that container.
    // So usually handleDragOver handles the "move to empty list" logic visually.
    // Here we just handle sorting.

    if (oldIndex !== -1 && newIndex !== -1) {
      onUpdateItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  // -- Modal / Form Handlers --

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormType('activity');
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditItem = (item: ItineraryItem) => {
    setEditingId(item.id);
    setFormType(item.type);
    setFormTitle(item.title);
    setFormLink(item.link || '');
    setFormNotes(item.notes || '');
    
    if (item.type === 'activity') {
      setFormTime(item.time || '09:00');
      setFormPeriod(item.period || 'morning');
      setFormTransport(item.transport || '');
    } else {
      setFormIsReserved(item.isReserved || false);
      setFormReservationTime(item.reservationTime || '');
    }
    
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormLink('');
    setFormTime('09:00');
    setFormPeriod('morning');
    setFormTransport('');
    setFormNotes('');
    setFormIsReserved(false);
    setFormReservationTime('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baseItem = {
      id: editingId || `item-${Date.now()}`,
      date: dateStr,
      title: formTitle,
      link: formLink || undefined,
      notes: formNotes || undefined,
    };

    let newItem: ItineraryItem;

    if (formType === 'activity') {
      newItem = {
        ...baseItem,
        type: 'activity',
        period: formPeriod,
        time: formTime,
        transport: formTransport || undefined,
      };
    } else {
      newItem = {
        ...baseItem,
        type: 'dining',
        isReserved: formIsReserved,
        reservationTime: formIsReserved ? formReservationTime : undefined,
      };
    }

    if (editingId) {
      onUpdateItems(items.map(i => i.id === editingId ? newItem : i));
    } else {
      onUpdateItems([...items, newItem]);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('確定要刪除這個項目嗎？')) {
        onUpdateItems(items.filter(i => i.id !== id));
    }
  };

  return (
    <div className="p-4 relative min-h-full pb-32">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableSection 
          id="morning"
          title="上午"
          icon={<Sun size={20} className="text-orange-400" />}
          items={morningItems}
          onDeleteItem={handleDeleteItem}
          onEditItem={handleEditItem}
        />

        <SortableSection 
          id="afternoon"
          title="下午"
          icon={<Sunset size={20} className="text-lavender-500" />}
          items={afternoonItems}
          onDeleteItem={handleDeleteItem}
          onEditItem={handleEditItem}
        />

        <SortableSection 
          id="evening"
          title="晚上"
          icon={<Moon size={20} className="text-indigo-400" />}
          items={eveningItems}
          onDeleteItem={handleDeleteItem}
          onEditItem={handleEditItem}
        />
        
        <div className="my-6 border-t-2 border-dashed border-gray-200" />
        
        <SortableSection 
          id="dining"
          title="餐廳 / 美食"
          icon={<Utensils size={20} className="text-orange-500" />}
          items={diningItems}
          isDining={true}
          onDeleteItem={handleDeleteItem}
          onEditItem={handleEditItem}
        />

        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
           {activeItem ? <ItineraryCard item={activeItem} onDelete={() => {}} onEdit={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Floating Action Button */}
      {/* 使用 z-9999 確保在最上層，調整 shadow 樣式以符合需求 */}
      <button
        onClick={handleOpenAddModal}
        className="fixed right-6 h-14 w-14 rounded-full flex items-center justify-center hover:brightness-95 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        style={{ 
          backgroundColor: '#FAEFFB',
          color: '#B481BB',
          boxShadow: '0px 0px 20px rgba(232, 61, 255, 0.08)',
          zIndex: 9999,
          bottom: 'calc(2rem + env(safe-area-inset-bottom))'
        }}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "編輯項目" : "新增項目"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Type Toggle */}
          {!editingId && (
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
              <button
                type="button"
                className={clsx(
                  "flex-1 py-1.5 text-sm font-bold rounded-lg transition-all h-11",
                  formType === 'activity' ? "bg-white text-lavender-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
                onClick={() => setFormType('activity')}
              >
                行程景點
              </button>
              <button
                 type="button"
                 className={clsx(
                   "flex-1 py-1.5 text-sm font-bold rounded-lg transition-all h-11",
                   formType === 'dining' ? "bg-white text-orange-500 shadow-sm" : "text-gray-500 hover:text-gray-700"
                 )}
                 onClick={() => setFormType('dining')}
               >
                 餐廳美食
               </button>
            </div>
          )}

          {/* Common Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formType === 'activity' ? '行程名稱' : '餐廳名稱'}
            </label>
            <input 
              required
              className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lavender-200 outline-none"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder={formType === 'activity' ? "例如：東京鐵塔" : "例如：敘敘苑燒肉"}
            />
          </div>

          {/* Activity Specific Fields */}
          {formType === 'activity' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">時間</label>
                  <input 
                    type="time"
                    required
                    className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lavender-200 outline-none"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">時段</label>
                  <select 
                    className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lavender-200 outline-none"
                    value={formPeriod}
                    onChange={e => setFormPeriod(e.target.value as Period)}
                  >
                    <option value="morning">上午</option>
                    <option value="afternoon">下午</option>
                    <option value="evening">晚上</option>
                  </select>
                </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">交通方式</label>
                 <input 
                   className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lavender-200 outline-none"
                   value={formTransport}
                   onChange={e => setFormTransport(e.target.value)}
                   placeholder="例如：地鐵、步行"
                 />
              </div>
            </>
          )}

          {/* Dining Specific Fields */}
          {formType === 'dining' && (
            <div className="py-2 space-y-3">
              <label className="block text-sm font-medium text-gray-700">是否預訂</label>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio"
                    name="reservedStatus"
                    checked={!formIsReserved}
                    onChange={() => setFormIsReserved(false)}
                    className="w-5 h-5 text-lavender-500 border-gray-300 focus:ring-lavender-400"
                  />
                  <span className="text-gray-700">否</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio"
                    name="reservedStatus"
                    checked={formIsReserved}
                    onChange={() => setFormIsReserved(true)}
                    className="w-5 h-5 text-lavender-500 border-gray-300 focus:ring-lavender-400"
                  />
                  <span className="text-gray-700">是</span>
                </label>
              </div>

              {/* Conditional Reservation Time Input */}
              {formIsReserved && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200 pt-1">
                   <label className="block text-sm font-medium text-gray-700 mb-1">預訂時間</label>
                   <input 
                    type="time"
                    required={formIsReserved}
                    className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lavender-200 outline-none"
                    value={formReservationTime}
                    onChange={e => setFormReservationTime(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">連結 (Google Maps/訂位)</label>
            <input 
              type="url"
              className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lavender-200 outline-none"
              value={formLink}
              onChange={e => setFormLink(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
            <textarea 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lavender-200 outline-none min-h-[80px]"
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              placeholder="注意事項、訂位代號等..."
            />
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full font-bold h-11">
              {editingId ? '儲存變更' : '確認新增'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
