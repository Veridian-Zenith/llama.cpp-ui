// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBLaaMmwsw9ovJWHXBtMm8AQGp2wfFPHXw",
  authDomain: "main-website-ba2da.firebaseapp.com",
  projectId: "main-website-ba2da",
  storageBucket: "main-website-ba2da.firebasestorage.app",
  messagingSenderId: "602404282468",
  appId: "1:602404282468:web:44cd92321992e570793f71",
  measurementId: "G-M95PQ9YG43"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// @ts-ignore - analytics initialized for side-effect, used by Firebase
const analytics = getAnalytics(app);
void analytics;
