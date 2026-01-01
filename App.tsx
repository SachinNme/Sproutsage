
import React, { useState, useEffect } from 'react';
import { AppTab, UserProfile, PlantCareInfo } from './types';
import { PlantIdentifier } from './components/PlantIdentifier';
import { GardeningChat } from './components/GardeningChat';
import { SavedPlants } from './components/SavedPlants';
import { ProfileSettings } from './components/ProfileSettings';

const PROFILE_KEY = 'sproutsage_user_profile';
const IDENTIFY_IMAGE_KEY = 'sproutsage_current_image';
const IDENTIFY_RESULT_KEY = 'sproutsage_current_result';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.IDENTIFY);
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'Gardener', avatar: null });
  
  // Persisted state for Identification tab - now with session persistence
  const [identifyImage, setIdentifyImage] = useState<string | null>(() => {
    return sessionStorage.getItem(IDENTIFY_IMAGE_KEY);
  });
  const [identifyResult, setIdentifyResult] = useState<PlantCareInfo | null>(() => {
    const saved = sessionStorage.getItem(IDENTIFY_RESULT_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  // Keep session storage in sync with identification state
  useEffect(() => {
    if (identifyImage) {
      sessionStorage.setItem(IDENTIFY_IMAGE_KEY, identifyImage);
    } else {
      sessionStorage.removeItem(IDENTIFY_IMAGE_KEY);
    }
  }, [identifyImage]);

  useEffect(() => {
    if (identifyResult) {
      sessionStorage.setItem(IDENTIFY_RESULT_KEY, JSON.stringify(identifyResult));
    } else {
      sessionStorage.removeItem(IDENTIFY_RESULT_KEY);
    }
  }, [identifyResult]);

  useEffect(() => {
    const loadProfile = () => {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        try {
          setUserProfile(JSON.parse(saved));
        } catch (e) {
          console.error("Profile parsing failed", e);
        }
      }
    };
    loadProfile();
    window.addEventListener('storage', loadProfile);
    return () => window.removeEventListener('storage', loadProfile);
  }, []);

  const handlePersistIdentification = (img: string | null, res: PlantCareInfo | null) => {
    setIdentifyImage(img);
    setIdentifyResult(res);
  };

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/30">
      {/* Top Header - Hidden on small mobile to save space, shown on Tablet/Desktop */}
      <header className="glass-effect sticky top-0 z-50 border-b border-emerald-100 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab(AppTab.IDENTIFY)}>
                <div className="bg-emerald-600 p-2 rounded-xl text-white group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.247 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent">SproutSage</h1>
              </div>

              <button 
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 p-1 pr-3 bg-white rounded-full hover:bg-emerald-50 transition-colors group border border-emerald-100 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-200 flex items-center justify-center border border-emerald-300">
                  {userProfile.avatar ? (
                    <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-semibold text-emerald-800">{userProfile.name}</span>
              </button>
            </div>

            <nav className="flex bg-slate-100/50 p-1 rounded-full border border-slate-200">
              <TabButton 
                active={activeTab === AppTab.IDENTIFY} 
                onClick={() => setActiveTab(AppTab.IDENTIFY)}
                label="Identify"
                icon={<IdentifyIcon />}
              />
              <TabButton 
                active={activeTab === AppTab.SAVED} 
                onClick={() => setActiveTab(AppTab.SAVED)}
                label="My Garden"
                icon={<SavedIcon />}
              />
              <TabButton 
                active={activeTab === AppTab.CHAT} 
                onClick={() => setActiveTab(AppTab.CHAT)}
                label="Expert Chat"
                icon={<ChatIcon />}
              />
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Top Header - Always visible on mobile */}
      <header className="sm:hidden glass-effect sticky top-0 z-50 border-b border-emerald-100 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-emerald-800">SproutSage</h1>
        <button 
          onClick={() => setShowProfile(true)}
          className="w-10 h-10 rounded-full overflow-hidden bg-emerald-200 border-2 border-white shadow-sm"
        >
          {userProfile.avatar ? (
            <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-full h-full p-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </button>
      </header>

      {/* Profile Settings Modal */}
      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}

      {/* Main Content Area */}
      <main className="flex-1 pb-24 sm:pb-8 pt-4 sm:pt-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === AppTab.IDENTIFY && (
            <PlantIdentifier 
              persistedImage={identifyImage}
              persistedResult={identifyResult}
              onPersistState={handlePersistIdentification}
            />
          )}
          {activeTab === AppTab.SAVED && <SavedPlants />}
          {activeTab === AppTab.CHAT && <GardeningChat />}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Visible only on mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 glass-effect border-t border-emerald-100 flex items-center justify-around pb-safe h-20 z-50">
        <MobileTabButton 
          active={activeTab === AppTab.IDENTIFY} 
          onClick={() => setActiveTab(AppTab.IDENTIFY)}
          label="Identify"
          icon={<IdentifyIcon />}
        />
        <MobileTabButton 
          active={activeTab === AppTab.SAVED} 
          onClick={() => setActiveTab(AppTab.SAVED)}
          label="Garden"
          icon={<SavedIcon />}
        />
        <MobileTabButton 
          active={activeTab === AppTab.CHAT} 
          onClick={() => setActiveTab(AppTab.CHAT)}
          label="Chat"
          icon={<ChatIcon />}
        />
      </nav>

      {/* Footer - Only visible on desktop/tablet to clean up mobile view */}
      <footer className="hidden sm:block py-8 border-t border-emerald-100 bg-emerald-50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-emerald-800/60 text-sm">
          <p>© {new Date().getFullYear()} SproutSage AI Gardening Assistant. Optimized for all platforms.</p>
        </div>
      </footer>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 font-semibold whitespace-nowrap ${
      active 
        ? 'bg-white text-emerald-800 shadow-sm border border-emerald-100 scale-105' 
        : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/30'
    }`}
  >
    <span className={active ? 'text-emerald-600' : ''}>{icon}</span>
    <span>{label}</span>
  </button>
);

const MobileTabButton = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
      active ? 'text-emerald-600' : 'text-slate-400'
    }`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
      {React.cloneElement(icon, { className: 'w-6 h-6' })}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

const IdentifyIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ChatIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const SavedIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;

export default App;
