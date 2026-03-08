// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Import Authentication and Database functions
import { 
    getAuth, 
    // GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged, 
    // signInWithPopup, 
    signOut } from "firebase/auth";
import { getDatabase, ref, set, update, push, get, onValue } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbFeXgec8gRr3MhGxM3TcL5xzBDhRV954",
  authDomain: "g0thier-project-datadriven.firebaseapp.com",
  databaseURL: "https://g0thier-project-datadriven-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "g0thier-project-datadriven",
  storageBucket: "g0thier-project-datadriven.firebasestorage.app",
  messagingSenderId: "326707760074",
  appId: "1:326707760074:web:4b563d7a8dce951f459d33"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth and Database instances
export const auth = getAuth(app);
export const database = getDatabase(app);


// Signing up with email and password
export const signUpWithEmail = async (email, password) => {
    await createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up 
            const user = userCredential.user;
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            // ..
        });
};

// Signing in with email and password
export const signInWithEmail = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            // ...
            console.log('User logged in successfully!', user);
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            // ..
            console.error('Login failed:', errorCode, errorMessage);
        });
};

/* Logging in with Google
export const login = async () => {
    const provider = new GoogleAuthProvider();
    const  result = await signInWithPopup(auth, provider);
    console.log('User info', result);
} */

// Logging out
export const logout = async () => {
    await signOut(auth);
    console.log('User logged out successfully!');
};

// Sending password reset email
export const resetPassword = async (email) => {
   await sendPasswordResetEmail(auth, email)
    .then(() => {
        // E-mail de réinitialisation envoyé avec succès !
        console.log("E-mail de réinitialisation envoyé.");
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // Gérer les erreurs ici (ex: utilisateur non trouvé)
        console.error("Erreur :", errorCode, errorMessage);
    });
};

// Listening to auth state changes
export const onAuthStateChangedListener = (callback) => {
    return onAuthStateChanged(auth, callback);
};