
import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Heart, Copy, Check, Info, Trash2, ArrowRight, Share2, Loader2, List, X, ExternalLink, AlertTriangle, Sparkles, Grid, Layout, Search } from 'lucide-react';
import { ViewMode, GoogleDriveFile } from './types';
import { fetchDriveFilesViaAI, getDriveImageUrl, extractFolderId } from './services/driveService';

const PhotoCard: React.FC<{ file: GoogleDriveFile; isSelected: boolean; onToggle: (name: string) => void }> = ({ file, isSelected, onToggle }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="group relative aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all duration-500">
      {!loaded && <div className="absolute inset-0 flex items-center justify-center bg-slate-800 animate-pulse"><Loader2 className="w-5 h-5 animate-spin text-slate-600" /></div>}
      <img
        src={getDriveImageUrl(file.id)}
        alt={file.name}
        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={(e) => { setLoaded(true); e.currentTarget.src = 'https://via.placeholder.com/400x600?text=Private+Image'; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-mono text-white/70 truncate">{file.name}</p>
      </div>
      <button
        onClick={() => onToggle(file.name)}
        className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-red-500 text-white scale-110' : 'bg-black/40 text-white/70 hover:bg-white hover:text-black opacity-0 group-hover:opacity-100'}`}
      >
        <Heart className={`w-5 h-5 ${isSelected ? 'fill-current' : ''}`} />
      </button>
      {isSelected && <div className="absolute top-3 left-3 bg-indigo-600 text-white p-1.5 rounded-lg shadow-lg animate-in zoom-in-50"><Check className="w-4 h-4" /></div>}
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
      if (data.length === 0) setError("AI không tìm thấy ảnh nào. Hãy đảm bảo thư mục đang ở chế độ công khai.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (name: string) => {
    setSelectedFiles(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]);
  };

  const copyList = () => {
    navigator.clipboard.writeText(selectedFiles.map(n => n.split('.')[0]).join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg"><Camera className="w-5 h-5 text-white" /></div>
          <span className="font-bold tracking-tight text-lg">LensSelect</span>
        </div>
        <nav className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button onClick={() => setViewMode('client')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'client' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Khách hàng</button>
          <button onClick={() => setViewMode('admin')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Thợ ảnh</button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-6xl flex-1">
        {viewMode === 'client' ? (
          <div className="space-y-12">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">Thư viện ảnh của bạn</h2>
                <p className="text-slate-400">Dán link Drive và nhấn Quét để bắt đầu chọn ảnh.</p>
              </div>

              <div className="relative group">
                <input
                  type="text"
                  value={folderIdInput}
                  onChange={(e) => setFolderIdInput(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-2xl"
                />
                <button 
                  onClick={handleScan}
                  disabled={loading}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500 disabled:opacity-50 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  <span>{loading ? "Đang quét..." : "Quét bằng AI"}</span>
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-left">{error}</p>
                </div>
              )}
            </div>

            {files.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in duration-1000">
                {files.map(f => <PhotoCard key={f.id} file={f} isSelected={selectedFiles.includes(f.name)} onToggle={toggle} />)}
              </div>
            ) : !loading && (
              <div className="py-24 flex flex-col items-center opacity-20"><Grid className="w-16 h-16 mb-4" /><p>Chưa có dữ liệu</p></div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/5 shadow-xl">
              <div>
                <h3 className="text-xl font-bold">Danh sách ảnh khách chọn</h3>
                <p className="text-slate-400 text-sm">Số lượng: {selectedFiles.length}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.confirm("Xóa?") && setSelectedFiles([])} className="p-3 bg-white/5 rounded-xl hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                <button onClick={copyList} disabled={selectedFiles.length === 0} className="px-6 bg-indigo-600 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500 disabled:opacity-50 transition-all">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Đã chép" : "Copy tên file"}</span>
                </button>
              </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-3xl border border-white/5 p-6 min-h-[300px]">
              {selectedFiles.length > 0 ? (
                <div className="grid gap-2">
                  {selectedFiles.map((n, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                      <span className="font-mono text-sm text-slate-300">{n}</span>
                      <button onClick={() => toggle(n)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-slate-600 italic"><List className="w-10 h-10 mb-2 opacity-10" /><p>Khách chưa chọn ảnh nào</p></div>
              )}
            </div>
          </div>
        )}
      </main>

      {viewMode === 'client' && selectedFiles.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50">
          <button onClick={() => setViewMode('admin')} className="w-full bg-indigo-600 py-4 rounded-2xl shadow-2xl font-bold flex items-center justify-between px-8 border border-white/10 hover:bg-indigo-500 transition-all active:scale-95 text-white">
            <div className="flex items-center gap-3">
              <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">{selectedFiles.length}</span>
              <span>Ảnh đã chọn</span>
            </div>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
