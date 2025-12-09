
import React, { useState, useRef } from 'react';
import { Folder, ArrowLeft, Plus, Image as ImageIcon, Check, Trash2, ShoppingBag, Camera, X } from 'lucide-react';
import { ShoppingAlbum, ShoppingItem } from '../types';
import { Button } from './Button';
import { clsx } from 'clsx';

interface ShoppingPageProps {
  albums: ShoppingAlbum[];
  onUpdateAlbums: (albums: ShoppingAlbum[]) => void;
}

export const ShoppingPage: React.FC<ShoppingPageProps> = ({ albums, onUpdateAlbums }) => {
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  
  // State for Long Press Delete Mode on Albums
  const [deletableAlbumId, setDeletableAlbumId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggered = useRef(false);
  
  // New Item/Album Form State
  const [newName, setNewName] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeAlbum = activeAlbumId ? albums.find(a => a.id === activeAlbumId) : null;

  // --- Navigation Logic Fix ---
  const handleBack = () => {
    if (isAddingMode) {
      setIsAddingMode(false);
      setNewName('');
      setNewImageUrl('');
    } else if (activeAlbumId) {
      setActiveAlbumId(null);
    }
  };

  const showBackButton = isAddingMode || activeAlbumId !== null;

  const getPageTitle = () => {
    if (isAddingMode) {
      return activeAlbumId ? '新增商品' : '新增相簿';
    }
    return activeAlbum ? activeAlbum.name : '購物清單';
  };

  // --- Long Press Logic for Albums ---
  const handleTouchStart = (id: string) => {
    isLongPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      setDeletableAlbumId(id);
      if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
    }, 600); // 600ms threshold
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    // Cancel long press if user scrolls
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleAlbumClick = (id: string) => {
    // If it was a long press event, do not navigate
    if (isLongPressTriggered.current) {
      isLongPressTriggered.current = false;
      return;
    }

    // If currently in delete mode for this album, toggle it off
    if (deletableAlbumId === id) {
      setDeletableAlbumId(null);
      return;
    }

    // If another album is in delete mode, clear it
    if (deletableAlbumId) {
      setDeletableAlbumId(null);
      return;
    }

    // Normal navigation
    setActiveAlbumId(id);
  };

  // --- Image Handling Logic (Compression) ---
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImg(true);

    try {
      const base64 = await resizeAndCompressImage(file);
      setNewImageUrl(base64);
    } catch (error) {
      console.error("Image processing failed", error);
      alert("圖片處理失敗，請試試看別張照片");
    } finally {
      setIsProcessingImg(false);
    }
  };

  const resizeAndCompressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
             width = MAX_WIDTH;
             height = img.height * scaleSize;
          }

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedBase64);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleCreate = () => {
    if (!newName.trim()) return;

    if (activeAlbumId) {
      const newItem: ShoppingItem = {
        id: `item-${Date.now()}`,
        name: newName.trim(),
        imageUrl: newImageUrl || undefined,
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
    setDeletableAlbumId(null);
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
                className="relative group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                onClick={() => toggleItemCheck(item.id)}
              >
                <div className="aspect-square bg-gray-100 w-full relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  
                  {item.checked && (
                    <div className="absolute inset-0 bg-lavender-500/40 flex items-center justify-center backdrop-blur-[1px]">
                       <div className="bg-white rounded-full p-2 shadow-lg">
                         <Check size={24} className="text-lavender-500" strokeWidth={3} />
                       </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white flex items-center justify-between flex-1">
                  <span className={clsx("font-medium text-sm truncate", item.checked ? "text-gray-400 line-through" : "text-gray-700")}>
                    {item.name}
                  </span>
                  
                  <div className={clsx(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ml-2",
                    item.checked ? "bg-lavender-400 border-lavender-400" : "border-gray-300 bg-transparent"
                  )}>
                    {item.checked && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                </div>

                <button 
                  onClick={(e) => deleteItem(e, item.id)}
                  className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <button 
              onClick={() => setIsAddingMode(true)}
              className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-white hover:border-lavender-300 hover:text-lavender-500 transition-colors gap-2 bg-gray-50/50"
            >
              <Plus size={32} />
              <span className="text-xs font-medium">新增商品</span>
            </button>
          </div>
        </div>
      );
    }

    // --- Albums View (With Long Press Logic) ---
    return (
      <div className="grid grid-cols-2 gap-4">
        {albums.map(album => {
          const isDeletable = deletableAlbumId === album.id;
          return (
            <div 
              key={album.id}
              className={clsx(
                "bg-white p-4 rounded-2xl shadow-sm transition-all relative group cursor-pointer border select-none",
                isDeletable ? "border-red-200 ring-2 ring-red-100 scale-[0.98]" : "border-transparent hover:border-lavender-100 hover:shadow-md"
              )}
              onTouchStart={() => handleTouchStart(album.id)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onClick={() => handleAlbumClick(album.id)}
              onContextMenu={(e) => e.preventDefault()} // Prevent native context menu on long press
            >
               <div className={clsx(
                 "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors",
                 isDeletable ? "bg-red-50 text-red-400" : "bg-lavender-50 text-lavender-500"
               )}>
                 <Folder size={24} fill="currentColor" className={isDeletable ? "text-red-200" : "text-lavender-200"} />
               </div>
               <h3 className="font-bold text-gray-700 truncate">{album.name}</h3>
               <p className="text-xs text-gray-400">{album.items.length} 個商品</p>
  
               {/* Delete Button - Only visible when in Delete Mode */}
               <button 
                  onClick={(e) => deleteAlbum(e, album.id)}
                  className={clsx(
                    "absolute -top-2 -right-2 p-2 rounded-full text-white shadow-md transition-all z-10",
                    isDeletable 
                      ? "bg-red-500 opacity-100 scale-100 pointer-events-auto" 
                      : "bg-red-500 opacity-0 scale-50 pointer-events-none"
                  )}
                >
                  <Trash2 size={16} />
                </button>
                
                {/* Visual hint for delete mode */}
                {isDeletable && (
                  <div className="absolute inset-0 bg-red-50/10 rounded-2xl pointer-events-none" />
                )}
            </div>
          );
        })}
        
        <button 
          onClick={() => setIsAddingMode(true)}
          className="bg-gray-50/50 p-4 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-white hover:border-lavender-300 hover:text-lavender-500 transition-colors min-h-[120px] gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
             <Plus size={20} />
          </div>
          <span className="text-sm font-medium">新增相簿</span>
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 pb-24 min-h-full animate-in fade-in duration-300" onClick={() => {
      // Click empty space to cancel delete mode
      if (deletableAlbumId) setDeletableAlbumId(null);
    }}>
      {/* Page Header */}
      <div className="flex items-center gap-2 mb-6 sticky top-0 bg-[#FDFDFF]/95 backdrop-blur-sm z-20 py-2">
        {showBackButton ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleBack();
            }} 
            className="p-1.5 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
        ) : (
          <div className="p-1.5 bg-lavender-100 rounded-lg text-lavender-600">
            <ShoppingBag size={20} />
          </div>
        )}
        <h2 className="text-2xl font-bold text-gray-800">
          {getPageTitle()}
        </h2>
      </div>

      <div className="max-w-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">商品照片 (選填)</label>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />

                    {newImageUrl ? (
                      <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <img src={newImageUrl} alt="Preview" className="w-full h-full object-contain" />
                        <button 
                          onClick={() => setNewImageUrl('')}
                          className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingImg}
                        className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2 hover:bg-gray-50 hover:border-lavender-300 hover:text-lavender-500 transition-colors"
                      >
                         {isProcessingImg ? (
                           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lavender-500"></div>
                         ) : (
                           <>
                            <Camera size={24} />
                            <span className="text-sm">點擊上傳 / 拍攝照片</span>
                           </>
                         )}
                      </button>
                    )}
                </div>
                )}
                
                <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setIsAddingMode(false)}>取消</Button>
                <Button className="flex-1 font-bold" onClick={handleCreate} disabled={isProcessingImg}>
                  {isProcessingImg ? '處理中...' : '確認新增'}
                </Button>
                </div>
            </div>
            </div>
        ) : (
            renderContent()
        )}
      </div>
    </div>
  );
};
