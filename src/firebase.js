import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDkN0OnBAzA1cM-stGgScA3SXB6fENdDzU",
    authDomain: "cerebro-tecnico-pro.firebaseapp.com",
    projectId: "cerebro-tecnico-pro",
    storageBucket: "cerebro-tecnico-pro.firebasestorage.app",
    messagingSenderId: "825966750380",
    appId: "1:825966750380:web:a4d2c2fe29a7158050cd09"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };
