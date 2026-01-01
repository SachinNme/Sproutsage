
import React, { useState, useRef, useEffect } from 'react';
import { identifyPlant } from '../services/geminiService';
import { PlantCareInfo, HistoryItem } from '../types';
import { Button } from './Button';
import { CareCard } from './CareCard';

const HISTORY_KEY = 'sproutsage_scan_history';

interface PlantIdentifierProps {
  persistedImage: string | null;
  persistedResult: PlantCareInfo | null;
  onPersistState: (img: string | null, res: PlantCareInfo | null) => void;
}

export const PlantIdentifier: React.FC<PlantIdentifierProps> = ({ 
  persistedImage, 
  persistedResult, 
  onPersistState 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; type?: string } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Use props for image and result
  const image = persistedImage;
  const result = persistedResult;

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
        setHistory([]);
      }
    }
  }, []);

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const addToHistory = (plant: PlantCareInfo, img: string) => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      plant,
      image: img,
      timestamp: Date.now(),
    };
    const updatedHistory = [newItem, ...history].slice(0, 20); // Keep last 20
    saveHistory(updatedHistory);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.id !== id);
    saveHistory(updatedHistory);
  };

  const clearAllHistory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to clear your entire scan history?")) {
      saveHistory([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onPersistState(reader.result as string, null);
        setError(null);
        setIsCameraActive(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setError(null);
    try {
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        throw new Error('Camera access requires a secure (HTTPS) connection. Please try uploading a photo instead.');
      }

      const constraints: MediaStreamConstraints = { 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }, 
        audio: false 
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Video play failed", e));
        };
      }
      setIsCameraActive(true);
      // When starting camera, we don't clear the image until they actually snap a new one
    } catch (err: any) {
      console.error('Camera access error:', err);
      let message = 'Could not access camera. Please check your browser settings.';
      let type = 'general';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser settings.';
        type = 'permission';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera found on this device.';
        type = 'notfound';
      }

      setError({ message, type });
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onPersistState(dataUrl, null);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleIdentify = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const data = await identifyPlant(image);
      onPersistState(image, data);
      addToHistory(data, image);
    } catch (err: any) {
      setError({ message: err.message || 'Identification failed. Please try again with a clearer photo.' });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    onPersistState(null, null);
    setError(null);
    stopCamera();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-emerald-900 px-4">Identify a Plant</h2>
        <p className="text-slate-600 px-4">Snap a photo or upload an image to reveal its secrets.</p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl mx-4 animate-in slide-in-from-top-4">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 flex-shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="font-bold mb-1">Attention Required</p>
              <p className="text-sm leading-relaxed mb-3">{error.message}</p>
              <Button onClick={() => setError(null)} variant="secondary" className="!py-2 !px-4 !text-sm">Dismiss</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 px-4">
        {!image && !isCameraActive && (
          <div className="flex flex-col gap-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-emerald-200 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-100 transition-colors group h-64 sm:h-80 bg-white shadow-sm"
            >
              <div className="bg-emerald-100 p-6 rounded-full group-hover:bg-emerald-200 transition-colors">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="mt-4 text-emerald-800 font-bold text-lg">Upload a plant photo</p>
              <p className="text-emerald-500 text-sm">Tap here to choose from gallery</p>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            
            <div className="relative py-4 flex items-center">
              <div className="flex-grow border-t border-emerald-200"></div>
              <span className="flex-shrink mx-4 text-emerald-400 font-bold text-xs tracking-widest uppercase">OR USE CAMERA</span>
              <div className="flex-grow border-t border-emerald-200"></div>
            </div>

            <Button onClick={startCamera} variant="outline" className="w-full h-16 !text-lg !rounded-3xl border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 shadow-sm transition-all active:scale-95">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open Live Scan
            </Button>
          </div>
        )}

        {isCameraActive && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[400px] sm:h-[500px] bg-black group">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-white/40 rounded-3xl border-dashed"></div>
              </div>
              <div className="absolute bottom-8 inset-x-0 flex justify-center gap-6 px-6">
                <button onClick={stopCamera} className="bg-black/40 backdrop-blur-md p-4 rounded-full text-white hover:bg-black/60 transition-colors border border-white/20 shadow-lg active:scale-90">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <button onClick={capturePhoto} className="bg-white p-1 rounded-full hover:scale-105 active:scale-90 transition-all shadow-2xl">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-600 flex items-center justify-center">
                    <div className="w-12 h-12 bg-emerald-600 rounded-full"></div>
                  </div>
                </button>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {image && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl max-h-[500px] border border-emerald-100 bg-white">
              <img src={image} alt="Plant preview" className="w-full h-full object-contain max-h-[500px]" />
              <button onClick={reset} className="absolute top-4 right-4 bg-white/95 p-2 rounded-full hover:bg-white transition-colors shadow-lg border border-slate-200 active:scale-90">
                <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {!result && (
              <div className="flex justify-center pb-8">
                <Button onClick={handleIdentify} isLoading={loading} className="w-full sm:w-auto h-16 !px-12 !text-xl shadow-xl hover:translate-y-[-2px] active:translate-y-0 active:scale-95 transition-all">
                  Analyze This Plant
                </Button>
              </div>
            )}
          </div>
        )}

        {result && <CareCard plant={result} />}
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="pt-12 border-t border-emerald-100 space-y-6 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold text-emerald-900 tracking-tight">Recent Scans</h3>
            </div>
            <button 
              onClick={clearAllHistory}
              className="text-xs sm:text-sm font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 uppercase tracking-wider px-2 py-1 rounded-md hover:bg-rose-50"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {history.map((item) => (
              <div 
                key={item.id}
                onClick={() => {
                  onPersistState(item.image, item.plant);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-emerald-50"
              >
                <div className="aspect-square w-full overflow-hidden bg-slate-100">
                  <img src={item.image} alt={item.plant.commonName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">{item.plant.commonName}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(item.timestamp).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={(e) => deleteHistoryItem(item.id, e)}
                  className="absolute top-2 right-2 bg-black/50 backdrop-blur-md p-1.5 rounded-full text-white sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 shadow-lg"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
