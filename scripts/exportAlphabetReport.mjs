import fs from "node:fs/promises";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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

  const sections = ["# Relação de palavras por letra", ""];

  for (const letter of letters) {
    const snapshot = await getDoc(doc(db, "alfabeto", letter));
    const palavras = snapshot.exists() && Array.isArray(snapshot.data().palavras)
      ? snapshot.data().palavras
      : [];

    sections.push(`## Letra ${letter} (${palavras.length} palavras)`);
    sections.push("");

    if (!palavras.length) {
      sections.push("_Nenhuma palavra cadastrada._");
      sections.push("");
      continue;
    }

    palavras.forEach((item, index) => {
      const silabas = Array.isArray(item.silabas) ? item.silabas.join("-") : "";
      sections.push(`${index + 1}. ${item.palavra} ${item.imagem || ""} - ${silabas}`);
    });
    sections.push("");
  }

  await fs.mkdir("outputs", { recursive: true });
  await fs.writeFile("outputs/relacao-palavras-alfabeto.md", sections.join("\n"), "utf8");
  console.log("Relatório salvo em outputs/relacao-palavras-alfabeto.md");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
