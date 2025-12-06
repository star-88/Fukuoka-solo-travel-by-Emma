import React, { useState, useEffect } from 'react';
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
  DragOverlay
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

  const getContainerId = (period: Period | 'dining') => period;

  // -- DND Handlers --

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const item = items.find(i => i.id === event.active.id);
    if (item) setActiveItem(item);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    // We only handle cross-container logic for activities here to show optimistic preview
    // But since we use onUpdateItems which updates parent state, we can do it in DragOver
    // However, frequent parent updates might be heavy. 
    // For this size, we will handle logic in DragEnd to keep it simple and safe, 
    // OR implement the logic to handle container change.
    
    // NOTE: For smooth "moving between lists" feel, dnd-kit recommends handling it in onDragOver.
    
    const activeData = active.data.current as ItineraryItem | undefined;
    const overId = over.id;
    
    // Find containers
    const findContainer = (id: string): string | undefined => {
      if (['morning', 'afternoon', 'evening', 'dining'].includes(id)) return id;
      return items.find(i => i.id === id)?.period || 
             (items.find(i => i.id === id)?.type === 'dining' ? 'dining' : undefined);
    };

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(overId as string);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Logic for cross-container move
    if (activeData?.type === 'activity' && overContainer !== 'dining') {
      // Moving activity between periods
      // We essentially just need to update the item's period in the items array
      const updatedItems = items.map(item => {
        if (item.id === active.id) {
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

    if (activeId === overId) return;

    const oldIndex = items.findIndex(i => i.id === activeId);
    const newIndex = items.findIndex(i => i.id === overId);

    if (oldIndex !== -1 && newIndex !== -1) {
        // Reordering within items array is tricky if we want visual sorting within groups.
        // We rely on arrayMove but we need to ensure the order respects the grouping.
        // Actually, since we filter by period to render, arrayMove on the main list works
        // as long as the period is correct (which handleDragOver ensures).
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

  // -- Render Helpers --

  const renderSection = (title: string, icon: React.ReactNode, id: string, sectionItems: ItineraryItem[], isDining = false) => {
    return (
      <div className="mb-6 last:mb-24">
         {/* Drop Zone Header */}
        <div className="flex items-center gap-2 mb-3 px-1 sticky top-0 bg-[#f8fafc]/95 backdrop-blur-sm z-10 py-2">
          {icon}
          <h3 className="font-bold text-gray-700 text-lg">{title}</h3>
          <span className={clsx(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            isDining ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"
          )}>
            {sectionItems.length}
          </span>
        </div>
        
        <SortableContext 
          id={id}
          items={sectionItems.map(i => i.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 min-h-[60px] rounded-xl transition-colors"
               ref={(node) => {
                 // Simplified drop target ref handling via SortableContext internally, 
                 // but we can add visual cues if needed.
               }}
          >
            {sectionItems.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                    {isDining ? '尚無餐廳' : '尚無行程'}
                </div>
            ) : (
                sectionItems.map(item => (
                    <ItineraryCard 
                      key={item.id} 
                      item={item} 
                      onDelete={handleDeleteItem} 
                      onEdit={handleEditItem}
                    />
                ))
            )}
          </div>
        </SortableContext>
      </div>
    );
  };

  return (
    <div className="p-4 relative min-h-full pb-24">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {renderSection('上午', <Sun size={20} className="text-orange-400" />, 'morning', morningItems)}
        {renderSection('下午', <Sunset size={20} className="text-lavender-500" />, 'afternoon', afternoonItems)}
        {renderSection('晚上', <Moon size={20} className="text-indigo-400" />, 'evening', eveningItems)}
        
        <div className="my-6 border-t-2 border-dashed border-gray-200" />
        
        {renderSection('餐廳 / 美食', <Utensils size={20} className="text-orange-500" />, 'dining', diningItems, true)}

        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
           {activeItem ? <ItineraryCard item={activeItem} onDelete={() => {}} onEdit={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Floating Action Button */}
      <button
        onClick={handleOpenAddModal}
        className="fixed bottom-6 right-6 h-14 w-14 bg-lavender-400 text-white rounded-full shadow-lg shadow-lavender-300 flex items-center justify-center hover:bg-lavender-500 hover:scale-105 active:scale-95 transition-all z-40"
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
                  "flex-1 py-1.5 text-sm font-bold rounded-lg transition-all",
                  formType === 'activity' ? "bg-white text-lavender-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
                onClick={() => setFormType('activity')}
              >
                行程景點
              </button>
              <button
                 type="button"
                 className={clsx(
                   "flex-1 py-1.5 text-sm font-bold rounded-lg transition-all",
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
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lavender-200 outline-none"
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
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lavender-200 outline-none"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">時段</label>
                  <select 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lavender-200 outline-none"
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
                   className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lavender-200 outline-none"
                   value={formTransport}
                   onChange={e => setFormTransport(e.target.value)}
                   placeholder="例如：地鐵、步行"
                 />
              </div>
            </>
          )}

          {/* Dining Specific Fields */}
          {formType === 'dining' && (
            <div className="flex items-center gap-3 py-2">
              <input 
                type="checkbox"
                id="reservedCheck"
                checked={formIsReserved}
                onChange={e => setFormIsReserved(e.target.checked)}
                className="w-5 h-5 text-lavender-500 rounded focus:ring-lavender-400 border-gray-300"
              />
              <label htmlFor="reservedCheck" className="text-sm font-medium text-gray-700">
                已完成預訂
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">連結 (Google Maps/訂位)</label>
            <input 
              type="url"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lavender-200 outline-none"
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
            <Button type="submit" className="w-full font-bold">
              {editingId ? '儲存變更' : '確認新增'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
