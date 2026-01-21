/**
 * Firebase initialization and authentication for cloud sync
 *
 * This module handles Firebase Auth and provides the Firestore instance
 * for cloud league synchronization.
 */

import { initializeApp, type FirebaseApp } from "firebase/app";
import {
	getAuth,
	signInWithPopup,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut as firebaseSignOut,
	onAuthStateChanged,
	GoogleAuthProvider,
	type Auth,
	type User,
} from "firebase/auth";
import {
	getFirestore,
	type Firestore,
} from "firebase/firestore";
import { createNanoEvents } from "nanoevents";

// Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyBgfN6pDk6kwDl1lcGEMCkQdN1HUqJ8fnw",
	authDomain: "bbgm-2fb86.firebaseapp.com",
	projectId: "bbgm-2fb86",
	storageBucket: "bbgm-2fb86.firebasestorage.app",
	messagingSenderId: "631082495567",
	appId: "1:631082495567:web:3150c71b2cf84bc0d5443a",
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
	return firebaseConfig.apiKey !== "YOUR_API_KEY" &&
		firebaseConfig.projectId !== "YOUR_PROJECT_ID";
};

// Singleton instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Event emitter for auth state changes
export const authEmitter = createNanoEvents<{
	authStateChanged: (user: User | null) => void;
	signInError: (error: Error) => void;
	signOutComplete: () => void;
}>();

// Initialize Firebase (call this before using any Firebase features)
export const initializeFirebase = (): { app: FirebaseApp; auth: Auth; db: Firestore } => {
	if (!isFirebaseConfigured()) {
		throw new Error(
			"Firebase is not configured. Please add your Firebase credentials to src/ui/util/firebase.ts"
		);
	}

	if (!app) {
		app = initializeApp(firebaseConfig);
		auth = getAuth(app);
		db = getFirestore(app);

		// Listen for auth state changes
		onAuthStateChanged(auth, (user) => {
			authEmitter.emit("authStateChanged", user);

			// Store user ID for cross-tab/worker access
			if (user) {
				localStorage.setItem("cloudUserId", user.uid);
			} else {
				localStorage.removeItem("cloudUserId");
			}
		});
	}

	return { app, auth: auth!, db: db! };
};

// Get Firebase instances (throws if not initialized)
export const getFirebaseApp = (): FirebaseApp => {
	if (!app) {
		return initializeFirebase().app;
	}
	return app;
};

export const getFirebaseAuth = (): Auth => {
	if (!auth) {
		return initializeFirebase().auth;
	}
	return auth;
};

export const getFirebaseDb = (): Firestore => {
	if (!db) {
		return initializeFirebase().db;
	}
	return db;
};

// Get current user
export const getCurrentUser = (): User | null => {
	const authInstance = getFirebaseAuth();
	return authInstance.currentUser;
};

// Get current user ID
export const getCurrentUserId = (): string | null => {
	const user = getCurrentUser();
	return user?.uid ?? null;
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
	const authInstance = getFirebaseAuth();
	const provider = new GoogleAuthProvider();

	try {
		const result = await signInWithPopup(authInstance, provider);
		return result.user;
	} catch (error) {
		authEmitter.emit("signInError", error as Error);
		throw error;
	}
};

// Sign in with email/password
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
	const authInstance = getFirebaseAuth();

	try {
		const result = await signInWithEmailAndPassword(authInstance, email, password);
		return result.user;
	} catch (error) {
		authEmitter.emit("signInError", error as Error);
		throw error;
	}
};

// Create account with email/password
export const createAccount = async (email: string, password: string): Promise<User> => {
	const authInstance = getFirebaseAuth();

	try {
		const result = await createUserWithEmailAndPassword(authInstance, email, password);
		return result.user;
	} catch (error) {
		authEmitter.emit("signInError", error as Error);
		throw error;
	}
};

// Sign out
export const signOut = async (): Promise<void> => {
	const authInstance = getFirebaseAuth();

	try {
		await firebaseSignOut(authInstance);
		authEmitter.emit("signOutComplete");
	} catch (error) {
		throw error;
	}
};

// Check if user is signed in
export const isSignedIn = (): boolean => {
	return getCurrentUser() !== null;
};

// Wait for auth to be ready (useful on app startup)
export const waitForAuth = (): Promise<User | null> => {
	return new Promise((resolve) => {
		const authInstance = getFirebaseAuth();

		// If already have a user, resolve immediately
		if (authInstance.currentUser !== null) {
			resolve(authInstance.currentUser);
			return;
		}

		// Otherwise wait for the first auth state change
		const unsubscribe = onAuthStateChanged(authInstance, (user) => {
			unsubscribe();
			resolve(user);
		});
	});
};

// Subscribe to auth state changes
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
	return authEmitter.on("authStateChanged", callback);
};

// Get user display name
export const getUserDisplayName = (): string | null => {
	const user = getCurrentUser();
	return user?.displayName ?? user?.email ?? null;
};

// Get user email
export const getUserEmail = (): string | null => {
	const user = getCurrentUser();
	return user?.email ?? null;
};

// Get user's ID token for passing to worker
export const getUserIdToken = async (): Promise<string | null> => {
	const user = getCurrentUser();
	if (!user) return null;
	try {
		return await user.getIdToken();
	} catch (error) {
		console.error("Failed to get ID token:", error);
		return null;
	}
};

