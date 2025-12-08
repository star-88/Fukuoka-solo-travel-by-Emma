
import React, { useState } from 'react';
import { Folder, ArrowLeft, Plus, Image as ImageIcon, Check, Trash2, ShoppingBag } from 'lucide-react';
import { ShoppingAlbum, ShoppingItem } from '../types';
import { Modal } from './Modal';
import { Button } from './Button';
import { clsx } from 'clsx';

interface ShoppingModalProps {
  isOpen: boolean;
  onClose: () => void;
  albums: ShoppingAlbum[];
  onUpdateAlbums: (albums: ShoppingAlbum[]) => void;
}

export const ShoppingModal: React.FC<ShoppingModalProps> = ({ isOpen, onClose, albums, onUpdateAlbums }) => {
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  
  // New Item/Album Form State
  const [newName, setNewName] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  const activeAlbum = activeAlbumId ? albums.find(a => a.id === activeAlbumId) : null;

  const handleCreate = () => {
    if (!newName.trim()) return;

    if (activeAlbumId) {
      // Create Item
      const newItem: ShoppingItem = {
        id: `item-${Date.now()}`,
        name: newName.trim(),
        imageUrl: newImageUrl.trim() || undefined,
        checked: false,
      };
      
      const updatedAlbums = albums.map(album => {
        if (album.id === activeAlbumId) {
          return { ...album, items: [...album.items, newItem] };
        }
        return album;
      });
      onUpdateAlbums(updatedAlbums);

    } else {
      // Create Album
      const newAlbum: ShoppingAlbum = {
        id: `album-${Date.now()}`,
        name: newName.trim(),
        items: []
      };
      onUpdateAlbums([...albums, newAlbum]);
    }

    setNewName('');
    setNewImageUrl('');
    setIsAddingMode(false);
  };

  const toggleItemCheck = (itemId: string) => {
    if (!activeAlbumId) return;
    
    const updatedAlbums = albums.map(album => {
      if (album.id === activeAlbumId) {
        const updatedItems = album.items.map(item => 
          item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        return { ...album, items: updatedItems };
      }
      return album;
    });
    onUpdateAlbums(updatedAlbums);
  };

  const deleteItem = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!activeAlbumId || !window.confirm('確定要刪除這個商品嗎？')) return;

    const updatedAlbums = albums.map(album => {
      if (album.id === activeAlbumId) {
        return { ...album, items: album.items.filter(i => i.id !== itemId) };
      }
      return album;
    });
    onUpdateAlbums(updatedAlbums);
  };

  const deleteAlbum = (e: React.MouseEvent, albumId: string) => {
    e.stopPropagation();
    if (!window.confirm('確定要刪除整個相簿嗎？')) return;
    onUpdateAlbums(albums.filter(a => a.id !== albumId));
  };

  const renderContent = () => {
    if (activeAlbum) {
      // --- Items View ---
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {activeAlbum.items.map(item => (
              <div 
                key={item.id} 
                className="relative group bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col"
                onClick={() => toggleItemCheck(item.id)}
              >
                {/* Image Area */}
                <div className="aspect-square bg-gray-200 w-full relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  
                  {/* Overlay for checked state */}
                  {item.checked && (
                    <div className="absolute inset-0 bg-lavender-500/40 flex items-center justify-center backdrop-blur-[1px]">
                       <div className="bg-white rounded-full p-2 shadow-lg">
                         <Check size={24} className="text-lavender-500" strokeWidth={3} />
                       </div>
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-3 bg-white flex items-center justify-between flex-1">
                  <span className={clsx("font-medium text-sm truncate", item.checked ? "text-gray-400 line-through" : "text-gray-700")}>
                    {item.name}
                  </span>
                  
                  {/* Circle Checkbox Visual */}
                  <div className={clsx(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ml-2",
                    item.checked ? "bg-lavender-400 border-lavender-400" : "border-gray-300 bg-transparent"
                  )}>
                    {item.checked && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                </div>

                {/* Delete Button (Visible on Long press or careful click - simplified to a button here) */}
                <button 
                  onClick={(e) => deleteItem(e, item.id)}
                  className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* Add Item Button (Card Style) */}
            <button 
              onClick={() => setIsAddingMode(true)}
              className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-lavender-300 hover:text-lavender-500 transition-colors gap-2"
            >
              <Plus size={32} />
              <span className="text-xs font-medium">新增商品</span>
            </button>
          </div>
        </div>
      );
    }

    // --- Albums View ---
    return (
      <div className="grid grid-cols-2 gap-4">
        {albums.map(album => (
          <div 
            key={album.id}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group cursor-pointer"
            onClick={() => setActiveAlbumId(album.id)}
          >
             <div className="bg-lavender-50 w-12 h-12 rounded-xl flex items-center justify-center text-lavender-500 mb-3">
               <Folder size={24} fill="currentColor" className="text-lavender-200" />
             </div>
             <h3 className="font-bold text-gray-700 truncate">{album.name}</h3>
             <p className="text-xs text-gray-400">{album.items.length} 個商品</p>

             <button 
                onClick={(e) => deleteAlbum(e, album.id)}
                className="absolute top-3 right-3 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
          </div>
        ))}
        
        {/* Add Album Button */}
        <button 
          onClick={() => setIsAddingMode(true)}
          className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-lavender-300 hover:text-lavender-500 transition-colors min-h-[120px] gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
             <Plus size={20} />
          </div>
          <span className="text-sm font-medium">新增相簿</span>
        </button>
      </div>
    );
  };

  // --- Modal Header ---
  const headerTitle = activeAlbum ? activeAlbum.name : '購物清單';

  // Override content of the generic Modal for custom header actions
  // Actually, we can just use the generic Modal and put custom stuff in children? 
  // But generic modal has a fixed header. Let's make a custom layout inside.

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl h-[85vh] flex flex-col transform transition-transform animate-in slide-in-from-bottom duration-200">
        
        {/* Custom Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            {activeAlbum ? (
              <Button variant="ghost" size="icon" onClick={() => setActiveAlbumId(null)} className="h-8 w-8 -ml-2 rounded-full">
                <ArrowLeft size={20} />
              </Button>
            ) : (
               <div className="p-1.5 bg-lavender-100 rounded-lg text-lavender-600">
                 <ShoppingBag size={18} />
               </div>
            )}
            <h2 className="text-lg font-bold text-gray-800">{headerTitle}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500">
            關閉
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#FDFDFF]">
           {isAddingMode ? (
             <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
               <h3 className="text-lg font-bold text-gray-800 mb-4">
                 {activeAlbumId ? '新增商品' : '新增相簿'}
               </h3>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     {activeAlbumId ? '商品名稱' : '相簿名稱'}
                   </label>
                   <input 
                      autoFocus
                      className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lavender-200 outline-none"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder={activeAlbumId ? "例如：眉筆" : "例如：藥妝店"}
                   />
                 </div>

                 {activeAlbumId && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">圖片連結 (選填)</label>
                     <input 
                        className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lavender-200 outline-none"
                        value={newImageUrl}
                        onChange={e => setNewImageUrl(e.target.value)}
                        placeholder="https://..."
                     />
                   </div>
                 )}
                 
                 <div className="flex gap-2 pt-2">
                   <Button variant="secondary" className="flex-1" onClick={() => setIsAddingMode(false)}>取消</Button>
                   <Button className="flex-1 font-bold" onClick={handleCreate}>確認新增</Button>
                 </div>
               </div>
             </div>
           ) : (
             renderContent()
           )}
        </div>
      </div>
    </div>
  );
};
