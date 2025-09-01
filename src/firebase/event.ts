import { doc, getDoc, collection, getDocs, addDoc, updateDoc, query, where, or, orderBy } from "firebase/firestore";
import { db } from "./index";
import type { SpeedDatingEvent } from "../types/event";

const eventsRef = collection(db, 'events');

export async function fetchEventById(eventId: string): Promise<SpeedDatingEvent | null> {
  const eventDoc = await getDoc(doc(db, "events", eventId));
  if (!eventDoc.exists()) {
    return null;
  }
  return { id: eventDoc.id, ...eventDoc.data() } as SpeedDatingEvent;
}

export async function fetchAllEvents(): Promise<SpeedDatingEvent[]> {
  const eventsSnapshot = await getDocs(query(eventsRef, orderBy('start')));
  return eventsSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  })) as SpeedDatingEvent[];
}

export async function fetchUpcomingEvents(): Promise<SpeedDatingEvent[]> {
  const upcomingEventsQuery = query(
    eventsRef,
    or(
      where("status", "==", "upcoming"),
      where("status", "==", "checking-in"),
      where("status", "==", "active")
    ),
    orderBy('start'),
  );
  
  const eventsSnapshot = await getDocs(upcomingEventsQuery);
  return eventsSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  })) as SpeedDatingEvent[];
}

export async function createEvent(eventData: Omit<SpeedDatingEvent, 'id'>): Promise<string> {
  const docRef = await addDoc(eventsRef, eventData);
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