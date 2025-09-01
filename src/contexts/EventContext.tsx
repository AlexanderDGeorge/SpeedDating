import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { SpeedDatingEvent } from '../types/event';
import type { EventRegistration } from '../types/registration';
import { fetchAllEvents, fetchUpcomingEvents } from '../firebase/event';
import { fetchUserRegistration, fetchEventRegistrationsByGender } from '../firebase/registration';
import { useAuth } from './AuthContext';

interface EventContextType {
  allEvents: SpeedDatingEvent[];
  upcomingEvents: SpeedDatingEvent[];
  userRegistrations: EventRegistration[];
  loading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
  refreshUserRegistrations: () => Promise<void>;
  getUserRegistrationForEvent: (eventId: string) => EventRegistration | null;
  getEventRegistrationCounts: (eventId: string) => Promise<{ maleCount: number; femaleCount: number }>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function useEvents() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
}

interface EventProviderProps {
  children: ReactNode;
}

export function EventProvider({ children }: EventProviderProps) {
  const [allEvents, setAllEvents] = useState<SpeedDatingEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<SpeedDatingEvent[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { currentUser } = useAuth();

  const refreshEvents = async () => {
    try {
      setError(null);
      const [allEventsData, upcomingEventsData] = await Promise.all([
        fetchAllEvents(),
        fetchUpcomingEvents()
      ]);
      
      setAllEvents(allEventsData);
      setUpcomingEvents(upcomingEventsData);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    }
  };

  const refreshUserRegistrations = async () => {
    if (!currentUser) {
      setUserRegistrations([]);
      return;
    }

    try {
      setError(null);
      const registrations: EventRegistration[] = [];
      
      // Fetch user registrations for all events
      for (const event of allEvents) {
        const registration = await fetchUserRegistration(event.id, currentUser.uid);
        if (registration) {
          registrations.push(registration);
        }
      }
      
      setUserRegistrations(registrations);
    } catch (err) {
      console.error('Error fetching user registrations:', err);
      setError('Failed to load user registrations');
    }
  };

  const getUserRegistrationForEvent = (eventId: string): EventRegistration | null => {
    return userRegistrations.find(reg => reg.eventId === eventId) || null;
  };

  const getEventRegistrationCounts = async (eventId: string): Promise<{ maleCount: number; femaleCount: number }> => {
    try {
      return await fetchEventRegistrationsByGender(eventId);
    } catch (err) {
      console.error('Error fetching registration counts:', err);
      return { maleCount: 0, femaleCount: 0 };
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await refreshEvents();
      setLoading(false);
    };

    loadInitialData();
  }, []);

  // Refresh user registrations when user changes or events change
  useEffect(() => {
    if (allEvents.length > 0) {
      refreshUserRegistrations();
    }
  }, [currentUser, allEvents]);

  const value = {
    allEvents,
    upcomingEvents,
    userRegistrations,
    loading,
    error,
    refreshEvents,
    refreshUserRegistrations,
    getUserRegistrationForEvent,
    getEventRegistrationCounts
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}