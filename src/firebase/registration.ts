import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./index";
import type { EventRegistration } from "../types/registration";

export async function fetchUserRegistration(eventId: string, userId: string): Promise<{ isRegistered: boolean; registrationId: string | null }> {
  const registrationsQuery = query(
    collection(db, "registrations"),
    where("eventId", "==", eventId),
    where("userId", "==", userId),
    where("status", "==", "registered")
  );
  const userRegistration = await getDocs(registrationsQuery);
  
  return {
    isRegistered: !userRegistration.empty,
    registrationId: userRegistration.empty ? null : userRegistration.docs[0].id
  };
}

export async function fetchEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  const registrationsQuery = query(
    collection(db, "registrations"),
    where("eventId", "==", eventId)
  );
  const registrationsSnapshot = await getDocs(registrationsQuery);
  
  return registrationsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as EventRegistration[];
}

export async function fetchEventRegistrationsByGender(eventId: string): Promise<{ maleCount: number; femaleCount: number }> {
  const registrationsQuery = query(
    collection(db, "registrations"),
    where("eventId", "==", eventId),
    where("status", "==", "registered")
  );
  const allRegistrations = await getDocs(registrationsQuery);
  
  let maleCount = 0;
  let femaleCount = 0;
  
  for (const registration of allRegistrations.docs) {
    const userId = registration.data().userId;
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.gender === 'male') {
        maleCount++;
      } else if (userData.gender === 'female') {
        femaleCount++;
      }
    }
  }
  
  return { maleCount, femaleCount };
}

export async function createRegistration(registrationData: Omit<EventRegistration, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, "registrations"), registrationData);
  return docRef.id;
}

export async function cancelRegistration(eventId: string, userId: string): Promise<void> {
  const registrationsQuery = query(
    collection(db, "registrations"),
    where("eventId", "==", eventId),
    where("userId", "==", userId),
    where("status", "==", "registered")
  );
  
  const userRegistration = await getDocs(registrationsQuery);
  
  if (!userRegistration.empty) {
    const registrationDoc = userRegistration.docs[0];
    await deleteDoc(doc(db, "registrations", registrationDoc.id));
  }
}

export async function checkInUser(registrationId: string): Promise<void> {
  await updateDoc(doc(db, "registrations", registrationId), {
    status: 'checked-in',
    checkedInAt: new Date().toISOString()
  });
}