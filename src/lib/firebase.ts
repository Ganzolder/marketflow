// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "marketflow-ppnsi",
  "appId": "1:842514570418:web:7443c078d4621655ee7dab",
  "storageBucket": "marketflow-ppnsi.appspot.com",
  "apiKey": "AIzaSyAYrPT439yML2Wp34XrIGzeJyKy7C0FEKI",
  "authDomain": "marketflow-ppnsi.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "842514570418"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
