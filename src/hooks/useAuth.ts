import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('Auth state changed:', firebaseUser?.uid || 'null');

      if (firebaseUser) {
        try {
          console.log('Fetching user document for:', firebaseUser.uid);

          // Retry logic to handle race condition during signup
          let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let retries = 0;
          const maxRetries = 5;

          while (!userDoc.exists() && retries < maxRetries) {
            console.log(`User document not found, retry ${retries + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            retries++;
          }

          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            console.log('User data loaded:', userData);
            setUser({ id: firebaseUser.uid, ...userData });
          } else {
            console.error('User document does not exist after retries for:', firebaseUser.uid);
            // Sign out the user since they don't have a valid profile
            console.log('Signing out user with missing document');
            await auth.signOut();
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Sign out on error to prevent stuck state
          await auth.signOut();
          setUser(null);
        }
      } else {
        console.log('No authenticated user');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};