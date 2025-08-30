import { doc, getDoc, collection, getDocs, addDoc, updateDoc } from "firebase/firestore";
import { db } from "./index";
import type { SpeedDatingEvent } from "../types/event";

export async function fetchEventById(eventId: string): Promise<SpeedDatingEvent | null> {
  const eventDoc = await getDoc(doc(db, "events", eventId));
  if (!eventDoc.exists()) {
    return null;
  }
  return { id: eventDoc.id, ...eventDoc.data() } as SpeedDatingEvent;
}

export async function fetchAllEvents(): Promise<SpeedDatingEvent[]> {
  const eventsSnapshot = await getDocs(collection(db, "events"));
  return eventsSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  })) as SpeedDatingEvent[];
}

export async function fetchUpcomingEvents(): Promise<SpeedDatingEvent[]> {
  const eventsSnapshot = await getDocs(collection(db, "events"));
  const eventsData = eventsSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  })) as SpeedDatingEvent[];
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  return eventsData.filter(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= now;
  });
}

export async function createEvent(eventData: Omit<SpeedDatingEvent, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, "events"), eventData);
  return docRef.id;
}

export async function updateEvent(eventId: string, updates: Partial<SpeedDatingEvent>): Promise<void> {
  await updateDoc(doc(db, "events", eventId), updates);
}

export async function cancelEvent(eventId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, "events", eventId), {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
    cancelledBy: userId
  });
}

export async function getUpcomingAndPastEvents(): Promise<{ upcoming: SpeedDatingEvent[], past: SpeedDatingEvent[] }> {
  const eventsSnapshot = await getDocs(collection(db, "events"));
  const eventsData = eventsSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  })) as SpeedDatingEvent[];
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const upcoming = eventsData.filter(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= now;
  });
  
  const past = eventsData.filter(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < now;
  });
  
  return { upcoming, past };
}