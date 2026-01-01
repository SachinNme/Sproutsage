
import React, { useState } from 'react';
import { SavedPlant, PlantReminder } from '../types';
import { Button } from './Button';

interface ReminderModalProps {
  plant: SavedPlant;
  onSave: (reminders: PlantReminder[]) => void;
  onClose: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ plant, onSave, onClose }) => {
  const [reminders, setReminders] = useState<PlantReminder[]>(plant.reminders || []);
  const [newType, setNewType] = useState<PlantReminder['type']>('watering');
  const [newFreq, setNewFreq] = useState<number>(7);

  const handleAdd = () => {
    const now = Date.now();
    const newReminder: PlantReminder = {
      id: crypto.randomUUID(),
      type: newType,
      frequencyDays: newFreq,
      lastCompleted: now,
      nextDue: now + (newFreq * 24 * 60 * 60 * 1000),
    };
    setReminders([...reminders, newReminder]);
  };

  const handleRemove = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const handleComplete = (id: string) => {
    const now = Date.now();
    setReminders(reminders.map(r => {
      if (r.id === id) {
        return {
          ...r,
          lastCompleted: now,
          nextDue: now + (r.frequencyDays * 24 * 60 * 60 * 1000),
        };
      }
      return r;
    }));
  };

  const requestPermissionAndSave = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        onSave(reminders);
      } else {
        alert("Notification permission is required to receive reminders.");
        onSave(reminders); // Save anyway, maybe they just want the UI list
      }
    } else {
      onSave(reminders);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Care Reminders</h2>
            <p className="text-emerald-100 text-xs">{plant.commonName}</p>
          </div>
          <button onClick={onClose} className="hover:rotate-90 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Active Reminders</h3>
            {reminders.length === 0 ? (
              <p className="text-slate-400 text-sm italic py-4 text-center">No reminders set for this plant.</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {reminders.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        {r.type === 'watering' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.054.585l-2.16 2.16A2 2 0 003.146 20h13.708a2 2 0 001.707-3.414l-2.16-2.16z" /></svg>}
                        {r.type === 'fertilizing' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.247 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm capitalize">{r.type}</p>
                        <p className="text-[10px] text-slate-500">Every {r.frequencyDays} days • Next: {new Date(r.nextDue).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleComplete(r.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Mark done">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <button onClick={() => handleRemove(r.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Add New</h3>
            <div className="grid grid-cols-2 gap-3">
              <select 
                value={newType} 
                onChange={(e) => setNewType(e.target.value as any)}
                className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="watering">Watering</option>
                <option value="fertilizing">Fertilizing</option>
                <option value="pruning">Pruning</option>
                <option value="other">Other</option>
              </select>
              <div className="relative">
                <input 
                  type="number" 
                  value={newFreq}
                  onChange={(e) => setNewFreq(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  min="1"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">DAYS</span>
              </div>
            </div>
            <Button variant="outline" className="w-full !py-2.5 !text-sm" onClick={handleAdd}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Add Reminder
            </Button>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={requestPermissionAndSave}>Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
