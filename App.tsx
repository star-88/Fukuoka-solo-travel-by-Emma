
import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { ShoppingBag, Settings, Calendar, Plus, Plane } from 'lucide-react';
import { TABS, INITIAL_TODOS, INITIAL_ITINERARY, INITIAL_SHOPPING_LIST } from './constants';
import { TabConfig, TodosState, ItineraryState, ItineraryItem, ShoppingAlbum } from './types';
import { PreTripPage } from './components/PreTripPage';
import { ItineraryPage, ItineraryPageHandle } from './components/ItineraryPage';
import { ShoppingPage } from './components/ShoppingPage';
import { SettingsPage } from './components/SettingsPage';

type ViewMode = 'itinerary' | 'shopping' | 'settings';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('itinerary');
  const [activeTab, setActiveTab] = useState<string>('prep'); // Itinerary tabs (prep, day1...)
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ref to access ItineraryPage methods
  const itineraryPageRef = useRef<ItineraryPageHandle>(null);
  
  // -- State Management with LocalStorage Persistence --
  
  const [todos, setTodos] = useState<TodosState>(() => {
    const saved = localStorage.getItem('lavender_todos');
    return saved ? JSON.parse(saved) : INITIAL_TODOS;
  });

  const [itinerary, setItinerary] = useState<ItineraryState>(() => {
    const saved = localStorage.getItem('lavender_itinerary');
    return saved ? JSON.parse(saved) : INITIAL_ITINERARY;
  });

  const [shoppingAlbums, setShoppingAlbums] = useState<ShoppingAlbum[]>(() => {
    const saved = localStorage.getItem('lavender_shopping');
    return saved ? JSON.parse(saved) : INITIAL_SHOPPING_LIST;
  });

  useEffect(() => {
    localStorage.setItem('lavender_todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('lavender_itinerary', JSON.stringify(itinerary));
  }, [itinerary]);

  useEffect(() => {
    localStorage.setItem('lavender_shopping', JSON.stringify(shoppingAlbums));
  }, [shoppingAlbums]);

  // -- Handlers --

  const handleItineraryUpdate = (date: string, newItems: ItineraryItem[]) => {
    setItinerary(prev => ({
      ...prev,
      [date]: newItems
    }));
  };

  const handleBackup = () => {
    const data = {
      app: 'fukuoka-trip',
      version: 1,
      timestamp: new Date().toISOString(),
      todos,
      itinerary,
      shoppingAlbums
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fukuoka-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Simple validation
        if (json.app !== 'fukuoka-trip' && !json.itinerary) {
          alert('這不是有效的備份檔案！');
          return;
        }

        if (window.confirm('確定要還原此備份嗎？目前的資料將會被覆蓋。')) {
          if (json.todos) setTodos(json.todos);
          if (json.itinerary) setItinerary(json.itinerary);
          if (json.shoppingAlbums) setShoppingAlbums(json.shoppingAlbums);
          
          alert('資料還原成功！');
          // Navigate back to itinerary to see changes
          setViewMode('itinerary');
        }
      } catch (error) {
        console.error('Restore failed', error);
        alert('檔案讀取失敗，請確認檔案格式正確。');
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // -- Render Logic --

  const currentTabConfig = TABS.find(t => t.id === activeTab);

  const renderContent = () => {
    if (viewMode === 'settings') {
      return (
        <SettingsPage 
          onBackup={handleBackup} 
          onRestore={handleRestore} 
          fileInputRef={fileInputRef} 
        />
      );
    }

    if (viewMode === 'shopping') {
      return <ShoppingPage albums={shoppingAlbums} onUpdateAlbums={setShoppingAlbums} />;
    }

    // Itinerary Mode
    if (activeTab === 'prep') {
      return <PreTripPage todos={todos} onUpdate={setTodos} />;
    }

    const dateStr = currentTabConfig?.dateStr;
    if (!dateStr) return null;

    const items = itinerary[dateStr] || [];
    
    return (
      <ItineraryPage 
        ref={itineraryPageRef}
        key={dateStr} // Force re-render on tab change for DND state reset
        dateStr={dateStr}
        items={items}
        onUpdateItems={(newItems) => handleItineraryUpdate(dateStr, newItems)}
      />
    );
  };

  // State to track if image failed to load, to switch to icon fallback
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans text-gray-900 flex flex-col">
      {/* Top Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between relative h-14">
          
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm border border-lavender-100 flex-shrink-0 bg-lavender-50 flex items-center justify-center">
               {!logoError ? (
                 <img 
                   src="public/logo.png?v=5" 
                   alt="Logo" 
                   className="w-full h-full object-cover"
                   onError={() => setLogoError(true)}
                 />
               ) : (
                 <Plane size={20} className="text-lavender-400" />
               )}
             </div>
             <h1 className="text-lg font-bold tracking-tight text-gray-800">艾瑪ㄉ福岡獨旅✨</h1>
          </div>

          {/* Right: Add Button (Only visible in Itinerary Mode & NOT Prep tab) */}
          <div className="flex items-center">
            {viewMode === 'itinerary' && activeTab !== 'prep' && (
              <button
                onClick={() => itineraryPageRef.current?.openAddModal()}
                className="w-9 h-9 rounded-full bg-lavender-50 text-lavender-500 flex items-center justify-center hover:bg-lavender-100 active:scale-95 transition-all"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation (Only visible in Itinerary Mode) */}
        {viewMode === 'itinerary' && (
          <div className="border-t border-gray-100 bg-white/95 backdrop-blur animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="max-w-md mx-auto flex overflow-x-auto no-scrollbar py-2 px-2 gap-1 snap-x">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      'flex-shrink-0 flex flex-col items-center justify-center min-w-[72px] py-2 px-1 rounded-xl transition-all snap-start',
                      isActive 
                        ? 'bg-lavender-400 text-white shadow-md shadow-lavender-200 scale-100' 
                        : 'bg-transparent text-gray-500 hover:bg-gray-50 scale-95'
                    )}
                  >
                    <span className={clsx("text-xs font-semibold", isActive ? "text-lavender-50" : "text-gray-400")}>
                      {tab.label}
                    </span>
                    <span className={clsx("text-sm font-bold leading-tight", isActive ? "text-white" : "text-gray-600")}>
                      {tab.subLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md mx-auto w-full relative pb-28">
        {renderContent()}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 rounded-full px-8 py-3 flex items-center gap-10 pointer-events-auto">
          
          {/* Shopping Tab */}
          <button 
            onClick={() => setViewMode('shopping')}
            className={clsx(
              "flex flex-col items-center gap-1 transition-all duration-200",
              viewMode === 'shopping' ? "text-lavender-500 scale-110" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <ShoppingBag size={16} strokeWidth={viewMode === 'shopping' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">購物清單</span>
          </button>

          {/* Itinerary Tab */}
          <button 
            onClick={() => setViewMode('itinerary')}
            className={clsx(
              "flex flex-col items-center gap-1 transition-all duration-200",
              viewMode === 'itinerary' ? "text-lavender-500 scale-110" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Calendar size={16} strokeWidth={viewMode === 'itinerary' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">行程規劃</span>
          </button>

          {/* Settings Tab */}
          <button 
            onClick={() => setViewMode('settings')}
            className={clsx(
              "flex flex-col items-center gap-1 transition-all duration-200",
              viewMode === 'settings' ? "text-lavender-500 scale-110" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Settings size={16} strokeWidth={viewMode === 'settings' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">備份設定</span>
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default App;
