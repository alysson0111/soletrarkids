import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, firebaseReady } from "./firebase";

export async function loadLetterWords(letter) {
  if (!firebaseReady) return null;

  const snapshot = await getDoc(doc(db, "alfabeto", letter));
  if (!snapshot.exists()) return null;

  const words = Array.isArray(snapshot.data().palavras) ? snapshot.data().palavras : [];
  return words.slice(0, 100).map((item) => ({
    word: item.palavra || item.word || "",
    icon: item.imagem || item.icon || "🔤",
    syllables: Array.isArray(item.silabas) ? item.silabas : []
  })).filter((item) => item.word);
}

export async function saveLetterWords(letter, words) {
  if (!firebaseReady) throw new Error("Firebase não configurado.");

  const palavras = words.slice(0, 100).map((item) => ({
    palavra: item.word,
    imagem: item.icon,
    silabas: item.syllables
  }));

  await setDoc(doc(db, "alfabeto", letter), { palavras }, { merge: true });
}
