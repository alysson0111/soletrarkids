import fs from "node:fs";
import { createRequire } from "node:module";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const require = createRequire(import.meta.url);
const wordsPt = require("words-pt");

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const vowels = "aeiouáéíóúâêôãõà";

const iconByWord = new Map([
  ["abelha", "🐝"],
  ["abacaxi", "🍍"],
  ["água", "💧"],
  ["amigo", "🧒"],
  ["avião", "✈️"],
  ["banana", "🍌"],
  ["bola", "⚽"],
  ["casa", "🏠"],
  ["cama", "🛏️"],
  ["dado", "🎲"],
  ["escola", "🎒"],
  ["estrela", "⭐"],
  ["família", "👨‍👩‍👧"],
  ["feliz", "😊"],
  ["gato", "🐱"],
  ["hora", "⏰"],
  ["janela", "🪟"],
  ["kiwi", "🥝"],
  ["leite", "🥛"],
  ["livro", "📚"],
  ["mamãe", "👩"],
  ["nariz", "👃"],
  ["olho", "👁️"],
  ["papai", "👨"],
  ["queijo", "🧀"],
  ["rua", "🛣️"],
  ["suco", "🧃"],
  ["uva", "🍇"],
  ["vovó", "👵"],
  ["web", "🌐"],
  ["xícara", "☕"],
  ["yoga", "🧘"],
  ["zebra", "🦓"]
]);

const manualSyllables = new Map([
  ["abelha", ["a", "be", "lha"]],
  ["abacaxi", ["a", "ba", "ca", "xi"]],
  ["água", ["á", "gua"]],
  ["amigo", ["a", "mi", "go"]],
  ["avião", ["a", "vi", "ão"]],
  ["banana", ["ba", "na", "na"]],
  ["bola", ["bo", "la"]],
  ["casa", ["ca", "sa"]],
  ["cama", ["ca", "ma"]],
  ["escola", ["es", "co", "la"]],
  ["estrela", ["es", "tre", "la"]],
  ["gato", ["ga", "to"]],
  ["janela", ["ja", "ne", "la"]],
  ["leite", ["lei", "te"]],
  ["livro", ["li", "vro"]],
  ["mamãe", ["ma", "mãe"]],
  ["papai", ["pa", "pai"]],
  ["queijo", ["quei", "jo"]],
  ["xícara", ["xí", "ca", "ra"]],
  ["zebra", ["ze", "bra"]]
]);

const priorityWords = {
  A: ["Abelha", "Abacaxi", "Água", "Amigo", "Avião"],
  B: ["Bola", "Banana", "Bebê", "Banheiro"],
  C: ["Casa", "Cama", "Coração", "Comer"],
  D: ["Dado", "Dente", "Dormir", "Dor"],
  E: ["Escola", "Escova", "Estrela", "Eu"],
  F: ["Família", "Feliz", "Fono", "Fruta"],
  G: ["Gato", "Gelo", "Gostei", "Grande"],
  H: ["Hora", "Hospital", "Hoje", "Higiene"],
  I: ["Igreja", "Ilha", "Imagem", "Ir"],
  J: ["Janela", "Jogo", "Joelho", "Junto"],
  K: ["Kiwi", "Karaokê", "Kart", "Ketchup"],
  L: ["Leite", "Livro", "Lápis", "Lavar"],
  M: ["Mamãe", "Mão", "Mais", "Medo"],
  N: ["Não", "Nariz", "Noite", "Nome"],
  O: ["Olho", "Ouvir", "Obrigado", "Ônibus"],
  P: ["Papai", "Pausa", "Pé", "Professor"],
  Q: ["Queijo", "Quero", "Quieto", "Quente"],
  R: ["Rua", "Roupa", "Respirar", "Rotina"],
  S: ["Sono", "Suco", "Sentar", "Sorrir"],
  T: ["Terapia", "Triste", "Tchau", "Tomar"],
  U: ["Uva", "Urso", "Usar", "Um"],
  V: ["Vovó", "Vovô", "Voltar", "Ver"],
  W: ["Wi-fi", "Web", "Walkie-talkie", "Waffle"],
  X: ["Xícara", "Xarope", "Xadrez", "Xilofone"],
  Y: ["Yoga", "Yakult", "YouTube", "Yakisoba"],
  Z: ["Zebra", "Zero", "Zíper", "Zoológico"]
};

