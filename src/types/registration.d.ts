export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAge: number;
  userGender: string;
  userBio?: string;
  registeredAt: string;
  status: 'registered' | 'checked-in' | 'no-show' | 'cancelled';
  notes?: string;
}