import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "./index";
import type { Rating } from "../types/rating";

export type RatingType = 'not-interested' | 'maybe' | 'interested';

const ratingsRef = collection(db, 'ratings');

/**
 * Save a rating for a partner
 */
export async function saveRating(rating: Omit<Rating, 'id'>): Promise<void> {
  const ratingId = `${rating.userId}_${rating.partnerId}`;
  await setDoc(doc(db, "ratings", ratingId), rating);
}

/**
 * Get a specific rating between two users
 */
export async function getRating(userId: string, partnerId: string): Promise<Rating | null> {
  const ratingDoc = await getDoc(doc(db, "ratings", `${userId}_${partnerId}`));
  if (!ratingDoc.exists()) {
    return null;
  }
  return { id: ratingDoc.id, ...ratingDoc.data() } as Rating;
}

/**
 * Get all ratings made by a user
 */
export async function getUserRatings(userId: string): Promise<Rating[]> {
  const ratingsQuery = query(
    ratingsRef,
    where("userId", "==", userId)
  );
  const ratingsSnapshot = await getDocs(ratingsQuery);
  
  return ratingsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Rating[];
}

/**
 * Get all ratings for a specific event
 */
export async function getEventRatings(eventId: string): Promise<Rating[]> {
  const ratingsQuery = query(
    ratingsRef,
    where("eventId", "==", eventId)
  );
  const ratingsSnapshot = await getDocs(ratingsQuery);
  
  return ratingsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Rating[];
}

/**
 * Get ratings made by a user for a specific event
 */
export async function getUserEventRatings(userId: string, eventId: string): Promise<Rating[]> {
  const ratingsQuery = query(
    ratingsRef,
    where("userId", "==", userId),
    where("eventId", "==", eventId)
  );
  const ratingsSnapshot = await getDocs(ratingsQuery);
  
  return ratingsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Rating[];
}

/**
 * Check for mutual matches (both users rated each other as 'interested')
 */
export async function checkForMatch(userId: string, partnerId: string): Promise<boolean> {
  const userRating = await getRating(userId, partnerId);
  const partnerRating = await getRating(partnerId, userId);
  
  return userRating?.rating === 'interested' && partnerRating?.rating === 'interested';
}

/**
 * Get all mutual matches for a user
 */
export async function getUserMatches(userId: string): Promise<Rating[]> {
  // Get all ratings where user rated someone as 'interested'
  const userInterestedQuery = query(
    ratingsRef,
    where("userId", "==", userId),
    where("rating", "==", "interested")
  );
  const userInterestedSnapshot = await getDocs(userInterestedQuery);
  
  const matches: Rating[] = [];
  
  // Check each interested rating for mutual interest
  for (const ratingDoc of userInterestedSnapshot.docs) {
    const rating = { id: ratingDoc.id, ...ratingDoc.data() } as Rating;
    const isMatch = await checkForMatch(userId, rating.partnerId);
    if (isMatch) {
      matches.push(rating);
    }
  }
  
  return matches;
}

/**
 * Delete a rating
 */
export async function deleteRating(userId: string, partnerId: string): Promise<void> {
  await deleteDoc(doc(db, "ratings", `${userId}_${partnerId}`));
}

/**
 * Get all matches for a specific event
 */
export async function getEventMatches(eventId: string): Promise<{ userId: string; partnerId: string; }[]> {
  const eventRatings = await getEventRatings(eventId);
  const matches: { userId: string; partnerId: string; }[] = [];
  const checkedPairs = new Set<string>();
  
  for (const rating of eventRatings) {
    if (rating.rating === 'interested') {
      const pairKey = [rating.userId, rating.partnerId].sort().join('_');
      
      if (!checkedPairs.has(pairKey)) {
        checkedPairs.add(pairKey);
        const isMatch = await checkForMatch(rating.userId, rating.partnerId);
        if (isMatch) {
          matches.push({
            userId: rating.userId,
            partnerId: rating.partnerId
          });
        }
      }
    }
  }
  
  return matches;
}