const supplements = {
  K: [
    "Kauan", "Kauã", "Kaique", "Kaio", "Kadu", "Kátia", "Kelly", "Kelvin", "Kênia", "Kevin",
    "Kika", "Kiko", "Kombi", "Karatê", "Karina", "Karen", "Karla", "Karol", "Kleber", "Kléber",
    "Kleiton", "Kombi", "Kimono", "Kiosque", "Kiosk", "K-pop", "Kibe", "Kebab", "Ketchup", "Karaokê",
    "Kartódromo", "Kartista", "Kitesurf", "Kitesurfista", "Kit", "Kitnet", "Karatêca", "Kaiser", "Kafka", "Kant",
    "Kardec", "Kardecista", "Karma", "Kármico", "Kayak", "Kwai", "Karatê-do", "Karatê-gui", "Kendo", "Kenpo",
    "K-popers", "Krypton", "Kryptonita", "Kilim", "Kilt", "Kinzinho", "Kleberson", "Kleiton", "Kátio", "Krav-magá",
    "Kumon", "Kung-fu", "Kombucha", "Koa", "Karatista", "Kuwait", "Kuwaitiano", "Keniano", "Koala", "Kookaburra",
    "Kara", "Kellen", "Késia", "Kesia", "Keyla", "Kênya", "Kauane", "Kaiane", "Kailane", "Kamyla"
  ],
  W: [
    "Web", "Wi-fi", "Waffle", "Walkie-talkie", "Wagner", "Wesley", "William", "Wilson", "Wellington", "Wallace",
    "Wanda", "Wanessa", "Wendel", "Wanderson", "Washington", "Walmir", "Walter", "Weslley", "Willy", "Wilma",
    "WhatsApp", "Website", "Webcam", "Webdesign", "Webdesigner", "Webaula", "Webrádio", "Websérie", "Workshop", "Windsurf",
    "Windsurfista", "Watt", "Wolframio", "Wikipédia", "Wiki", "Wok", "Wombat", "Western", "Wanda", "Wandinha",
    "Walkman", "Whey", "Whey-protein", "Waleska", "Walesca", "Wandira", "Wander", "Wanderlei", "Wanderley", "Wagneriano",
    "Walace", "Waldemar", "Waldir", "Walmor", "Walquiria", "Walquíria", "Weslei", "Weslley", "Wesly", "Wiliam",
    "Willian", "Wilton", "Winchester", "Windows", "Wireless", "Webmail", "Webinar", "Webjornal", "Webloja", "Webtoon",
    "Waffleira", "Wagneriana", "Wellingtonia", "Waldete", "Wandeco", "Wando", "Warley", "Weber", "Wendelina", "Werner",
    "West", "Wicca", "Wiccano", "Windsor", "Wolfe", "Wolfgang", "Wolverine", "World", "Wurlitzer", "Wushu"
  ],
  Y: [
    "Yoga", "Yakult", "YouTube", "Yakisoba", "Yara", "Yasmin", "Yasmim", "Yago", "Yuri", "Ygor",
    "Youssef", "Yolanda", "Yohana", "Yohanna", "Yasmina", "Yaraí", "Ypê", "Ypiranga", "Youtuber", "Youtubers",
    "Yakisobaria", "Yin", "Yang", "Yin-yang", "Yen", "Yuan", "Yorkshire", "York", "Yale", "Yamaha",
    "Yakisobas", "Yakissoba", "Yakissobas", "Yakisobeiro", "Yakisobeira", "Yogurte", "Yogurtes", "Yogurteria", "Yogurtinho", "Yogaterapia",
    "Yogue", "Yoguim", "Yogueira", "Yogueiro", "Youtubinho", "Youtubizar", "Youtubização", "Youtubável", "Ytalo", "Ytala",
    "Yeda", "Yedda", "Ygorinho", "Yasmimzinha", "Yasminzinha", "Yohana", "Yohane", "Yanka", "Yasminy", "Ycaro",
    "Ycaro", "Yagozinho", "Yarinha", "Yurizinho", "Yuri", "Yure", "Yvone", "Yvonne", "Yvette", "Yuriã",
    "Yan", "Yandra", "Yane", "Yanka", "Yasmira", "Yasminha", "Yeda", "Yemanjá", "Iemanjá", "Yeshua",
    "Yas", "Yoyo", "Yo-yo", "Youtubista", "Youtubando", "Youtubada", "Youtubagem", "Youtubês", "Youtubiano", "Youtubiana",
    "Yakisobinha", "Yakultinho", "Yogazinha", "Yogão", "Yogui", "Yoguismo", "Yoganidra", "Yogalates", "Yogaterapeuta", "Yogaterapêutico",
    "Youtubera", "Youtubero", "Yogoteca", "Yogocentro", "Yogaclube", "Yogainfantil"
  ]
};

