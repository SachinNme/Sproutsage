
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Button } from './Button';

const PROFILE_KEY = 'sproutsage_user_profile';

interface ProfileSettingsProps {
  onClose: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onClose }) => {
  const [profile, setProfile] = useState<UserProfile>({ name: 'Gardener', avatar: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    onClose();
    // Trigger a storage event manually if needed, or just let components re-render if we passed state up
    window.dispatchEvent(new Event('storage'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Gardener Profile</h2>
          <button onClick={onClose} className="hover:rotate-90 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-50 bg-emerald-100 flex items-center justify-center shadow-inner">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            <p className="text-xs text-slate-400">Click the camera to upload a photo</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Display Name</label>
            <input 
              type="text" 
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Enter your name"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleSave}>Save Profile</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
