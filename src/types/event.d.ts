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
  status: 'upcoming' | 'checking-in' | 'active' | 'completed' | 'cancelled';
  startedAt?: string; // ISO date string when event was started
  startedBy?: string; // admin user ID who started the event
  completedAt?: string; // ISO date string when event was completed
  completedBy?: string; // admin user ID who completed the event
  cancelledAt?: string; // ISO date string when event was cancelled
  cancelledBy?: string; // admin user ID who cancelled the event
}