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
  
  return eventsData.filter(event => {
    const eventDate = new Date(event.start);
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
  const upcoming = [] as SpeedDatingEvent[];
  const past = [] as SpeedDatingEvent[];
  
  eventsData.forEach(event => {
    const eventDate = new Date(event.start);
    if (eventDate >= now) {
      upcoming.push(event);
    } else {
      past.push(event);
    }
  });
  
  return { upcoming, past };
}