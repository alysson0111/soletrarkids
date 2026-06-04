import fs from "node:fs/promises";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const wordsToRemove = `
baba
babe
babo
baça
baço
bafa
bafe
bafo
baga
bago
baía
bala
balé
bali
bana
bane
bani
bano
base
bata
bate
bati
bato
baús
beba
bebe
bebé
bebi
bebo
beco
bege
bela
belo
bera
beta
bibe
bica
bico
bidé
bife
bisa
bise
biso
boas
boba
bobo
boca
boda
bode
bóer
boga
boia
boie
boio
bois
boja
boje
bojo
bole
bolo
boné
boro
bota
bote
boto
boxe
breu
brio
broa
buço
bufa
bufe
bufo
bula
bule
buli
bulo
buxo
babai
babam
babão
babar
babas
babei
babel
babem
babes
babou
baças
bacia
bacio
baços
baeta
bafai
bafam
bafar
`;

async function readEnv() {
  const raw = await fs.readFile(".env", "utf8");
  return Object.fromEntries(raw.split(/\r?\n/).filter(Boolean).map((line) => {
    const [key, ...value] = line.split("=");
    return [key.trim(), value.join("=").trim()];
  }));
}

function wordKey(word) {
  return String(word || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
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
  const letter = "B";
  const ref = doc(db, "alfabeto", letter);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) throw new Error("Documento alfabeto/B não encontrado.");

  const currentWords = Array.isArray(snapshot.data().palavras) ? snapshot.data().palavras : [];
  const removeKeys = new Set(wordsToRemove.trim().split(/\s+/).map(wordKey));
  const keptWords = currentWords.filter((item) => !removeKeys.has(wordKey(item.palavra || item.word)));
  const removedWords = currentWords.filter((item) => removeKeys.has(wordKey(item.palavra || item.word)));
  const now = Date.now();

  await setDoc(doc(db, "alfabeto_backups", `${letter}-before-cleanup-${now}`), {
    letra: letter,
    palavras: currentWords,
    origem: "remove:letter-b-words",
    criadoEm: new Date(now).toISOString()
  });

  await setDoc(ref, {
    palavras: keptWords,
    atualizadoEm: new Date(now).toISOString()
  }, { merge: true });

  console.log(`Letra B limpa.`);
  console.log(`Antes: ${currentWords.length}`);
  console.log(`Removidas: ${removedWords.length}`);
  console.log(`Depois: ${keptWords.length}`);
  console.log(`Removidas encontradas: ${removedWords.map((item) => item.palavra || item.word).join(", ") || "nenhuma"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
