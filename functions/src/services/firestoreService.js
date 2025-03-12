// javascript
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
export async function addGame(game) {
  const db = admin.firestore();
  const docRef = await db.collection('games').add(game.toMap());
  return docRef;
}