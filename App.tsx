import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { TABS, INITIAL_TODOS, INITIAL_ITINERARY } from './constants';
import { TabConfig, TodosState, ItineraryState, ItineraryItem } from './types';
import { PreTripPage } from './components/PreTripPage';
import { ItineraryPage } from './components/ItineraryPage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('prep');
  
  // -- State Management with LocalStorage Persistence --
  
  const [todos, setTodos] = useState<TodosState>(() => {
    const saved = localStorage.getItem('lavender_todos');
    return saved ? JSON.parse(saved) : INITIAL_TODOS;
  });

  const [itinerary, setItinerary] = useState<ItineraryState>(() => {
    const saved = localStorage.getItem('lavender_itinerary');
    return saved ? JSON.parse(saved) : INITIAL_ITINERARY;
  });

  useEffect(() => {
    localStorage.setItem('lavender_todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('lavender_itinerary', JSON.stringify(itinerary));
  }, [itinerary]);

  // -- Handlers --

  const handleItineraryUpdate = (date: string, newItems: ItineraryItem[]) => {
    setItinerary(prev => ({
      ...prev,
      [date]: newItems
    }));
  };

  const currentTabConfig = TABS.find(t => t.id === activeTab);

  const renderContent = () => {
    if (activeTab === 'prep') {
      return <PreTripPage todos={todos} onUpdate={setTodos} />;
    }

    const dateStr = currentTabConfig?.dateStr;
    if (!dateStr) return null;

    const items = itinerary[dateStr] || [];
    
    return (
      <ItineraryPage 
        key={dateStr} // Force re-render on tab change for DND state reset
        dateStr={dateStr}
        items={items}
        onUpdateItems={(newItems) => handleItineraryUpdate(dateStr, newItems)}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans text-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-center relative">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border border-lavender-100 flex-shrink-0">
               <img 
                 src="./icon.png" 
                 alt="Logo" 
                 className="w-full h-full object-cover"
                 onError={(e) => {
                   // Fallback if image fails to load
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.parentElement!.className = "w-10 h-10 rounded-full bg-lavender-100 flex items-center justify-center text-lavender-500 font-bold";
                   e.currentTarget.parentElement!.innerText = "旅";
                 }}
               />
             </div>
             <h1 className="text-xl font-bold tracking-tight text-gray-800">艾瑪的福岡之旅</h1>
          </div>
        </div>

        {/* Tab Navigation - Scrollable on mobile */}
        <div className="border-t border-gray-100 bg-white/95 backdrop-blur">
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
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md mx-auto w-full relative">
        {renderContent()}
      </main>

    </div>
  );
};

export default App;