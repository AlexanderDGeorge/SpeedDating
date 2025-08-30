export interface SpeedDatingEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO date string with date and time
  maleCapacity: number;
  femaleCapacity: number;
  ageRangeMin: number;
  ageRangeMax?: number;
  createdAt: string;
  createdBy: string; // admin user ID
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
}