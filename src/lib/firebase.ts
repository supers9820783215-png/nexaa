import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { ensureAdminAndDTSSSeeded } from "./seedAdmin.ts";

const firebaseConfig = {
  apiKey: "AIzaSyDRSOivNOiY_uYNbo0d87BeOENIIoHASlo",
  authDomain: "alumnexa-ada77.firebaseapp.com",
  projectId: "alumnexa-ada77",
  storageBucket: "alumnexa-ada77.firebasestorage.app",
  messagingSenderId: "271289253402",
  appId: "1:271289253402:web:07bba6dbc7868456ee9ba3",
  measurementId: "G-3PV4CFY3ZB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Seed DTSS College if not present
ensureAdminAndDTSSSeeded();

export default app;