function readEnv() {
  const raw = fs.readFileSync(".env", "utf8");
  return Object.fromEntries(raw.split(/\r?\n/).filter(Boolean).map((line) => {
    const [key, ...value] = line.split("=");
    return [key.trim(), value.join("=").trim()];
  }));
}

function cleanWord(word) {
  return word.replace(/\s+/g, " ").trim();
}

function wordKey(word) {
  return cleanWord(word).toLowerCase();
}

function startsWithLetter(word, letter) {
  const normalized = cleanWord(word).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalized[0]?.toUpperCase() === letter;
}

function isGoodWord(word) {
  const cleaned = cleanWord(word);
  return cleaned.length >= 4 && cleaned.length <= 14 && /^[\p{L}]+$/u.test(cleaned);
}

function syllabify(word) {
  const cleaned = cleanWord(word).toLowerCase().replace(/-/g, "");
  if (cleaned.length <= 3) return [cleaned];

  const pieces = [];
  let current = "";

  for (let index = 0; index < cleaned.length; index += 1) {
    current += cleaned[index];
    const currentIsVowel = vowels.includes(cleaned[index]);
    const next = cleaned[index + 1];
    const nextNext = cleaned[index + 2];

    if (!next) continue;

    if (currentIsVowel && vowels.includes(next)) {
      pieces.push(current);
      current = "";
      continue;
    }

    if (currentIsVowel && next && nextNext && !vowels.includes(next) && vowels.includes(nextNext)) {
      pieces.push(current);
      current = "";
    }
  }

  if (current) pieces.push(current);
  return pieces.length ? pieces : [cleaned];
}

function entry(word) {
  const cleaned = cleanWord(word);
  return {
    palavra: cleaned,
    imagem: iconByWord.get(wordKey(cleaned)) || "🔤",
    silabas: manualSyllables.get(wordKey(cleaned)) || syllabify(cleaned)
  };
}

function uniqueWords(words) {
  const seen = new Set();
  return words.filter((word) => {
    const key = wordKey(word);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function initWords() {
  await new Promise((resolve, reject) => {
    wordsPt.init({ removeNames: true }, (error) => error ? reject(error) : resolve());
  });
}

function wordsForLetter(allWords, letter) {
  const priority = priorityWords[letter] || [];
  const supplement = [];
  const generated = allWords
    .filter((word) => startsWithLetter(word, letter) && isGoodWord(word) && syllabify(word).length >= 2)
    .sort((a, b) => a.length - b.length || a.localeCompare(b, "pt-BR"));

  return uniqueWords(priority.concat(supplement, generated))
    .filter((word) => isGoodWord(word) && syllabify(word).length >= 2)
    .slice(0, 100)
    .map(entry);
}

async function main() {
  const env = readEnv();
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
  });
  const db = getFirestore(app);

  await initWords();
  const allWords = wordsPt.getArray();

  for (const letter of letters) {
    const palavras = wordsForLetter(allWords, letter);
    const letterRef = doc(db, "alfabeto", letter);
    const currentSnapshot = await getDoc(letterRef);
    if (currentSnapshot.exists()) {
      await setDoc(doc(db, "alfabeto_backups", `${letter}-${Date.now()}`), {
        letra: letter,
        origem: "seed:alphabet",
        backupEm: new Date().toISOString(),
        dados: currentSnapshot.data()
      });
    }
    await setDoc(letterRef, { palavras, atualizadoEm: new Date().toISOString() }, { merge: true });
    console.log(`${letter}: ${palavras.length} palavras salvas`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
