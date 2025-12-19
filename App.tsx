
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Eye, Heart, Copy, Check, Info, Trash2, ArrowRight, Share2, Loader2, List, X, ExternalLink, AlertTriangle, Key, Clock, Sparkles, RefreshCw, Grid, Layout } from 'lucide-react';
import { ViewMode, GoogleDriveFile } from './types';
import { fetchDriveFiles, getDriveImageUrl, extractFolderId } from './services/driveService';

// --- Sub-component: PhotoCard ---
interface PhotoCardProps {
  file: GoogleDriveFile;
  isSelected: boolean;
  onToggle: (fileName: string) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ file, isSelected, onToggle }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="group relative aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all duration-500 shadow-lg">
      {!imgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 animate-pulse">
          <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
        </div>
      )}
      <img
        src={getDriveImageUrl(file.id)}
        alt={file.name}
        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        onLoad={() => setImgLoaded(true)}
        onError={(e) => {
          setImgLoaded(true);
          (e.currentTarget.src = 'https://via.placeholder.com/400x600?text=Private+Image');
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
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
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const savedSelected = localStorage.getItem('selected_filenames');
    if (savedSelected) setSelectedFiles(JSON.parse(savedSelected));
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
      const driveFiles = await fetchDriveFiles(id);
      setFiles(driveFiles);
      window.location.hash = id;
      if (driveFiles.length === 0) {
        setError("Không tìm thấy tệp ảnh nào trong thư mục này.");
      }
    } catch (err: any) {
      setError(
        <div className="space-y-3">
          <p className="font-bold text-red-400">Lỗi truy cập dữ liệu</p>
          <p className="text-sm opacity-90">{err.message}</p>
          <div className="bg-white/5 p-3 rounded-lg text-xs space-y-2 text-slate-400">
            <p className="font-semibold text-slate-300">Cách khắc phục:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Mở thư mục trên Google Drive.</li>
              <li>Nhấn <b>Chia sẻ (Share)</b>.</li>
              <li>Chuyển quyền truy cập thành <b>Bất kỳ ai có liên kết (Anyone with the link)</b>.</li>
              <li>Đảm bảo API Key của bạn đã được kích hoạt dịch vụ <b>"Google Drive API"</b> trong Cloud Console.</li>
            </ol>
          </div>
        </div>
      );
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="text-indigo-500 w-6 h-6" />
          <h1 className="text-lg font-bold tracking-tight">LensSelect</h1>
        </div>
        <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
          <button onClick={() => setViewMode('client')} className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'client' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Khách hàng</button>
          <button onClick={() => setViewMode('admin')} className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Thợ ảnh</button>
        </nav>
        <div className="w-10"></div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl flex-1 mb-24">
        {viewMode === 'client' ? (
          <div className="space-y-12">
            <div className="max-w-xl mx-auto text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">Thư viện ảnh</h2>
                <p className="text-slate-500 text-sm">Nhập mã thư mục để xem và chọn những tấm ảnh bạn ưng ý nhất.</p>
              </div>

              <div className="relative group">
                <input
                  type="text"
                  value={folderIdInput}
                  onChange={(e) => setFolderIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadFiles(folderIdInput)}
                  placeholder="Dán link hoặc ID thư mục Google Drive..."
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white placeholder:text-slate-600 shadow-2xl"
                />
                <button 
                  onClick={() => handleLoadFiles(folderIdInput)} 
                  disabled={loading}
                  className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg disabled:bg-slate-800 disabled:text-slate-500"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
              
              {error && (
                <div className="p-6 bg-slate-900/50 border border-white/10 rounded-2xl text-left space-y-4 animate-in fade-in zoom-in-95 backdrop-blur-md shadow-2xl">
                  <div className="flex gap-4">
                    <div className="bg-red-500/20 p-2 rounded-lg h-fit"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
                    <div className="flex-1">{error}</div>
                  </div>
                </div>
              )}
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {files.map((file) => (
                  <PhotoCard key={file.id} file={file} isSelected={selectedFiles.includes(file.name)} onToggle={toggleSelect} />
                ))}
              </div>
            )}

            {!loading && files.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-32 text-slate-800">
                <Grid className="w-20 h-20 mb-4 opacity-5" />
                <p className="font-medium text-slate-600 text-sm">Chưa có ảnh nào được tải lên</p>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end bg-slate-900/50 p-6 rounded-3xl border border-white/5">
              <div>
                <h2 className="text-3xl font-black">Danh sách chọn</h2>
                <p className="text-slate-500 text-sm">Khách hàng đã chọn {selectedFiles.length} tấm ảnh.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.confirm("Xóa toàn bộ danh sách đã chọn?") && setSelectedFiles([])} 
                  className="bg-white/5 border border-white/10 w-12 h-12 flex items-center justify-center rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all"
                  title="Xóa tất cả"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={copyForPhotographer} 
                  disabled={selectedFiles.length === 0}
                  className="bg-indigo-600 px-6 h-12 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                  <span className="text-white">{copied ? "Đã copy!" : "Copy mã ảnh"}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 min-h-[400px] shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Layout className="w-32 h-32" />
              </div>
              
              {selectedFiles.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 relative z-10">
                  {selectedFiles.map((name, i) => (
                    <div key={i} className="bg-white/5 p-4 rounded-xl flex justify-between items-center group border border-white/5 hover:border-indigo-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-mono">{(i + 1).toString().padStart(2, '0')}</span>
                        <span className="text-sm font-medium font-mono text-slate-200">{name}</span>
                      </div>
                      <button onClick={() => toggleSelect(name)} className="text-slate-600 hover:text-red-500 transition-colors p-1"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 italic py-24">
                  <List className="w-12 h-12 mb-4 opacity-10" />
                  <p className="text-sm">Danh sách đang trống</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {viewMode === 'client' && selectedFiles.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50">
          <button onClick={() => setViewMode('admin')} className="w-full bg-indigo-600 py-4 rounded-2xl shadow-2xl font-bold flex items-center justify-between px-8 border border-white/20 hover:bg-indigo-500 transition-all active:scale-95 text-white group">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">{selectedFiles.length}</div>
              <span className="text-white">Ảnh đã chọn</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm group-hover:text-white">
              Gửi thợ ảnh <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
