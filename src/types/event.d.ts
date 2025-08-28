export interface SpeedDatingEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  startTime: string; // HH:MM format
  maxParticipants: number;
  ageRangeMin: number;
  ageRangeMax: number;
  registrationDeadline: string; // ISO date string
  createdAt: string;
  createdBy: string; // admin user ID
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
}