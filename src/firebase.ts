import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

// firebaseConfig は公開前提の識別子（秘密情報ではない）。
// アクセス制御はすべて firestore.rules で行う。
const firebaseConfig = {
  apiKey: 'AIzaSyBLFJiyA3etrChxYaIEI4vNX4SiBCtZk00',
  authDomain: 'mimamori-net.firebaseapp.com',
  projectId: 'mimamori-net',
  storageBucket: 'mimamori-net.firebasestorage.app',
  messagingSenderId: '314896610953',
  appId: '1:314896610953:web:208997cbfa5a0260d0b858',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// ローカル開発でエミュレータを使う場合: VITE_EMULATOR=1 npm run dev
if (import.meta.env.DEV && import.meta.env.VITE_EMULATOR) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, 'localhost', 8080)
}
