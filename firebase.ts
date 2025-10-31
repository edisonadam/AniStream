import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBAOfPGLgDUMKS-joXJdYX8kVIORODnuSg",
  authDomain: "anistream-c79ed.firebaseapp.com",
  projectId: "anistream-c79ed",
  storageBucket: "anistream-c79ed.appspot.com",
  messagingSenderId: "68995428871",
  appId: "1:68995428871:web:d7a1885698b64b1f66e51c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
