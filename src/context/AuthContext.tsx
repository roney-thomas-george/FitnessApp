import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import { demoStore, INITIAL_DEMO_USERS } from '../services/demoStore';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isDemo?: boolean;
}

export interface RegistrationPayload {
  displayName: string;
  email: string;
  requestedRole: 'user' | 'trainer';
  height?: number;
  currentWeight?: number;
  targetWeight?: number;
  fitnessGoal?: string;
  specialty?: string;
  bio?: string;
}

interface AuthContextType {
  currentUser: AppUser | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isTrainer: boolean;
  isUser: boolean;
  isActive: boolean;
  loading: boolean;
  effectiveRole: UserRole;
  googleAccessToken: string | null;
  setEffectiveRoleOverride: (role: UserRole | null) => void;
  signInWithGoogle: () => Promise<void>;
  connectGoogleDrive: () => Promise<string | null>;
  signInAsDemo: (demoRole: UserRole) => Promise<void>;
  registerAccount: (payload: RegistrationPayload) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ADMIN_EMAIL = 'byroney3@gmail.com';
const DEMO_STORAGE_KEY = 'pulsefit_active_demo_uid';
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

// In-memory access token cache (NOT stored in localStorage or sessionStorage as per security guidelines)
let cachedAccessToken: string | null = null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [effectiveRoleOverride, setEffectiveRoleOverride] = useState<UserRole | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        localStorage.removeItem(DEMO_STORAGE_KEY);
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isDemo: false,
        });

        // Try getting user profile
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);

          if (!userSnap.exists()) {
            const isSuper = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
            const initialRole: UserRole = isSuper ? 'admin' : 'user';

            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || `${user.uid}@example.com`,
              displayName: user.displayName || (isSuper ? 'Master Admin' : 'Fitness Member'),
              photoURL: user.photoURL || undefined,
              role: initialRole,
              requestedRole: initialRole,
              onboardingCompleted: isSuper ? true : false,
              isActive: true,
              height: 175,
              currentWeight: 75,
              createdAt: new Date().toISOString(),
            };

            await setDoc(userDocRef, newProfile);

            if (isSuper) {
              try {
                await setDoc(doc(db, 'admins', user.uid), {
                  uid: user.uid,
                  email: user.email,
                  grantedAt: new Date().toISOString(),
                });
              } catch {
                // ignore
              }
            }

            setUserProfile(newProfile);
          } else {
            const existingProfile = userSnap.data() as UserProfile;
            setUserProfile({
              ...existingProfile,
              onboardingCompleted: existingProfile.onboardingCompleted ?? true,
            });
          }
        } catch (error) {
          console.warn('Profile fetch notice:', error);
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Member',
            role: 'user',
            requestedRole: 'user',
            onboardingCompleted: false,
            isActive: true,
            height: 175,
            currentWeight: 75,
          });
        } finally {
          setLoading(false);
        }
      } else {
        // Clear cached OAuth token
        cachedAccessToken = null;
        setGoogleAccessToken(null);

        // Check if demo user was active
        const savedDemoUid = localStorage.getItem(DEMO_STORAGE_KEY);
        if (savedDemoUid) {
          const allDemo = demoStore.getUsers();
          const matched = allDemo.find((u) => u.uid === savedDemoUid);
          if (matched) {
            setCurrentUser({
              uid: matched.uid,
              email: matched.email,
              displayName: matched.displayName,
              isDemo: true,
            });
            setUserProfile(matched);
            setLoading(false);
            return;
          }
        }

        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Live listener for real Firestore users
  useEffect(() => {
    if (!currentUser || currentUser.isDemo) return;

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const unsubscribeDoc = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          }
        },
        (error) => {
          console.warn('Profile listener notice:', error);
        }
      );
      return () => unsubscribeDoc();
    } catch {
      // ignore
    }
  }, [currentUser]);

  const getAuthErrorCode = (err: unknown): string => {
    if (err && typeof err === 'object' && 'code' in err) {
      return String((err as { code?: unknown }).code || '');
    }
    return '';
  };

  const formatAuthError = (err: unknown): Error => {
    const code = getAuthErrorCode(err);
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return new Error('Google sign-in popup was closed before completing. Please try again or use an instant Demo Role below.');
    }
    if (code === 'auth/popup-blocked') {
      return new Error('Browser blocked the Google sign-in popup. Please allow popups for this site or use a Demo Role below.');
    }
    if (code === 'auth/unauthorized-domain') {
      return new Error('Google sign-in is unavailable on this preview domain. Please use one of the instant Demo Roles below.');
    }
    return err instanceof Error ? err : new Error('Google sign-in could not be completed.');
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    localStorage.removeItem(DEMO_STORAGE_KEY);
    const provider = new GoogleAuthProvider();
    provider.addScope(DRIVE_SCOPE);
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        setGoogleAccessToken(credential.accessToken);
      }
    } catch (err: unknown) {
      const code = getAuthErrorCode(err);
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-blocked'
      ) {
        console.warn('Google Sign-in popup dismissed or blocked:', code);
      } else {
        console.warn('Google Sign-in notice:', err);
      }
      throw formatAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleDrive = async (): Promise<string | null> => {
    const provider = new GoogleAuthProvider();
    provider.addScope(DRIVE_SCOPE);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        setGoogleAccessToken(credential.accessToken);
        return credential.accessToken;
      }
      return null;
    } catch (err: unknown) {
      const code = getAuthErrorCode(err);
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        console.warn('Google Drive popup dismissed by user:', code);
        return null;
      }
      console.warn('Google Drive connection notice:', err);
      throw formatAuthError(err);
    }
  };

  const signInAsDemo = async (demoRole: UserRole) => {
    setLoading(true);
    try {
      const demoUsers = demoStore.getUsers();
      const target =
        demoUsers.find((u) => u.role === demoRole) ||
        INITIAL_DEMO_USERS.find((u) => u.role === demoRole) ||
        INITIAL_DEMO_USERS[0];

      localStorage.setItem(DEMO_STORAGE_KEY, target.uid);

      setCurrentUser({
        uid: target.uid,
        email: target.email,
        displayName: target.displayName,
        isDemo: true,
      });
      setUserProfile({
        ...target,
        onboardingCompleted: target.onboardingCompleted ?? true,
      });
      setEffectiveRoleOverride(null);
    } finally {
      setLoading(false);
    }
  };

  const registerAccount = async (payload: RegistrationPayload): Promise<UserProfile> => {
    setLoading(true);
    try {
      const existingUsers = demoStore.getUsers();
      const cleanEmail = payload.email.trim().toLowerCase();
      const existing = existingUsers.find((u) => u.email.toLowerCase() === cleanEmail);

      const newProfile: UserProfile = existing
        ? {
            ...existing,
            displayName: payload.displayName.trim() || existing.displayName,
            requestedRole: payload.requestedRole,
            height: payload.height || existing.height || 175,
            currentWeight: payload.currentWeight || existing.currentWeight || 75,
            targetWeight: payload.targetWeight || existing.targetWeight,
            fitnessGoal: payload.fitnessGoal || existing.fitnessGoal,
            specialty: payload.specialty || existing.specialty,
            bio: payload.bio || existing.bio,
            onboardingCompleted: true,
            updatedAt: new Date().toISOString(),
          }
        : {
            uid: `demo-reg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            email: cleanEmail,
            displayName: payload.displayName.trim(),
            // New users start with Client ('user') access while Admin reviews/assigns Trainer access if requested
            role: 'user',
            requestedRole: payload.requestedRole,
            onboardingCompleted: true,
            isActive: true,
            trainerId: payload.requestedRole === 'user' ? 'demo-trainer-uid' : undefined,
            height: payload.height || 175,
            currentWeight: payload.currentWeight || 75,
            targetWeight: payload.targetWeight,
            fitnessGoal: payload.fitnessGoal,
            specialty: payload.specialty,
            bio: payload.bio,
            createdAt: new Date().toISOString(),
          };

      demoStore.saveUser(newProfile);
      localStorage.setItem(DEMO_STORAGE_KEY, newProfile.uid);

      setCurrentUser({
        uid: newProfile.uid,
        email: newProfile.email,
        displayName: newProfile.displayName,
        isDemo: true,
      });
      setUserProfile(newProfile);
      setEffectiveRoleOverride(null);
      return newProfile;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    cachedAccessToken = null;
    setGoogleAccessToken(null);
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setEffectiveRoleOverride(null);
    setCurrentUser(null);
    setUserProfile(null);
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;

    if (currentUser.isDemo) {
      const updated = { ...userProfile, ...data, updatedAt: new Date().toISOString() };
      demoStore.saveUser(updated);
      setUserProfile(updated);
      return;
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
    } catch (error) {
      console.warn('Profile update notice:', error);
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
    }
  };

  const baseRole: UserRole = userProfile?.role || 'user';
  const effectiveRole: UserRole = effectiveRoleOverride || baseRole;
  const isActive = userProfile?.isActive ?? true;

  const isAdmin = effectiveRole === 'admin';
  const isTrainer = effectiveRole === 'trainer';
  const isUser = effectiveRole === 'user';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role: baseRole,
        effectiveRole,
        setEffectiveRoleOverride,
        googleAccessToken,
        isAdmin,
        isTrainer,
        isUser,
        isActive,
        loading,
        signInWithGoogle,
        connectGoogleDrive,
        signInAsDemo,
        registerAccount,
        signOut,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
