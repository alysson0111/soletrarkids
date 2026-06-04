import fs from "node:fs/promises";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

async function readEnv() {
  const raw = await fs.readFile(".env", "utf8");
  return Object.fromEntries(
    raw.split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [key, ...value] = line.split("=");
        return [key.trim(), value.join("=").trim()];
      })
  );
}

async function main() {
  const env = await readEnv();
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
  });
  const db = getFirestore(app);

  const palavras = [
    { palavra: "Abelha", imagem: "🐝", silabas: ["a", "be", "lha"] },
    { palavra: "Abacaxi", imagem: "🍍", silabas: ["a", "ba", "ca", "xi"] },
    { palavra: "Água", imagem: "💧", silabas: ["á", "gua"] },
    { palavra: "Amigo", imagem: "🧒", silabas: ["a", "mi", "go"] },
    { palavra: "Avião", imagem: "✈️", silabas: ["a", "vi", "ão"] }
  ];

  const currentRef = doc(db, "alfabeto", "A");
  const currentSnapshot = await getDoc(currentRef);
  if (currentSnapshot.exists()) {
    await setDoc(doc(db, "alfabeto_backups", `A-${Date.now()}`), {
      letra: "A",
      origem: "update:letter-a",
      backupEm: new Date().toISOString(),
      dados: currentSnapshot.data()
    });
  }

  await setDoc(currentRef, {
    palavras,
    atualizadoEm: new Date().toISOString()
  }, { merge: true });

  console.log("Letra A atualizada com 5 palavras.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
