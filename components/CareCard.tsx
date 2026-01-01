
import React, { useState, useEffect } from 'react';
import { PlantCareInfo, SavedPlant } from '../types';

interface CareCardProps {
  plant: PlantCareInfo;
  onDelete?: (id: string) => void;
  isSavedMode?: boolean;
}

export const CareCard: React.FC<CareCardProps> = ({ plant, onDelete, isSavedMode }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('sproutsage_saved_plants') || '[]');
    setIsSaved(saved.some((p: SavedPlant) => p.commonName === plant.commonName && p.scientificName === plant.scientificName));
  }, [plant]);

  const handleSave = () => {
    const saved = JSON.parse(localStorage.getItem('sproutsage_saved_plants') || '[]');
    if (isSaved) {
      const filtered = saved.filter((p: SavedPlant) => !(p.commonName === plant.commonName && p.scientificName === plant.scientificName));
      localStorage.setItem('sproutsage_saved_plants', JSON.stringify(filtered));
      setIsSaved(false);
      if (isSavedMode && onDelete) {
        const plantId = (plant as SavedPlant).id;
        if (plantId) onDelete(plantId);
      }
    } else {
      const newPlant: SavedPlant = {
        ...plant,
        id: crypto.randomUUID(),
        savedAt: Date.now()
      };
      localStorage.setItem('sproutsage_saved_plants', JSON.stringify([...saved, newPlant]));
      setIsSaved(true);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Care Guide: ${plant.commonName}`,
      text: `Check out this SproutSage care guide for ${plant.commonName} (${plant.scientificName}):\n\n${plant.description}\n\nWatering: ${plant.watering}\nLight: ${plant.light}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share not supported');
      }
    } catch (error) {
      // Fallback: Copy to clipboard
      try {
        const shareText = `${shareData.title}\n\n${shareData.text}\n\nShared via SproutSage`;
        await navigator.clipboard.writeText(shareText);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 3000);
      } catch (clipboardError) {
        console.error('Clipboard fallback failed:', clipboardError);
        setShareStatus('error');
        setTimeout(() => setShareStatus('idle'), 3000);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 border border-emerald-100">
      <div className="bg-emerald-600 p-8 text-white relative">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-3xl sm:text-4xl font-bold">{plant.commonName}</h3>
            <p className="text-emerald-100 italic font-medium text-lg">{plant.scientificName}</p>
          </div>
          <button 
            onClick={handleSave}
            className={`p-3 rounded-2xl transition-all shadow-lg ${
              isSaved 
                ? 'bg-amber-400 text-white border-amber-300' 
                : 'bg-white/20 text-white border-white/30'
            } border hover:scale-110 active:scale-95`}
            title={isSaved ? "Remove from saved" : "Save to garden"}
          >
            <svg className="w-6 h-6" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
        
        <p className="mt-4 text-emerald-50 leading-relaxed text-lg max-w-2xl">{plant.description}</p>
        
        <div className="mt-6 flex flex-wrap gap-3">
          <button 
            onClick={handleShare}
            className={`flex items-center gap-2 px-4 py-2 backdrop-blur-md rounded-xl border transition-all text-sm font-semibold group shadow-lg ${
              shareStatus === 'copied' 
                ? 'bg-emerald-400 border-emerald-300 text-white' 
                : 'bg-white/20 hover:bg-white/30 border-white/30 text-white'
            }`}
          >
            {shareStatus === 'copied' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Guide Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Guide
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <CareItem icon={<WaterIcon />} label="Watering" text={plant.watering} color="text-blue-600" bgColor="bg-blue-50" />
          <CareItem icon={<SunIcon />} label="Light" text={plant.light} color="text-amber-600" bgColor="bg-amber-50" />
          <CareItem icon={<SoilIcon />} label="Soil" text={plant.soil} color="text-stone-600" bgColor="bg-stone-50" />
        </div>
        <div className="space-y-6">
          <CareItem icon={<TempIcon />} label="Temperature" text={plant.temperature} color="text-orange-600" bgColor="bg-orange-50" />
          <CareItem icon={<HumidityIcon />} label="Humidity" text={plant.humidity} color="text-cyan-600" bgColor="bg-cyan-50" />
          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
            <h4 className="text-rose-900 font-bold mb-3 flex items-center gap-2">
              <WarningIcon />
              Potential Problems
            </h4>
            <ul className="list-disc list-inside text-rose-800 space-y-1 text-sm md:text-base">
              {plant.potentialProblems.map((problem, i) => (
                <li key={i}>{problem}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const CareItem = ({ icon, label, text, color, bgColor }: any) => (
  <div className={`flex gap-4 p-6 rounded-2xl ${bgColor} border border-white/50 transition-transform hover:scale-[1.02]`}>
    <div className={`${color} bg-white p-3 rounded-xl shadow-sm h-fit flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-slate-900 mb-1">{label}</h4>
      <p className="text-slate-700 leading-relaxed text-sm md:text-base">{text}</p>
    </div>
  </div>
);

const WaterIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.054.585l-2.16 2.16A2 2 0 003.146 20h13.708a2 2 0 001.707-3.414l-2.16-2.16z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 3h.01M12 6h.01M8 3h.01M12 11h.01" /></svg>;
const SunIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>;
const SoilIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>;
const TempIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const HumidityIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const WarningIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
