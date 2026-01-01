
import React, { useState, useEffect } from 'react';
import { SavedPlant, PlantReminder } from '../types';
import { CareCard } from './CareCard';
import { ReminderModal } from './ReminderModal';

export const SavedPlants: React.FC = () => {
  const [savedPlants, setSavedPlants] = useState<SavedPlant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<SavedPlant | null>(null);
  const [reminderPlant, setReminderPlant] = useState<SavedPlant | null>(null);

  useEffect(() => {
    const loadPlants = () => {
      const saved = JSON.parse(localStorage.getItem('sproutsage_saved_plants') || '[]');
      setSavedPlants(saved.sort((a: SavedPlant, b: SavedPlant) => b.savedAt - a.savedAt));
    };
    loadPlants();

    // Background checker for notifications while app is open
    const interval = setInterval(() => {
      const now = Date.now();
      const saved = JSON.parse(localStorage.getItem('sproutsage_saved_plants') || '[]');
      saved.forEach((plant: SavedPlant) => {
        plant.reminders?.forEach(reminder => {
          // If due within the next hour and not notified yet in this session
          // We'll just simplify: if due <= now, trigger notification
          // Real apps use service workers for this when closed.
          if (reminder.nextDue <= now) {
            triggerNotification(plant, reminder);
          }
        });
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const triggerNotification = (plant: SavedPlant, reminder: PlantReminder) => {
    if (Notification.permission === "granted") {
      // Create a unique key to prevent duplicate notifications for the same reminder event
      const notificationKey = `notified_${reminder.id}_${reminder.nextDue}`;
      if (!sessionStorage.getItem(notificationKey)) {
        new Notification(`SproutSage: Care needed for ${plant.commonName}`, {
          body: `It's time for ${reminder.type}! (Scheduled every ${reminder.frequencyDays} days)`,
          icon: '/favicon.ico'
        });
        sessionStorage.setItem(notificationKey, "true");
      }
    }
  };

  const handleDelete = (id: string) => {
    const updated = savedPlants.filter(p => p.id !== id);
    localStorage.setItem('sproutsage_saved_plants', JSON.stringify(updated));
    setSavedPlants(updated);
    if (selectedPlant?.id === id) setSelectedPlant(null);
  };

  const handleUpdateReminders = (plantId: string, reminders: PlantReminder[]) => {
    const updated = savedPlants.map(p => {
      if (p.id === plantId) {
        return { ...p, reminders };
      }
      return p;
    });
    localStorage.setItem('sproutsage_saved_plants', JSON.stringify(updated));
    setSavedPlants(updated);
    setReminderPlant(null);
  };

  if (selectedPlant) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <button 
          onClick={() => setSelectedPlant(null)}
          className="flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-900 transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to My Garden
        </button>
        <CareCard plant={selectedPlant} onDelete={handleDelete} isSavedMode />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-emerald-900">My Garden</h2>
        <p className="text-slate-600">Manage your collection and stay on top of plant care.</p>
      </div>

      {savedPlants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedPlants.map((plant) => (
            <div 
              key={plant.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative"
              onClick={() => setSelectedPlant(plant)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                  </svg>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setReminderPlant(plant);
                    }}
                    className={`p-2 rounded-xl transition-colors ${plant.reminders?.length ? 'bg-amber-100 text-amber-600' : 'text-slate-300 hover:text-emerald-500'}`}
                    title="Set Care Reminders"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(plant.id);
                    }}
                    className="text-slate-300 hover:text-rose-500 p-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-1">{plant.commonName}</h3>
              <p className="text-emerald-600 font-medium italic text-sm mb-3">{plant.scientificName}</p>
              
              {plant.reminders && plant.reminders.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1">
                  {plant.reminders.slice(0, 2).map(r => (
                    <span key={r.id} className="px-2 py-0.5 bg-emerald-50 text-[10px] font-bold text-emerald-700 rounded-full border border-emerald-100 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      {r.type}
                    </span>
                  ))}
                  {plant.reminders.length > 2 && <span className="text-[10px] text-slate-400 font-medium self-center">+{plant.reminders.length - 2} more</span>}
                </div>
              )}

              <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed flex-grow">
                {plant.description}
              </p>
              
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Added {new Date(plant.savedAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  View Guide
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="bg-emerald-50 p-8 rounded-full">
            <svg className="w-16 h-16 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.247 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-emerald-900">Your Garden is Empty</h3>
          <p className="text-slate-500 max-w-sm">Identify plants and save them to build your personal botanical collection and set care reminders.</p>
        </div>
      )}

      {reminderPlant && (
        <ReminderModal 
          plant={reminderPlant} 
          onClose={() => setReminderPlant(null)} 
          onSave={(reminders) => handleUpdateReminders(reminderPlant.id, reminders)}
        />
      )}
    </div>
  );
};
