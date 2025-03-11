import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "AIzaSyCcachY-6PWxaqcu3AQYi57LkZ3_EWYbS8",
  authDomain: "splitebill-c30e4.firebaseapp.com",
  projectId: "splitebill-c30e4",
  storageBucket: "splitebill-c30e4.firebasestorage.app",
  messagingSenderId: "1067817255614",
  appId: "1:1067817255614:android:696bbcb614e2de426654ef"
};

// Initialize Firebase if it hasn't been initialized yet
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();

export default firebase; 