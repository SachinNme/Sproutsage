
export interface PlantCareInfo {
  commonName: string;
  scientificName: string;
  description: string;
  watering: string;
  light: string;
  soil: string;
  temperature: string;
  humidity: string;
  potentialProblems: string[];
}

export interface PlantReminder {
  id: string;
  type: 'watering' | 'fertilizing' | 'pruning' | 'other';
  frequencyDays: number;
  lastCompleted: number; // timestamp
  nextDue: number; // timestamp
}

export interface SavedPlant extends PlantCareInfo {
  id: string;
  savedAt: number;
  reminders?: PlantReminder[];
}

export interface HistoryItem {
  id: string;
  plant: PlantCareInfo;
  image: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  avatar: string | null; // base64 string
}

export enum AppTab {
  IDENTIFY = 'identify',
  CHAT = 'chat',
  SAVED = 'saved'
}
