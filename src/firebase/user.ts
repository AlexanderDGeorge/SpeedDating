import { doc, getDoc, getDocs, collection, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./index";
import type { User } from "../types";

export async function fetchUserById(userId: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) {
    return null;
  }
  return { id: userDoc.id, ...userDoc.data() } as User;
}

export async function fetchAllUsers(): Promise<User[]> {
  const usersSnapshot = await getDocs(collection(db, "users"));
  return usersSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter((user: any) => !user.isAdmin) as User[];
}

export async function createUser(userId: string, userData: Omit<User, 'id'>): Promise<void> {
  await setDoc(doc(db, "users", userId), userData);
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  await updateDoc(doc(db, "users", userId), updates);
}

export async function checkUserIsAdmin(userId: string): Promise<boolean> {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) {
    return false;
  }
  return userDoc.data().isAdmin === true;
}

export async function isProfileComplete(userId: string): Promise<boolean> {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) {
    return false;
  }
  
  const userData = userDoc.data();
  return !!(userData.name && userData.gender && userData.interestedIn && userData.birthday);
}