import { db } from './config';
import { collection, getDocs } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to read from Firestore
    const querySnapshot = await getDocs(collection(db, 'solarReadings'));
    console.log('✅ Firebase connected successfully!');
    console.log(`Found ${querySnapshot.size} documents in solarReadings`);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};