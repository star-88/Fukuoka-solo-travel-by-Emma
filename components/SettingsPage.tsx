
import React from 'react';
import { Download, Upload, Settings as SettingsIcon } from 'lucide-react';
import { Button } from './Button';

interface SettingsPageProps {
  onBackup: () => void;
  onRestore: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBackup, onRestore, fileInputRef }) => {
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 sticky top-0 bg-[#FDFDFF]/95 backdrop-blur-sm z-20 py-2">
        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600">
          <SettingsIcon size={20} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">設定與備份</h2>
      </div>

      <div className="space-y-6">
        {/* Backup Section */}
        <section className="bg-lavender-50 p-6 rounded-2xl border border-lavender-100 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-white rounded-xl text-lavender-500 shadow-sm">
              <Download size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-lavender-800 mb-1">
                備份資料
              </h3>
              <p className="text-sm text-lavender-600/80 leading-relaxed">
                將目前的行程、購物清單、行前準備等所有資料下載成檔案保存。建議在更新 App 前先進行備份。
              </p>
            </div>
          </div>
          <Button onClick={onBackup} className="w-full bg-lavender-400 hover:bg-lavender-500 text-white font-bold h-12 text-base rounded-xl shadow-md shadow-lavender-200/50 transition-transform active:scale-[0.98]">
            下載備份檔案 (.json)
          </Button>
        </section>

        {/* Restore Section */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-xl text-gray-500 border border-gray-100">
              <Upload size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                還原資料
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                選取之前的備份檔案來還原資料。
                <br />
                <span className="text-red-400 font-medium">注意：目前的資料將會被覆蓋。</span>
              </p>
            </div>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={onRestore}
            accept=".json"
            className="hidden" 
          />
          <Button 
            variant="secondary" 
            onClick={() => fileInputRef.current?.click()} 
            className="w-full h-12 font-bold text-gray-600 border-2 border-gray-100 hover:border-lavender-200 hover:bg-white text-base rounded-xl"
          >
            選取檔案並還原
          </Button>
        </section>

        {/* Footer Info */}
        <div className="text-center pt-8">
           <p className="text-xs text-gray-300 font-medium tracking-wider">艾瑪的福岡之旅 v1.3.0</p>
        </div>
      </div>
    </div>
  );
};
