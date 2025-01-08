import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtwIkCzEMtqZC0aoXkfrgWYMDUEv1eeaQ",
  authDomain: "terrabit-5d129.firebaseapp.com",
  projectId: "terrabit-5d129",
  storageBucket: "terrabit-5d129.appspot.com",
  messagingSenderId: "881590878214",
  appId: "1:881590878214:web:9cb2b606c7e13be7a90387",
  measurementId: "G-VSD5P41F0R",
};

// Initialize Firebase App
const firebaseApp = initializeApp(firebaseConfig);

// Export Storage
export const storage = getStorage(firebaseApp);
