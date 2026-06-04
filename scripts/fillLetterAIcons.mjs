import fs from "node:fs/promises";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const icons = new Map([
  ["abelha", "🐝"],
  ["abacaxi", "🍍"],
  ["água", "💧"],
  ["amigo", "🧒"],
  ["avião", "✈️"],
  ["amor", "❤️"],
  ["amora", "/images/amora.svg"],
  ["alegria", "😄"],
  ["amizade", "🤝"],
  ["abacate", "🥑"],
  ["açaí", "🫐"],
  ["acai", "🫐"],
  ["arara", "🦜"],
  ["abajur", "💡"],
  ["agulha", "🪡"],
  ["andar", "🚶"],
  ["abrir", "🔓"],
  ["ajudar", "🆘"],
  ["ativar", "✅"],
  ["alegre", "😊"],
  ["adorável", "🥰"],
  ["adoravel", "🥰"],
  ["anel", "💍"],
  ["arroz", "🍚"]
]);

async function readEnv() {
  const raw = await fs.readFile(".env", "utf8");
  return Object.fromEntries(raw.split(/\r?\n/).filter(Boolean).map((line) => {
    const [key, ...value] = line.split("=");
    return [key.trim(), value.join("=").trim()];
  }));
}

function wordKey(word) {
  return word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
  const ref = doc(db, "alfabeto", "A");
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) throw new Error("Documento alfabeto/A não encontrado.");

  const palavras = (snapshot.data().palavras || []).map((item) => ({
    ...item,
    imagem: icons.get(wordKey(item.palavra || "")) || item.imagem || "🔤"
  }));

  await setDoc(ref, { palavras, atualizadoEm: new Date().toISOString() }, { merge: true });
  console.log(`Letra A atualizada com ícones em ${palavras.length} palavra(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
