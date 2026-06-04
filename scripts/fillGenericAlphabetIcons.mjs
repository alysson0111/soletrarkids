import fs from "node:fs/promises";
import path from "node:path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const palette = [
  ["#ffe29b", "#6b4c00"],
  ["#b8ead6", "#123b2d"],
  ["#b9d8ff", "#163b68"],
  ["#ffd0d8", "#663041"],
  ["#cbe9a8", "#2f4b14"],
  ["#e9ddff", "#49356d"]
];

const exactIcons = new Map(Object.entries({
  banheiro: "🚽",
  brincar: "🧸",
  brinco: "💍",
  brinquedo: "🧸",
  coracao: "❤️",
  comer: "🍽️",
  cafe: "☕",
  caes: "🐶",
  caju: "🍈",
  cana: "🎋",
  cano: "🚰",
  capa: "📘",
  cara: "🙂",
  caso: "📄",
  cego: "🦯",
  ceia: "🍽️",
  cena: "🎬",
  cera: "🕯️",
  ceus: "☁️",
  chao: "🟫",
  cima: "⬆️",
  cipo: "🌿",
  coco: "🥥",
  cola: "🧴",
  cone: "🔺",
  dada: "🎲",
  dado: "🎲",
  dados: "🎲",
  dama: "👩",
  data: "📅",
  dedo: "☝️",
  deus: "✝️",
  dias: "📅",
  dica: "💡",
  doce: "🍬",
  dois: "2️⃣",
  dona: "👩",
  dono: "👨",
  dose: "💊",
  doze: "🔢",
  duas: "2️⃣",
  duna: "🏜️",
  dália: "🌸",
  escova: "🪥",
  ecoa: "🔊",
  ecoe: "🔊",
  ecoo: "🔊",
  ecos: "🔊",
  egua: "🐴",
  eixo: "🛞",
  euro: "💶",
  ebano: "🪵",
  ebrio: "🍷",
  edema: "🩹",
  educa: "📚",
  elege: "🗳️",
  eleva: "⬆️",
  familia: "👨‍👩‍👧",
  feliz: "😊",
  fono: "👂",
  fruta: "🍎",
  gato: "🐱",
  gelo: "🧊",
  gostei: "👍",
  grande: "⬆️",
  hora: "⏰",
  hospital: "🏥",
  hoje: "📅",
  higiene: "🧼",
  igreja: "⛪",
  ilha: "🏝️",
  imagem: "🖼️",
  janela: "🪟",
  jogo: "🎮",
  joelho: "🦵",
  leite: "🥛",
  livro: "📚",
  lapis: "✏️",
  lavar: "🧼",
  mamae: "👩",
  medo: "😟",
  nariz: "👃",
  noite: "🌙",
  nome: "🏷️",
  olho: "👁️",
  ouvir: "👂",
  obrigado: "🙏",
  onibus: "🚌",
  papai: "👨",
  pausa: "⏸️",
  professor: "📚",
  queijo: "🧀",
  quero: "☝️",
  quieto: "🤫",
  quente: "🔥",
  rua: "🛣️",
  roupa: "👕",
  respirar: "🌬️",
  rotina: "📋",
  sono: "🛏️",
  suco: "🧃",
  sentar: "🪑",
  sorrir: "😊",
  terapia: "🗣️",
  triste: "😢",
  tchau: "👋",
  tomar: "🥤",
  uva: "🍇",
  urso: "🧸",
  usar: "🧰",
  vovo: "👵",
  voltar: "↩️",
  wifi: "📶",
  web: "🌐",
  xicara: "☕",
  xarope: "💊",
  xadrez: "♟️",
  xilofone: "🎼",
  yoga: "🧘",
  yakult: "🥤",
  youtube: "▶️",
  yakisoba: "🍜",
  zebra: "🦓",
  zero: "0️⃣",
  ziper: "🤐",
  zoologico: "🦁"
}));

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

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function semanticIcon(word) {
  const key = wordKey(word);
  if (exactIcons.has(key)) return exactIcons.get(key);
  if (key.includes("agua")) return "💧";
  if (key.includes("casa")) return "🏠";
  if (key.includes("cama")) return "🛏️";
  if (key.includes("cao") || key.includes("cachorro")) return "🐶";
  if (key.includes("flor") || key.includes("rosa")) return "🌸";
  if (key.includes("sol")) return "☀️";
  if (key.includes("lua")) return "🌙";
  if (key.includes("mao")) return "✋";
  if (key.includes("pe")) return "🦶";
  if (key.includes("bola")) return "⚽";
  if (key.includes("banana")) return "🍌";
  if (key.includes("bebe")) return "👶";
  if (key.includes("dor")) return "🩹";
  if (key.includes("rei")) return "👑";
  if (key.includes("rainha")) return "👑";
  if (key.includes("rio")) return "🏞️";
  if (key.includes("mar")) return "🌊";
  if (key.includes("fogo")) return "🔥";
  if (key.includes("frio")) return "🧊";
  if (key.includes("quente")) return "🔥";
  return "";
}

