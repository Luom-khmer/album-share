
import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Settings, Eye, Heart, Copy, Check, Info, Trash2, ArrowRight, Share2, Loader2, List, X, Lock, ExternalLink, AlertTriangle, Key, Save, Clock } from 'lucide-react';
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
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  
  // API Key State
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);

  // Load Key from LocalStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('user_gemini_api_key');
    if (savedKey) setUserApiKey(savedKey);
    
    const savedSelected = localStorage.getItem('selected_filenames');
    if (savedSelected) setSelectedFiles(JSON.parse(savedSelected));
  }, []);

  // Save selection
  useEffect(() => {
    localStorage.setItem('selected_filenames', JSON.stringify(selectedFiles));
  }, [selectedFiles]);

  const saveApiKey = (key: string) => {
    const cleanKey = key.trim();
    localStorage.setItem('user_gemini_api_key', cleanKey);
    setUserApiKey(cleanKey);
    setShowKeyModal(false);
    setError(null);
  };

  const handleLoadFiles = async (input: string) => {
    const id = extractFolderId(input);
    if (!id) return;
    
    if (!userApiKey && !process.env.API_KEY) {
      setShowKeyModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { files: driveFiles } = await fetchDriveFilesViaGemini(id, userApiKey);
      setFiles(driveFiles);
      window.location.hash = id;
    } catch (err: any) {
      const msg = err.message || "";
      console.error("API Error:", err);

      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        setError(
          <div className="space-y-3">
            <p className="font-bold text-red-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Hết lượt sử dụng (Quota Exceeded)
            </p>
            <p className="text-xs opacity-90 leading-relaxed">
              Bạn đang dùng gói API miễn phí và đã vượt quá giới hạn yêu cầu/phút. 
              Vui lòng **đợi khoảng 1-2 phút** rồi thử lại, hoặc nâng cấp lên gói trả phí trong Google AI Studio.
            </p>
            <div className="flex gap-3 pt-1">
              <a href="https://aistudio.google.com/app/plan_management" target="_blank" className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition-all font-bold">
                Kiểm tra hạn mức
              </a>
            </div>
          </div>
        );
      } else if (msg.includes("API KEY")) {
        setError("Vui lòng nhập API Key để ứng dụng có thể quét ảnh từ Drive.");
        setShowKeyModal(true);
      } else if (msg.includes("403")) {
        setError("Lỗi 403: API Key của bạn cần được bật thanh toán (Billing) trên Google Cloud Console.");
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

  const isKeyReady = userApiKey || process.env.API_KEY;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div className="bg-indigo-600/20 p-3 rounded-2xl">
                <Key className="w-6 h-6 text-indigo-400" />
              </div>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Cấu hình API Key</h3>
              <p className="text-sm text-slate-400">Nhập mã khóa Google Gemini để sử dụng tính năng quét Drive. Key được lưu an toàn tại trình duyệt của bạn.</p>
            </div>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Dán API Key của bạn tại đây..."
                value={userApiKey}
                onChange={(e) => setUserApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
              />
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => saveApiKey(userApiKey)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Lưu cấu hình
                </button>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  className="text-center text-xs text-indigo-400 hover:underline flex items-center justify-center gap-1"
                >
                  Lấy API Key miễn phí <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="text-indigo-500 w-6 h-6" />
          <h1 className="text-lg font-bold hidden sm:block">LensSelect</h1>
        </div>
        <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
          <button onClick={() => setViewMode('client')} className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'client' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Khách hàng</button>
          <button onClick={() => setViewMode('admin')} className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Thợ ảnh</button>
        </nav>
        <button 
          onClick={() => setShowKeyModal(true)} 
          className={`p-2 rounded-xl transition-all border ${userApiKey ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
          title="Thiết lập API Key"
        >
          <Key className="w-5 h-5" />
        </button>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl flex-1 mb-24">
        {viewMode === 'client' ? (
          <div className="space-y-12">
            <div className="max-w-xl mx-auto text-center space-y-6">
              <h2 className="text-4xl font-black tracking-tight font-sans">Thư viện của bạn</h2>
              
              {!isKeyReady && (
                <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl space-y-4 animate-in slide-in-from-top duration-500">
                  <div className="flex items-center justify-center gap-3 text-indigo-400">
                    <Info className="w-6 h-6" />
                    <p className="font-bold">Ứng dụng cần API Key để hoạt động</p>
                  </div>
                  <p className="text-sm text-slate-400">Vui lòng nhập API Key để chúng tôi có thể tự động quét và hiển thị hình ảnh từ thư mục Google Drive của bạn.</p>
                  <button onClick={() => setShowKeyModal(true)} className="bg-indigo-600 px-6 py-2 rounded-xl font-bold hover:bg-indigo-500 transition-all">
                    Nhập API Key ngay
                  </button>
                </div>
              )}

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
                    <div className="flex-1">
                       <p className="text-sm font-bold mb-1">Cần chú ý:</p>
                       <div className="text-sm leading-relaxed opacity-90">{error}</div>
                    </div>
                  </div>
                  {typeof error === 'string' && error.includes("403") && (
                    <div className="pt-3 border-t border-red-500/10">
                      <p className="text-xs text-slate-500 mb-2">Lưu ý: Bạn cần một API Key từ dự án Google Cloud đã được cấu hình thanh toán để sử dụng tính năng Search (dùng để quét thư mục).</p>
                      <a href="https://console.cloud.google.com/billing" target="_blank" className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1">
                        Thiết lập Billing trên GCP <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
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
