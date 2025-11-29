import React, { useRef, useState } from 'react';
import { AppSettings } from '../types';
import { Trash, Info, Smartphone, Download, Upload, FileJson, AlertTriangle } from 'lucide-react';
import { storageService } from '../services/storageService';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onReset: () => void;
  onRestore: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, onReset, onRestore }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  const handleResetClick = () => {
    setIsResetModalOpen(true);
  };

  const confirmReset = () => {
    onReset();
    setIsResetModalOpen(false);
  };

  const handleBackup = () => {
    const jsonString = storageService.exportData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `mononote_backup_${date}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storageService.importData(content);
        if (success) {
          // Update state directly without reloading page
          onRestore();
        } else {
          alert('数据恢复失败，文件格式可能不正确。');
        }
      }
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="pb-24 px-6 min-h-screen">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Info size={18} /> 关于
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          MonoNote 是一款离线优先的应用。您的所有数据都安全地存储在本地设备上。
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Smartphone size={18} /> 添加到桌面
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          点击浏览器菜单中的“分享”或“更多”，选择“添加到主屏幕”即可像App一样使用。
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileJson size={18} /> 数据管理
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          为了防止数据丢失（如清理缓存或更换手机），建议定期备份数据。
        </p>
        
        <div className="flex gap-4">
          <button 
            onClick={handleBackup}
            className="flex-1 py-3 bg-gray-50 text-gray-800 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <Download size={20} />
            备份数据
          </button>
          
          <button 
            onClick={handleRestoreClick}
            className="flex-1 py-3 bg-gray-50 text-gray-800 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <Upload size={20} />
            恢复数据
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-red-500 mb-4 flex items-center gap-2">
          <Trash size={18} /> 危险区域
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          清除数据将永久删除您的所有笔记和账单记录，且无法找回。
        </p>
        <button 
          onClick={handleResetClick}
          className="w-full py-3 border-2 border-red-100 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
        >
          重置所有数据
        </button>
      </div>

      <div className="mt-12 text-center">
        <p className="text-xs text-gray-400">MonoNote v1.0.1</p>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">危险操作</h3>
              <p className="text-sm text-gray-500 mb-6">
                您确定要清空所有数据吗？<br/>
                <span className="text-red-500 font-bold">此操作无法撤销！</span>
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={confirmReset}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  确认重置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};