async function createWordImage({ letter, word, index }) {
  const key = `${letter}-${wordKey(word) || index}`;
  const [background, ink] = palette[index % palette.length];
  const fileName = `${key}.svg`;
  const relativePath = `/images/word-icons/${fileName}`;
  const outputPath = path.join("public", "images", "word-icons", fileName);
  const title = xmlEscape(word);
  const initial = xmlEscape(String(word || letter).trim().charAt(0).toUpperCase());
  const safeWord = xmlEscape(String(word || "").slice(0, 18));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240" role="img" aria-label="${title}">
  <rect width="240" height="240" rx="28" fill="${background}"/>
  <circle cx="120" cy="86" r="52" fill="rgba(255,255,255,.72)"/>
  <text x="120" y="108" text-anchor="middle" font-family="Arial, sans-serif" font-size="76" font-weight="900" fill="${ink}">${initial}</text>
  <text x="120" y="178" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="${ink}">${safeWord}</text>
</svg>
`;
  await fs.writeFile(outputPath, svg, "utf8");
  return relativePath;
}

async function main() {
  await fs.mkdir(path.join("public", "images", "word-icons"), { recursive: true });
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
  const summary = [];
  let totalUpdated = 0;
  let semanticCount = 0;
  let generatedCount = 0;

  for (const letter of letters) {
    const ref = doc(db, "alfabeto", letter);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) continue;

    const currentWords = Array.isArray(snapshot.data().palavras) ? snapshot.data().palavras : [];
    let changed = false;
    const palavras = [];

    for (let index = 0; index < currentWords.length; index += 1) {
      const item = currentWords[index];
      const word = item.palavra || item.word || "";
      if (item.imagem && item.imagem !== "🔤") {
        palavras.push(item);
        continue;
      }

      const icon = semanticIcon(word);
      const imagem = icon || await createWordImage({ letter, word, index });
      if (icon) semanticCount += 1;
      else generatedCount += 1;
      totalUpdated += 1;
      changed = true;
      palavras.push({ ...item, imagem });
    }

    if (changed) {
      await setDoc(doc(db, "alfabeto_backups", `${letter}-before-icons-${Date.now()}`), {
        letra: letter,
        palavras: currentWords,
        origem: "fill:generic-alphabet-icons",
        criadoEm: new Date().toISOString()
      });
      await setDoc(ref, { palavras, atualizadoEm: new Date().toISOString() }, { merge: true });
      summary.push(`${letter}: ${palavras.filter((item, index) => item.imagem !== currentWords[index]?.imagem).length}`);
    }
  }

  console.log(`Atualizadas: ${totalUpdated}`);
  console.log(`Ícones semânticos: ${semanticCount}`);
  console.log(`Imagens geradas: ${generatedCount}`);
  console.log(summary.join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
