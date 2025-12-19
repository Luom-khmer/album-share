
import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Settings, Eye, Heart, Copy, Check, Info, Trash2, ArrowRight, Share2, Loader2, List, X, Lock, ExternalLink, AlertTriangle, Key } from 'lucide-react';
import { ViewMode, GoogleDriveFile } from './types';
import { fetchDriveFilesViaGemini, getDriveImageUrl, extractFolderId } from './services/driveService';

// --- Sub-component: PhotoCard ---
interface PhotoCardProps {
  file: GoogleDriveFile;
  isSelected: boolean;
  onToggle: (fileName: string) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ file, isSelected, onToggle }) => {
  return (
    <div className="group relative aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all duration-500 shadow-lg">
      <img
        src={getDriveImageUrl(file.id)}
        alt={file.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x600?text=Private+Image')}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
        <span className="text-xs font-medium text-white/90 truncate drop-shadow-md font-sans">{file.name}</span>
      </div>
      <button
        onClick={() => onToggle(file.name)}
        className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md shadow-xl ${
          isSelected 
            ? 'bg-red-500 text-white scale-110 shadow-red-500/20' 
            : 'bg-black/40 text-white/70 hover:bg-white hover:text-slate-900 opacity-0 group-hover:opacity-100'
        }`}
      >
        <Heart className={`w-5 h-5 ${isSelected ? 'fill-current' : ''}`} />
      </button>
      {isSelected && (
        <div className="absolute top-3 left-3 bg-indigo-600 text-white p-1.5 rounded-lg shadow-lg animate-in zoom-in-75">
          <Check className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

// --- Main Component: App ---
const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('client');
  const [folderIdInput, setFolderIdInput] = useState<string>('');
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isKeySelected, setIsKeySelected] = useState<boolean>(true);

  useEffect(() => {
    const checkKey = async () => {
      try {
        // @ts-ignore
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
          // @ts-ignore
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setIsKeySelected(hasKey);
        }
      } catch (e) {
        console.warn("AI Studio context not found");
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setIsKeySelected(true);
    } else {
      window.open("https://aistudio.google.com/app/apikey", "_blank");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('selected_filenames');
    if (saved) setSelectedFiles(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('selected_filenames', JSON.stringify(selectedFiles));
  }, [selectedFiles]);

  const handleLoadFiles = async (input: string) => {
    const id = extractFolderId(input);
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { files: driveFiles } = await fetchDriveFilesViaGemini(id);
      setFiles(driveFiles);
      window.location.hash = id;
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("THIẾU API KEY")) {
        setError("Chưa cấu hình API Key. Nếu bạn đang dùng Vercel, hãy thêm biến 'API_KEY' vào Environment Variables.");
      } else if (msg.includes("403")) {
        setError("Lỗi 403: API Key của bạn cần được bật thanh toán (Billing) trên Google Cloud.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = useCallback((fileName: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileName) ? prev.filter(f => f !== fileName) : [...prev, fileName]
    );
  }, []);

  const copyForPhotographer = () => {
    const formatted = selectedFiles
      .map(name => name.split('.').slice(0, -1).join('.'))
      .join(', ');
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isKeySelected) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-600/20 rotate-12">
            <Key className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white">Thiếu Kết Nối</h2>
            <p className="text-slate-400">Ứng dụng cần API Key để quét hình ảnh từ Drive qua AI.</p>
          </div>
          <button onClick={handleOpenSelectKey} className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all shadow-xl">
            Cài đặt API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="text-indigo-500 w-6 h-6" />
          <h1 className="text-lg font-bold hidden sm:block">LensSelect</h1>
        </div>
        <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
          <button onClick={() => setViewMode('client')} className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'client' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Khách hàng</button>
          <button onClick={() => setViewMode('admin')} className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Thợ ảnh</button>
        </nav>
        <div className="w-10 h-10" />
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl flex-1 mb-24">
        {viewMode === 'client' ? (
          <div className="space-y-12">
            <div className="max-w-xl mx-auto text-center space-y-6">
              <h2 className="text-4xl font-black tracking-tight font-sans">Thư viện của bạn</h2>
              <div className="relative group">
                <input
                  type="text"
                  value={folderIdInput}
                  onChange={(e) => setFolderIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadFiles(folderIdInput)}
                  placeholder="Dán link thư mục Google Drive..."
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white placeholder:text-slate-600"
                />
                <button onClick={() => handleLoadFiles(folderIdInput)} className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg">
                  {loading ? <Loader2 className="animate-spin w-5 h-5 text-white" /> : <ArrowRight className="w-5 h-5 text-white" />}
                </button>
              </div>
              
              {error && (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-left space-y-4 animate-in fade-in zoom-in-95">
                  <div className="flex gap-3 text-red-400">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    <div>
                       <p className="text-sm font-bold mb-1">Cần chú ý:</p>
                       <p className="text-sm leading-relaxed opacity-90">{error}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-red-500/10 flex flex-wrap gap-3">
                    <a href="https://vercel.com/dashboard" target="_blank" className="text-xs bg-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-all font-bold flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Dashboard Vercel
                    </a>
                    <button onClick={handleOpenSelectKey} className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-500/30 transition-all font-bold">
                      Lấy API Key mới
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {files.map((file) => (
                <PhotoCard key={file.id} file={file} isSelected={selectedFiles.includes(file.name)} onToggle={toggleSelect} />
              ))}
            </div>

            {!loading && files.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-700">
                <Share2 className="w-16 h-16 mb-4 opacity-10" />
                <p className="font-medium">Nhập Link Google Drive để bắt đầu chọn ảnh</p>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black">Danh sách chọn</h2>
                <p className="text-slate-400">Đã chọn {selectedFiles.length} ảnh.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.confirm("Xóa toàn bộ danh sách?") && setSelectedFiles([])}
                  className="bg-white/5 border border-white/10 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button onClick={copyForPhotographer} className="bg-indigo-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                  <span className="text-white">{copied ? "Đã copy!" : "Copy cho thợ ảnh"}</span>
                </button>
              </div>
            </div>
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 min-h-[300px] shadow-inner">
              {selectedFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedFiles.map((name, i) => (
                    <div key={i} className="bg-white/5 p-3 rounded-lg flex justify-between items-center group border border-white/5">
                      <span className="text-sm truncate pr-4 font-mono">{name}</span>
                      <button onClick={() => toggleSelect(name)} className="text-slate-500 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 italic py-20">
                  <List className="w-10 h-10 mb-2 opacity-10" />
                  <p>Chưa có ảnh nào được chọn.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {viewMode === 'client' && selectedFiles.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
          <button onClick={() => setViewMode('admin')} className="w-full bg-indigo-600 py-4 rounded-2xl shadow-2xl font-black flex items-center justify-between px-8 border border-white/10 hover:bg-indigo-500 transition-all active:scale-95 text-white">
            <span className="text-white">Đã chọn {selectedFiles.length} ảnh</span>
            <div className="flex items-center gap-2 text-white">Xem danh sách <ArrowRight className="w-4 h-4" /></div>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
