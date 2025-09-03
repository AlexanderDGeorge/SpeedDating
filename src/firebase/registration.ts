import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./index";
import type { EventRegistration } from "../types/registration";
import type { User } from "../types";

const registrationsRef = collection(db, 'registrations');

export async function fetchUserRegistration(eventId: string, userId: string): Promise<EventRegistration | null> {
  const registrationsQuery = query(
    registrationsRef,
    where("eventId", "==", eventId),
    where("userId", "==", userId)
  );
  const userRegistration = await getDocs(registrationsQuery);
  const userRegistrationDoc = userRegistration.docs.at(0)
  if (!userRegistrationDoc?.exists()) {
    return null;
  }
  
  return { id: userRegistrationDoc.id, ...userRegistrationDoc.data() } as EventRegistration;
}

export async function fetchEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  const registrationsQuery = query(
    registrationsRef,
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
    registrationsRef,
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
  const docRef = await addDoc(registrationsRef, registrationData);
  return docRef.id;
}

export async function cancelRegistration(eventId: string, userId: string): Promise<void> {
  const registrationsQuery = query(
    registrationsRef,
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

export async function fetchEventPartners(eventId: string, user: User):Promise<User[]> {
  const registrationsQuery = query(
    registrationsRef,
    where("eventId", "==", eventId),
    where("status", "==", "checked-in")
  );

  const partners: User[] = [];
  const registrations = await getDocs(registrationsQuery);

  for (const registration of registrations.docs) {
    const partnerId = registration.data().userId;
    const partnerDoc = await getDoc(doc(db, "users", partnerId));

    if (partnerDoc.exists() && partnerId !== user.id) {
      const partner = { id: partnerId, ...partnerDoc.data() } as User;
      // Check if users are interested in each other's genders
      const userInterestedInPartner = 
        (user.interestedIn === 'men' && partner.gender === 'male') ||
        (user.interestedIn === 'women' && partner.gender === 'female') ||
        (user.interestedIn === 'other');
      
      const partnerInterestedInUser = 
        (partner.interestedIn === 'men' && user.gender === 'male') ||
        (partner.interestedIn === 'women' && user.gender === 'female') ||
        (partner.interestedIn === 'other');
      
      if (userInterestedInPartner && partnerInterestedInUser) {
        partners.push(partner)
      }
    }
  }

  return partners
}