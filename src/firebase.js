import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyD75u4WOq8onUOV_iiM6v0cv7tvU_K4vR8",
    authDomain: "new-journey2.firebaseapp.com",
    projectId: "new-journey2",
    storageBucket: "new-journey2.firebasestorage.app",
    messagingSenderId: "1043628706152",
    appId: "1:1043628706152:web:a56fa6e5f754e09a17eedd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);
