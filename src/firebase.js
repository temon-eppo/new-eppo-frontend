// configurações do firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDNLvHwltQsJtm251k4btBAM0qfgNoxmNA",
  authDomain: "eppo-obras-aef61.firebaseapp.com",
  projectId: "eppo-obras-aef61",
  storageBucket: "eppo-obras-aef61.firebasestorage.app",
  messagingSenderId: "928282155311",
  appId: "1:928282155311:web:318308521755bf950429da",
  measurementId: "G-RMQ91B5N56"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);