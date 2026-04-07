import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8sqtK7IzVhyfZsNSScp6GNmKqeA7zpPk",
  authDomain: "bomb-defusal-2f3d3.firebaseapp.com",
  projectId: "bomb-defusal-2f3d3",
  storageBucket: "bomb-defusal-2f3d3.firebasestorage.app",
  messagingSenderId: "681414115603",
  appId: "1:681414115603:web:dd1ae44b303623a0f79ae6",
  measurementId: "G-TPETN0TWW0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
