
import React, { useState, forwardRef, useImperativeHandle } from 'react';
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
import { Sun, Sunset, Moon, Utensils, ArrowLeft, Clock, MapPin, Link as LinkIcon, StickyNote, Car } from 'lucide-react';
import { ItineraryItem, Period, ItemType } from '../types';
import { ItineraryCard } from './ItineraryCard';
import { Button } from './Button';
import { clsx } from 'clsx';

// --- Helper: Determine Period from Time ---
const getPeriodFromTime = (time: string): Period => {
  if (!time) return 'morning';
  const [hour] = time.split(':').map(Number);
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

// --- SortableSection Component ---
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

export interface ItineraryPageHandle {
  openAddModal: () => void;
}

interface ItineraryPageProps {
  dateStr: string;
  items: ItineraryItem[];
  onUpdateItems: (items: ItineraryItem[]) => void;
}

export const ItineraryPage = forwardRef<ItineraryPageHandle, ItineraryPageProps>(({ dateStr, items, onUpdateItems }, ref) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<ItineraryItem | null>(null);
  
  // -- Form State --
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formType, setFormType] = useState<ItemType>('activity');
  const [formTitle, setFormTitle] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formTransport, setFormTransport] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsReserved, setFormIsReserved] = useState(false);
  const [formReservationTime, setFormReservationTime] = useState('');

  // -- Expose openAddModal to parent --
  useImperativeHandle(ref, () => ({
    openAddModal: handleOpenAddModal
  }));

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

    if (activeId === activeId && overId === overId && activeId !== overId) {
       const oldIndex = items.findIndex(i => i.id === activeId);
       const newIndex = items.findIndex(i => i.id === overId);
       if (oldIndex !== -1 && newIndex !== -1) {
          onUpdateItems(arrayMove(items, oldIndex, newIndex));
       }
    }
  };

  // -- Form Handlers --

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormType('activity');
    resetForm();
    setIsFormOpen(true);
  };

  const handleEditItem = (item: ItineraryItem) => {
    setEditingId(item.id);
    setFormType(item.type);
    setFormTitle(item.title);
    setFormLink(item.link || '');
    setFormNotes(item.notes || '');
    
    if (item.type === 'activity') {
      setFormTime(item.time || '09:00');
      setFormTransport(item.transport || '');
    } else {
      setFormIsReserved(item.isReserved || false);
      setFormReservationTime(item.reservationTime || '');
    }
    
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormLink('');
    setFormTime('09:00');
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
      // Auto-calculate period based on time
      const period = getPeriodFromTime(formTime);
      
      newItem = {
        ...baseItem,
        type: 'activity',
        period: period,
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

    setIsFormOpen(false);
    resetForm();
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('確定要刪除這個項目嗎？')) {
        onUpdateItems(items.filter(i => i.id !== id));
    }
  };

  return (
    <>
      {/* Main List View */}
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
      </div>

      {/* Full Screen Add/Edit Page Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] bg-[#FDFDFF] flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Form Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-white/90 backdrop-blur-md pt-[env(safe-area-inset-top,20px)] mt-0 shrink-0 shadow-sm">
            <button 
              onClick={() => setIsFormOpen(false)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-bold text-gray-800">
              {editingId ? "編輯項目" : "新增行程"}
            </h2>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-4 pb-[env(safe-area-inset-bottom,40px)]">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
              
              {/* Type Toggle */}
              {!editingId && (
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    className={clsx(
                      "flex-1 py-2 text-sm font-bold rounded-lg transition-all h-11",
                      formType === 'activity' ? "bg-white text-lavender-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                    onClick={() => setFormType('activity')}
                  >
                    行程景點
                  </button>
                  <button
                     type="button"
                     className={clsx(
                       "flex-1 py-2 text-sm font-bold rounded-lg transition-all h-11",
                       formType === 'dining' ? "bg-white text-orange-500 shadow-sm" : "text-gray-500 hover:text-gray-700"
                     )}
                     onClick={() => setFormType('dining')}
                   >
                     餐廳美食
                   </button>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin size={16} className="text-lavender-500"/>
                  {formType === 'activity' ? '行程名稱' : '餐廳名稱'}
                </label>
                <input 
                  required
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-lavender-200 outline-none text-base shadow-sm"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder={formType === 'activity' ? "例如：東京鐵塔" : "例如：敘敘苑燒肉"}
                />
              </div>

              {/* Activity Specific Fields */}
              {formType === 'activity' && (
                <div className="space-y-6">
                  {/* Time Input - Full Width, 24h native */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                      <Clock size={16} className="text-lavender-500"/>
                      時間 (24小時制)
                    </label>
                    <input 
                      type="time"
                      required
                      className="block w-full min-w-0 max-w-full h-12 px-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-lavender-200 outline-none text-base shadow-sm appearance-none"
                      value={formTime}
                      onChange={e => setFormTime(e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1.5 ml-1">
                      * 系統將根據時間自動分類為上午、下午或晚上
                    </p>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                       <Car size={16} className="text-lavender-500"/>
                       交通方式
                     </label>
                     <input 
                       className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-lavender-200 outline-none text-base shadow-sm"
                       value={formTransport}
                       onChange={e => setFormTransport(e.target.value)}
                       placeholder="例如：地鐵、步行 (選填)"
                     />
                  </div>
                </div>
              )}

              {/* Dining Specific Fields */}
              {formType === 'dining' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">是否預訂</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-3 rounded-xl border border-gray-200 flex-1 justify-center shadow-sm">
                        <input 
                          type="radio"
                          name="reservedStatus"
                          checked={!formIsReserved}
                          onChange={() => setFormIsReserved(false)}
                          className="w-5 h-5 text-lavender-500 border-gray-300 focus:ring-lavender-400"
                        />
                        <span className="text-gray-700 font-medium">否</span>
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-3 rounded-xl border border-gray-200 flex-1 justify-center shadow-sm">
                        <input 
                          type="radio"
                          name="reservedStatus"
                          checked={formIsReserved}
                          onChange={() => setFormIsReserved(true)}
                          className="w-5 h-5 text-lavender-500 border-gray-300 focus:ring-lavender-400"
                        />
                        <span className="text-gray-700 font-medium">是</span>
                      </label>
                    </div>
                  </div>

                  {/* Conditional Reservation Time Input */}
                  {formIsReserved && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                       <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                         <Clock size={16} className="text-lavender-500"/>
                         預訂時間
                       </label>
                       <input 
                        type="time"
                        required={formIsReserved}
                        className="block w-full min-w-0 max-w-full h-12 px-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-lavender-200 outline-none text-base shadow-sm appearance-none"
                        value={formReservationTime}
                        onChange={e => setFormReservationTime(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Link Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <LinkIcon size={16} className="text-lavender-500"/>
                  連結 (Google Maps/訂位)
                </label>
                <input 
                  type="url"
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-lavender-200 outline-none text-base shadow-sm"
                  value={formLink}
                  onChange={e => setFormLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <StickyNote size={16} className="text-lavender-500"/>
                  備註
                </label>
                <textarea 
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-lavender-200 outline-none min-h-[120px] text-base shadow-sm resize-none"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="注意事項、訂位代號等..."
                />
              </div>

              <div className="pt-6 pb-8">
                <Button type="submit" className="w-full font-bold h-12 text-lg shadow-md shadow-lavender-200/50">
                  {editingId ? '儲存變更' : '確認新增'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
});

ItineraryPage.displayName = 'ItineraryPage';
