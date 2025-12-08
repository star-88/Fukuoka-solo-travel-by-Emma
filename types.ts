
export type TabId = 'prep' | 'day1' | 'day2' | 'day3' | 'day4' | 'day5' | 'shopping';

export interface TabConfig {
  id: TabId;
  label: string;
  subLabel?: string;
  dateStr?: string; // Format: YYYY-MM-DD
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export type TodoCategory = 'tasks' | 'carryOn' | 'checked';

export interface TodosState {
  tasks: TodoItem[];
  carryOn: TodoItem[];
  checked: TodoItem[];
}

export type Period = 'morning' | 'afternoon' | 'evening';
export type ItemType = 'activity' | 'dining';

export interface ItineraryItem {
  id: string;
  type: ItemType; // New field to distinguish between activity and dining
  date: string; // YYYY-MM-DD
  
  // Common fields
  title: string;
  link?: string; // Google Maps Link
  notes?: string;

  // Activity specific fields
  period?: Period; 
  time?: string;
  transport?: string;

  // Dining specific fields
  isReserved?: boolean;
  reservationTime?: string;
}

export interface ItineraryState {
  [date: string]: ItineraryItem[];
}

// --- Shopping List Types ---

export interface ShoppingItem {
  id: string;
  name: string;
  imageUrl?: string;
  checked: boolean;
}

export interface ShoppingAlbum {
  id: string;
  name: string;
  items: ShoppingItem[];
}