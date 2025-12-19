
import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Heart, Copy, Check, Trash2, ArrowRight, Loader2, List, X, Sparkles, Grid } from 'lucide-react';
import { ViewMode, GoogleDriveFile } from './types';
import { fetchDriveFilesViaAI, getDriveImageUrl } from './services/driveService';

const PhotoCard: React.FC<{ file: GoogleDriveFile; isSelected: boolean; onToggle: (name: string) => void }> = ({ file, isSelected, onToggle }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="group relative aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all duration-500 shadow-xl">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
        </div>
      )}
      <img
        src={getDriveImageUrl(file.id)}
        alt={file.name}
        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={(e) => { 
          setLoaded(true); 
          e.currentTarget.src = 'https://via.placeholder.com/400x600?text=Image+Not+Accessible'; 
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-mono text-white/70 truncate bg-black/40 backdrop-blur-sm p-1 rounded">{file.name}</p>
      </div>
      <button
        onClick={() => onToggle(file.name)}
        className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
          isSelected 
            ? 'bg-red-500 text-white scale-110' 
            : 'bg-black/40 text-white/70 hover:bg-white hover:text-black opacity-0 group-hover:opacity-100 backdrop-blur-md'
        }`}
      >
        <Heart className={`w-5 h-5 ${isSelected ? 'fill-current' : ''}`} />
      </button>
      {isSelected && (
        <div className="absolute top-3 left-3 bg-indigo-600 text-white p-1.5 rounded-lg shadow-lg animate-in zoom-in-50">
          <Check className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('client');
  const [folderIdInput, setFolderIdInput] = useState('');
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('selected_filenames');
    if (saved) setSelectedFiles(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('selected_filenames', JSON.stringify(selectedFiles));
  }, [selectedFiles]);

  const handleScan = async () => {
    if (!folderIdInput) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDriveFilesViaAI(folderIdInput);
      setFiles(data);
      if (data.length === 0) {
        setError("AI không tìm thấy ảnh. Hãy kiểm tra xem thư mục có file ảnh (.jpg, .png) và đã được chia sẻ công khai chưa.");
      }
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra khi quét thư mục.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (name: string) => {
    setSelectedFiles(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]);
  };

  const copyList = () => {
    const list = selectedFiles.map(n => n.split('.').slice(0, -1).join('.')).join(', ');
    navigator.clipboard.writeText(list);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-xl shadow-lg shadow-indigo-600/20">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-lg hidden sm:inline-block">LensSelect</span>
        </div>
        
        <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shadow-inner">
          <button 
            onClick={() => setViewMode('client')} 
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${viewMode === 'client' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Khách hàng
          </button>
          <button 
            onClick={() => setViewMode('admin')} 
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${viewMode === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Thợ ảnh
          </button>
        </nav>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-50 blur-sm"></div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl flex-1">
        {viewMode === 'client' ? (
          <div className="space-y-16">
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-5xl font-black tracking-tight leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">Chọn ảnh đẹp nhất</span>
                  <br />
                  <span className="text-indigo-500 text-3xl">của bạn ngay bây giờ</span>
                </h2>
                <p className="text-slate-400 text-lg">Dán link thư mục Google Drive của bạn và để AI làm phần còn lại.</p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative">
                  <input
                    type="text"
                    value={folderIdInput}
                    onChange={(e) => setFolderIdInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    placeholder="Dán link thư mục Google Drive tại đây..."
                    className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg shadow-2xl backdrop-blur-sm"
                  />
                  <button 
                    onClick={handleScan}
                    disabled={loading}
                    className="absolute right-2 top-2 bottom-2 px-8 bg-indigo-600 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-indigo-600/40"
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
                    <span className="text-white">{loading ? "Đang quét..." : "Quét ảnh"}</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
                  <X className="w-5 h-5 shrink-0" />
                  <p className="text-left font-medium">{error}</p>
                </div>
              )}
            </div>

            {files.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-in fade-in duration-1000 slide-in-from-bottom-8">
                {files.map(f => (
                  <PhotoCard key={f.id} file={f} isSelected={selectedFiles.includes(f.name)} onToggle={toggle} />
                ))}
              </div>
            ) : !loading && (
              <div className="py-32 flex flex-col items-center justify-center space-y-4">
                <div className="bg-white/5 p-8 rounded-full border border-white/5">
                  <Grid className="w-12 h-12 text-slate-800" />
                </div>
                <p className="text-slate-600 font-medium">Chưa có ảnh nào được hiển thị</p>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-900/50 p-8 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-md">
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tight text-white">Ảnh đã chọn</h3>
                <p className="text-indigo-400 font-medium">{selectedFiles.length} file sẵn sàng để copy</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => window.confirm("Xóa toàn bộ danh sách?") && setSelectedFiles([])} 
                  className="flex-1 sm:flex-none p-4 bg-white/5 rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all border border-white/5"
                  title="Xóa tất cả"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={copyList} 
                  disabled={selectedFiles.length === 0}
                  className="flex-[2] sm:flex-none px-8 py-4 bg-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 text-white"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span>{copied ? "Đã chép mã" : "Copy danh sách"}</span>
                </button>
              </div>
            </div>
            
            <div className="bg-slate-900/40 rounded-[2rem] border border-white/5 p-8 min-h-[400px] shadow-inner">
              {selectedFiles.length > 0 ? (
                <div className="grid gap-3">
                  {selectedFiles.map((n, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-600 font-mono">{(i + 1).toString().padStart(2, '0')}</span>
                        <span className="font-mono text-sm text-slate-200">{n}</span>
                      </div>
                      <button 
                        onClick={() => toggle(n)} 
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-all p-2"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-32 text-slate-700 italic space-y-4">
                  <List className="w-16 h-16 opacity-5" />
                  <p className="text-lg">Danh sách đang trống</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {viewMode === 'client' && selectedFiles.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50 animate-in slide-in-from-bottom-10 duration-500">
          <button 
            onClick={() => setViewMode('admin')} 
            className="w-full bg-indigo-600 py-5 rounded-3xl shadow-2xl font-bold flex items-center justify-between px-10 border border-white/20 hover:bg-indigo-500 transition-all active:scale-95 text-white group"
          >
            <div className="flex items-center gap-4">
              <span className="bg-white/20 px-3 py-1 rounded-xl text-sm">{selectedFiles.length}</span>
              <span className="text-lg">Xem danh sách đã chọn</span>
            </div>
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
