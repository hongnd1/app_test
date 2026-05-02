import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB6Tqgj1PqF8wcC4jAZU4A048mLgv4CGTk",
  authDomain: "blx-app-348b4.firebaseapp.com",
  projectId: "blx-app-348b4",
  storageBucket: "blx-app-348b4.firebasestorage.app",
  messagingSenderId: "880549597054",
  appId: "1:880549597054:web:c1c999f151b16913ddad2f",
  measurementId: "G-9571QHKDCN",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

export let analytics = null;

isSupported()
  .then((supported) => {
    if (supported) {
      analytics = getAnalytics(firebaseApp);
    }
  })
  .catch(() => {
    analytics = null;
  });
