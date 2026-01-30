import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase config
const firebaseConfig = {

    apiKey: "AIzaSyBcZnHj3a-ew6pg_sxD2ogR12MjPpRjQrk",

    authDomain: "dashboard-c81a7.firebaseapp.com",

    projectId: "dashboard-c81a7",

    storageBucket: "dashboard-c81a7.firebasestorage.app",

    messagingSenderId: "291989021087",

    appId: "1:291989021087:web:ab63ec293f76ead6cfddaa"

};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
