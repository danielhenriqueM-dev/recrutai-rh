import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export const defaultFirebaseConfig = {
  apiKey: "AIzaSyD-oTHBfenDAwXNyRPZab46G5GaTTkaT3U",
  authDomain: "recrutai-rh.firebaseapp.com",
  projectId: "recrutai-rh",
  storageBucket: "recrutai-rh.firebasestorage.app",
  messagingSenderId: "667762285343",
  appId: "1:667762285343:web:cce235a0d98a29c008ae2a"
};

let app: any = null;
let db: any = null;

export function getFirebaseApp() {
  try {
    if (!getApps().length) {
      app = initializeApp(defaultFirebaseConfig);
    } else {
      app = getApp();
    }
    return app;
  } catch (error) {
    console.warn('Firebase não inicializado ou operando em modo offline:', error);
    return null;
  }
}

export function getFirebaseFirestore() {
  try {
    if (!db) {
      const fbApp = getFirebaseApp();
      if (fbApp) {
        db = getFirestore(fbApp);
      }
    }
    return db;
  } catch (error) {
    console.warn('Firestore offline ou não configurado:', error);
    return null;
  }
}

/**
 * Função de sincronização com o Firestore
 */
export async function syncToFirestore(collectionName: string, items: Array<{ id: string } & Record<string, any>>) {
  const firestore = getFirebaseFirestore();
  if (!firestore) return false;

  try {
    for (const item of items) {
      if (item.id) {
        const docRef = doc(firestore, collectionName, item.id);
        await setDoc(docRef, item, { merge: true });
      }
    }
    return true;
  } catch (err) {
    console.error(`Erro ao sincronizar ${collectionName} com o Firestore:`, err);
    return false;
  }
}

/**
 * Função para puxar dados do Firestore
 */
export async function fetchFromFirestore(collectionName: string): Promise<any[]> {
  const firestore = getFirebaseFirestore();
  if (!firestore) return [];

  try {
    const colRef = collection(firestore, collectionName);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error(`Erro ao buscar dados de ${collectionName} no Firestore:`, err);
    return [];
  }
}
