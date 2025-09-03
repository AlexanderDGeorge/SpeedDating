export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  registeredAt: string;
  status: 'registered' | 'checked-in' | 'cancelled';
}