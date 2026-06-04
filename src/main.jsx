import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { getAuth } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { loadLetterWords, saveLetterWords } from "./alphabetRepository";
import { auth, db, firebaseConfig } from "./firebase";
import "./styles.css";

const categories = [
  { id: "all", label: "Tudo" },
  { id: "want", label: "Quero" },
  { id: "need", label: "Preciso" },
  { id: "feel", label: "Sinto" },
  { id: "routine", label: "Rotina" },
  { id: "people", label: "Pessoas" }
];

const baseSymbols = [
  ["want", "Quero água", "💧", "c-want"], ["want", "Quero comer", "🍽️", "c-want"],
  ["want", "Quero brincar", "🧩", "c-want"], ["want", "Quero pausa", "⏸️", "c-want"],
  ["want", "Mais", "➕", "c-want"], ["want", "Acabou", "✅", "c-want"],
  ["need", "Banheiro", "🚽", "c-need"], ["need", "Dor", "🩹", "c-need"],
  ["need", "Ajuda", "🆘", "c-need"], ["need", "Sono", "🛏️", "c-need"],
  ["need", "Muito barulho", "🔇", "c-need"], ["need", "Abraço forte", "🤗", "c-need"],
  ["feel", "Feliz", "😊", "c-feel"], ["feel", "Triste", "😢", "c-feel"],
  ["feel", "Bravo", "😠", "c-feel"], ["feel", "Medo", "😟", "c-feel"],
  ["feel", "Cansado", "😴", "c-feel"], ["feel", "Calmo", "🙂", "c-feel"],
  ["routine", "Primeiro", "1️⃣", "c-routine"], ["routine", "Depois", "2️⃣", "c-routine"],
  ["routine", "Escola", "🎒", "c-routine"], ["routine", "Terapia", "🗣️", "c-routine"],
  ["routine", "Banho", "🛁", "c-routine"], ["routine", "Dormir", "🌙", "c-routine"],
  ["people", "Mamãe", "👩", "c-people"], ["people", "Papai", "👨", "c-people"],
  ["people", "Professor", "📚", "c-people"], ["people", "Amigo", "🧒", "c-people"],
  ["people", "Fono", "👂", "c-people"], ["people", "Eu", "☝️", "c-people"]
].map(([category, text, icon, color]) => ({ category, text, icon, color }));

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const vowels = ["A", "E", "I", "O", "U"];
const syllableLetters = ["B", "C", "D", "F", "G", "J", "L", "M", "N", "P", "R", "S", "T", "V", "X", "Z", "Ç"];
const alphabetWords = {
  A: [["Abelha", "🐝"], ["Abacaxi", "🍍"], ["Água", "💧"], ["Amigo", "🧒"], ["Avião", "✈️"]],
  B: [["Bola", "⚽"], ["Banana", "🍌"], ["Bebê", "👶"], ["Banheiro", "🚽"]],
  C: [["Casa", "🏠"], ["Cama", "🛏️"], ["Coração", "❤️"], ["Comer", "🍽️"]],
  D: [["Dado", "🎲"], ["Dente", "🦷"], ["Dormir", "🌙"], ["Dor", "🩹"]],
  E: [["Escola", "🎒"], ["Escova", "🪥"], ["Estrela", "⭐"], ["Eu", "☝️"]],
  F: [["Família", "👨‍👩‍👧"], ["Feliz", "😊"], ["Fono", "👂"], ["Fruta", "🍎"]],
  G: [["Gato", "🐱"], ["Gelo", "🧊"], ["Gostei", "👍"], ["Grande", "⬆️"]],
  H: [["Hora", "⏰"], ["Hospital", "🏥"], ["Hoje", "📅"], ["Higiene", "🧼"]],
  I: [["Igreja", "⛪"], ["Ilha", "🏝️"], ["Imagem", "🖼️"], ["Ir", "➡️"]],
  J: [["Janela", "🪟"], ["Jogo", "🎮"], ["Joelho", "🦵"], ["Junto", "🤝"]],
  K: [["Kiwi", "🥝"], ["Karaokê", "🎤"], ["Kart", "🏎️"], ["Ketchup", "🍅"]],
  L: [["Leite", "🥛"], ["Livro", "📚"], ["Lápis", "✏️"], ["Lavar", "🧼"]],
  M: [["Mamãe", "👩"], ["Mão", "✋"], ["Mais", "➕"], ["Medo", "😟"]],
  N: [["Não", "🙅"], ["Nariz", "👃"], ["Noite", "🌙"], ["Nome", "🏷️"]],
  O: [["Olho", "👁️"], ["Ouvir", "👂"], ["Obrigado", "🙏"], ["Ônibus", "🚌"]],
  P: [["Papai", "👨"], ["Pausa", "⏸️"], ["Pé", "🦶"], ["Professor", "📚"]],
  Q: [["Queijo", "🧀"], ["Quero", "☝️"], ["Quieto", "🤫"], ["Quente", "🔥"]],
  R: [["Rua", "🛣️"], ["Roupa", "👕"], ["Respirar", "🌬️"], ["Rotina", "📋"]],
  S: [["Sono", "🛏️"], ["Suco", "🧃"], ["Sentar", "🪑"], ["Sorrir", "😊"]],
  T: [["Terapia", "🗣️"], ["Triste", "😢"], ["Tchau", "👋"], ["Tomar", "🥤"]],
  U: [["Uva", "🍇"], ["Urso", "🧸"], ["Usar", "🧰"], ["Um", "1️⃣"]],
  V: [["Vovó", "👵"], ["Vovô", "👴"], ["Voltar", "↩️"], ["Ver", "👀"]],
  W: [["Wi-fi", "📶"], ["Web", "🌐"], ["Walkie-talkie", "📻"], ["Waffle", "🧇"]],
  X: [["Xícara", "☕"], ["Xarope", "💊"], ["Xadrez", "♟️"], ["Xilofone", "🎼"]],
  Y: [["Yoga", "🧘"], ["Yakult", "🥤"], ["YouTube", "▶️"], ["Yakisoba", "🍜"]],
  Z: [["Zebra", "🦓"], ["Zero", "0️⃣"], ["Zíper", "🤐"], ["Zoológico", "🦁"]]
};

const syllableMap = {
  abacaxi: ["a", "ba", "ca", "xi"],
  abelha: ["a", "be", "lha"],
  agua: ["á", "gua"],
  amigo: ["a", "mi", "go"],
  aviao: ["a", "vi", "ão"],
  bola: ["bo", "la"],
  banana: ["ba", "na", "na"],
  bebe: ["be", "bê"],
  banheiro: ["ba", "nhei", "ro"],
  casa: ["ca", "sa"],
  cama: ["ca", "ma"],
  coracao: ["co", "ra", "ção"],
  comer: ["co", "mer"],
  dado: ["da", "do"],
  dente: ["den", "te"],
  dormir: ["dor", "mir"],
  dor: ["dor"],
  escola: ["es", "co", "la"],
  escova: ["es", "co", "va"],
  estrela: ["es", "tre", "la"],
  eu: ["eu"],
  familia: ["fa", "mí", "lia"],
  feliz: ["fe", "liz"],
  fono: ["fo", "no"],
  fruta: ["fru", "ta"],
  gato: ["ga", "to"],
  gelo: ["ge", "lo"],
  gostei: ["gos", "tei"],
  grande: ["gran", "de"],
  hora: ["ho", "ra"],
  hospital: ["hos", "pi", "tal"],
  hoje: ["ho", "je"],
  higiene: ["hi", "gi", "e", "ne"],
  igreja: ["i", "gre", "ja"],
  ilha: ["i", "lha"],
  imagem: ["i", "ma", "gem"],
  ir: ["ir"],
  janela: ["ja", "ne", "la"],
  jogo: ["jo", "go"],
  joelho: ["jo", "e", "lho"],
  junto: ["jun", "to"],
  kiwi: ["ki", "wi"],
  karaoke: ["ka", "ra", "o", "kê"],
  kart: ["kart"],
  ketchup: ["ket", "chup"],
  leite: ["lei", "te"],
  livro: ["li", "vro"],
  lapis: ["lá", "pis"],
  lavar: ["la", "var"],
  mamae: ["ma", "mãe"],
  mao: ["mão"],
  mais: ["mais"],
  medo: ["me", "do"],
  nao: ["não"],
  nariz: ["na", "riz"],
  noite: ["noi", "te"],
  nome: ["no", "me"],
  olho: ["o", "lho"],
  ouvir: ["ou", "vir"],
  obrigado: ["o", "bri", "ga", "do"],
  onibus: ["ô", "ni", "bus"],
  papai: ["pa", "pai"],
  pausa: ["pau", "sa"],
  pe: ["pé"],
  professor: ["pro", "fes", "sor"],
  queijo: ["quei", "jo"],
  quero: ["que", "ro"],
  quieto: ["qui", "e", "to"],
  quente: ["quen", "te"],
  rua: ["ru", "a"],
  roupa: ["rou", "pa"],
  respirar: ["res", "pi", "rar"],
  rotina: ["ro", "ti", "na"],
  sono: ["so", "no"],
  suco: ["su", "co"],
  sentar: ["sen", "tar"],
  sorrir: ["sor", "rir"],
  terapia: ["te", "ra", "pi", "a"],
  triste: ["tris", "te"],
  tchau: ["tchau"],
  tomar: ["to", "mar"],
  uva: ["u", "va"],
  urso: ["ur", "so"],
  usar: ["u", "sar"],
  um: ["um"],
  vovo: ["vo", "vó"],
  voltar: ["vol", "tar"],
  ver: ["ver"],
  wifi: ["wi", "fi"],
  web: ["web"],
  walkietalkie: ["wal", "kie", "tal", "kie"],
  waffle: ["waf", "fle"],
  xicara: ["xí", "ca", "ra"],
  xarope: ["xa", "ro", "pe"],
  xadrez: ["xa", "drez"],
  xilofone: ["xi", "lo", "fo", "ne"],
  yoga: ["yo", "ga"],
  yakult: ["ya", "kult"],
  youtube: ["you", "tu", "be"],
  yakisoba: ["ya", "ki", "so", "ba"],
  zebra: ["ze", "bra"],
  zero: ["ze", "ro"],
  ziper: ["zí", "per"],
  zoologico: ["zo", "o", "ló", "gi", "co"]
};

function wordKey(word) {
  return word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getSyllables(word) {
  return syllableMap[wordKey(word)] || [word.toLowerCase()];
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nextMonthlyDueDate(from = new Date()) {
  const base = from?.toDate ? from.toDate() : new Date(from);
  const source = Number.isNaN(base.getTime()) ? new Date() : base;
  const year = source.getFullYear();
  const month = source.getMonth() + 1;
  const day = source.getDate();
  const lastDayOfNextMonth = new Date(year, month + 1, 0).getDate();
  return toDateInputValue(new Date(year, month, Math.min(day, lastDayOfNextMonth)));
}

function localWordsForLetter(letter) {
  return (alphabetWords[letter] || []).slice(0, 100).map(([word, icon]) => ({
    word,
    icon,
    syllables: getSyllables(word)
  }));
}

function normalizeWords(words) {
  const iconFallbacks = {
    abelha: "🐝",
    abacaxi: "🍍",
    agua: "💧",
    amigo: "🧒",
    aviao: "✈️",
    amor: "❤️",
    amora: "/images/amora.svg",
    alegria: "😄",
    amizade: "🤝",
    abacate: "🥑",
    acai: "🫐",
    arara: "🦜",
    abajur: "💡",
    agulha: "🪡",
    andar: "🚶",
    abrir: "🔓",
    ajudar: "🆘",
    ativar: "✅",
    alegre: "😊",
    adoravel: "🥰",
    anel: "💍",
    arroz: "🍚"
  };

  return words.slice(0, 100).map((item) => ({
    word: item.word,
    icon: item.icon || iconFallbacks[wordKey(item.word)] || "🔤",
    syllables: item.syllables?.length ? item.syllables : getSyllables(item.word)
  }));
}

function syllableOptions(syllables) {
  const options = syllables.map((syllable, index) => ({ syllable, index }));
  if (options.length <= 2) return options.reverse();

  const originalOrder = options.map((option) => option.index).join("-");
  const reversedOrder = options.map((option) => option.index).reverse().join("-");
  let shuffled = options;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    shuffled = options.slice();
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    const order = shuffled.map((option) => option.index).join("-");
    if (order !== originalOrder && order !== reversedOrder) return shuffled;
  }

  return shuffled;
}

const routines = [
  { title: "Manhã previsível", steps: [["Acordar", "☀️"], ["Banheiro", "🚽"], ["Comer", "🍽️"], ["Escovar", "🪥"], ["Escola", "🎒"]] },
  { title: "Regulação sensorial", steps: [["Pausa", "⏸️"], ["Respirar", "🌬️"], ["Pressão", "🤲"], ["Água", "💧"], ["Voltar", "↩️"]] },
  { title: "Sessão de fala", steps: [["Escolher", "☝️"], ["Ouvir", "👂"], ["Tentar", "🗣️"], ["Descansar", "⏸️"], ["Celebrar", "⭐"]] }
];

const exercises = [
  { title: "Sons bilabiais", text: "Pratique pa, ma e ba com ritmo lento. Use tentativa, gesto ou seleção visual como resposta válida.", phrase: "pa ma ba" },
  { title: "Pedido funcional", text: "Escolha uma necessidade real e modele a frase curta: eu quero água, eu quero pausa, eu preciso ajuda.", phrase: "eu quero ajuda" },
  { title: "Imitação sem pressão", text: "Mostre o símbolo, fale uma vez, aguarde alguns segundos e aceite olhar, gesto, toque ou vocalização.", phrase: "minha vez" },
  { title: "Nomear emoções", text: "Associe expressão facial, símbolo e palavra. Reduza a quantidade de opções se houver sobrecarga.", phrase: "eu estou calmo" }
];

const prompts = [
  ["1", "Espera com atenção", "Mostre duas opções, fique em silêncio por alguns segundos e observe olhar, gesto, aproximação, som ou toque.", "Você pode escolher.", "Eu escolhi"],
  ["2", "Pista visual", "Aponte para o símbolo correto ou destaque o cartão sem falar demais. Diminua a quantidade de opções se necessário.", "Olhe este símbolo.", "Eu quero"],
  ["3", "Pista gestual", "Use gesto natural, apontar, mão aberta ou olhar direcionado. Evite conduzir a resposta se a criança já iniciou uma tentativa.", "Mostre com o dedo.", "Eu preciso"],
  ["4", "Modelo verbal curto", "Fale uma frase curta uma vez, no ritmo da criança. Aceite aproximações de som, sílaba, gesto ou seleção no painel.", "Eu quero água.", "Eu quero água"],
  ["5", "Ajuda física leve e consentida", "Use apenas quando apropriado e com orientação profissional. Prefira apoio no ambiente e retire a ajuda rapidamente.", "Vamos tocar juntos.", "Preciso de ajuda"],
  ["6", "Retirada gradual da pista", "Depois de uma resposta, volte para uma pista menor: de verbal para gestual, de gestual para visual, de visual para espera.", "Agora tente sozinho.", "Minha vez"]
].map(([level, title, text, model, phrase]) => ({ level, title, text, model, phrase }));

const viewText = {
  comunicar: ["Comunicação por escolhas visuais", "Monte frases com símbolos, fale pelo sintetizador de voz e reduza barreiras para crianças com apraxia, dificuldades motoras de fala, TEA ou comunicação não verbal."],
  alfabeto: ["Alfabeto visual de A a Z", "Selecione uma letra para ver imagens e palavras correspondentes. Toque em uma palavra para ouvir e adicionar à frase atual."],
  vogais: ["Vogais e Alfabeto", "Treine vogais e famílias silábicas como BA BE BI BO BU com apoio de fala em português do Brasil."],
  cacapalavras: ["Caça Palavras", "Encontre palavras por tema, como frutas, transportes e objetos, com imagens e fala guiando a próxima letra correta."],
  memoria: ["Jogo da Memória", "Encontre pares de frutas, transportes, animais ou números com três níveis de dificuldade e cartas sempre embaralhadas."],
  desenhos: ["Desenhos", "Pinte a grade por número, selecione a cor correta e veja a imagem se formando."],
  concentracao: ["Concentração", "Escolha a cor pelo número, siga a sequência dos blocos e veja o desenho se formando com apoio de fala."],
  rotinas: ["Rotinas visuais previsíveis", "Use sequências curtas para antecipar transições, diminuir ansiedade e apoiar autonomia."],
  continhas: ["Continhas com apoio de fala", "Escolha somar, diminuir, multiplicar ou dividir e treine pequenas contas com resposta falada e pistas graduais."],
  treino: ["Treino leve e funcional", "Atividades breves para modelar sons, pedidos e intenção comunicativa sem pressão de desempenho."],
  prompts: ["Pistas graduais de comunicação", "Aplique pistas do menor para o maior apoio, registre tentativas e retire a ajuda aos poucos para favorecer autonomia."],
  progresso: ["Acompanhamento do dia", "Registre observações úteis para família, escola e profissionais que acompanham a criança."],
  aprovacoes: ["Aprovação de palavras", "Revise palavras cadastradas por usuários antes que elas fiquem ativas no alfabeto."],
  admin: ["Usuários", "Gerencie contas, mensalidades, status de pagamento e tipo de acesso."],
  administrador: ["Administrador", "Configure planos, valores e regras comerciais do Soletrar Kids."]
};

const rootEmail = (import.meta.env.VITE_ROOT_EMAIL || "").trim().toLowerCase();
const freeDailySeconds = 10 * 60;
const defaultPlanSettings = { proMensalidade: 49.9, freeMinutosDiarios: 10 };

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  });
  const save = (next) => {
    const valueToSave = typeof next === "function" ? next(value) : next;
    localStorage.setItem(key, JSON.stringify(valueToSave));
    setValue(valueToSave);
  };
  return [value, save];
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  const voices = speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang === "pt-BR") || voices.find((voice) => voice.lang.startsWith("pt")) || null;
  utterance.rate = 0.86;
  speechSynthesis.speak(utterance);
}

function normalizeUsername(value) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function isValidBrazilPhone(value) {
  const digits = onlyDigits(value);
  const ddd = Number(digits.slice(0, 2));
  if (![10, 11].includes(digits.length)) return false;
  if (ddd < 11 || ddd > 99) return false;
  if (digits.length === 11 && digits[2] !== "9") return false;
  return true;
}

function formatBrazilPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getRegistrationOrigin(kind = "auto") {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  return {
    tipo: kind,
    fusoHorario: timezone,
    idioma: navigator.language || "",
    idiomas: Array.isArray(navigator.languages) ? navigator.languages.join(", ") : "",
    plataforma: navigator.platform || "",
    navegador: navigator.userAgent || "",
    origemPagina: document.referrer || "",
    urlCadastro: window.location.href,
    horarioLocal: new Date().toLocaleString("pt-BR", { timeZone: timezone || undefined })
  };
}

function authMessage(error) {
  const code = error?.code || "";
  if (code.includes("auth/email-already-in-use")) return "Este e-mail já está cadastrado.";
  if (code.includes("auth/invalid-email")) return "Digite um e-mail válido.";
  if (code.includes("auth/weak-password")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password") || code.includes("auth/user-not-found")) return "Usuário, e-mail ou senha incorretos.";
  if (code.includes("auth/operation-not-allowed")) return "Ative o provedor E-mail/Senha em Firebase Authentication.";
  if (code.includes("permission-denied")) return "Permissão negada no Firestore. Verifique se o banco está em modo de teste ou se as regras permitem leitura e gravação.";
  if (code.includes("unavailable")) return "Não foi possível conectar ao Firebase agora. Verifique sua internet e tente novamente.";
  if (code.includes("auth/network-request-failed")) return "Falha de conexão com o Firebase. Verifique sua internet.";
  if (code.includes("auth/configuration-not-found")) return "Authentication ainda não foi configurado neste projeto Firebase.";
  if (code.includes("auth/invalid-api-key")) return "A chave do Firebase está inválida. Verifique o arquivo .env.";
  return `Não foi possível concluir. Código do erro: ${code || "desconhecido"}.`;
}

function LoginScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    nome: "",
    usuario: "",
    telefone: "",
    email: "",
    senha: "",
    acesso: "",
    plano: "free"
  });

  const update = (field, value) => {
    setMessage("");
    setForm((current) => ({ ...current, [field]: field === "telefone" ? formatBrazilPhone(value) : value }));
  };

  const validateRegister = () => {
    const nome = form.nome.trim();
    const usuario = normalizeUsername(form.usuario);

    if (nome.split(/\s+/).length < 2) return "Digite o nome completo.";
    if (!/^[a-z0-9._-]{3,20}$/.test(usuario)) return "O usuário deve ter 3 a 20 caracteres, usando letras, números, ponto, hífen ou sublinhado.";
    if (!isValidBrazilPhone(form.telefone)) return "Digite um telefone válido com DDD. Exemplo: (11) 91234-5678.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Digite um e-mail válido.";
    if (form.senha.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
    return "";
  };

  const register = async (event) => {
    event.preventDefault();
    const validation = validateRegister();
    if (validation) {
      setMessage(validation);
      return;
    }

    if (!auth || !db) {
      setMessage("Firebase não configurado.");
      return;
    }

    setLoading(true);
    try {
      const usuario = normalizeUsername(form.usuario);
      const usernameRef = doc(db, "usuarios_por_usuario", usuario);
      const usernameSnapshot = await getDoc(usernameRef);
      if (usernameSnapshot.exists()) {
        setMessage("Este usuário já está em uso.");
        setLoading(false);
        return;
      }

      const credential = await createUserWithEmailAndPassword(auth, form.email.trim(), form.senha);
      await updateProfile(credential.user, { displayName: form.nome.trim() });
      const selectedPlan = form.plano === "pro" ? "pro" : "free";
      await setDoc(doc(db, "usuarios", credential.user.uid), {
        nomeCompleto: form.nome.trim(),
        usuario,
        telefone: onlyDigits(form.telefone),
        telefoneFormatado: formatBrazilPhone(form.telefone),
        email: form.email.trim().toLowerCase(),
        papel: form.email.trim().toLowerCase() === rootEmail ? "root" : "cliente",
        status: "ativo",
        plano: selectedPlan,
        limiteDiarioMinutos: selectedPlan === "free" ? 10 : null,
        pagamento: selectedPlan === "pro" ? "pendente" : "isento",
        mensalidade: 0,
        desconto: 0,
        valorFinal: 0,
        vencimento: nextMonthlyDueDate(),
        adesaoProEm: selectedPlan === "pro" ? serverTimestamp() : null,
        origemCadastro: getRegistrationOrigin("cadastro_usuario"),
        criadoEm: serverTimestamp()
      });
      await setDoc(usernameRef, {
        uid: credential.user.uid,
        email: form.email.trim().toLowerCase(),
        criadoEm: serverTimestamp()
      });
      onAuth(credential.user);
    } catch (error) {
      setMessage(authMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const login = async (event) => {
    event.preventDefault();
    if (!auth || !db) {
      setMessage("Firebase não configurado.");
      return;
    }

    if (!form.acesso.trim() || form.senha.length < 6) {
      setMessage("Digite usuário/e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      let email = form.acesso.trim();
      if (!email.includes("@")) {
        const usernameSnapshot = await getDoc(doc(db, "usuarios_por_usuario", normalizeUsername(email)));
        if (!usernameSnapshot.exists()) {
          setMessage("Usuário não encontrado.");
          setLoading(false);
          return;
        }
        email = usernameSnapshot.data().email;
      }
      const credential = await signInWithEmailAndPassword(auth, email, form.senha);
      onAuth(credential.user);
    } catch (error) {
      setMessage(authMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return <main className="login-page">
    <section className="login-shell">
      <div className="login-hero">
        <div className="brand-mark">SK</div>
        <h1>Soletrar Kids</h1>
        <p>Comunicação assistiva, treino de sílabas e rotina visual em português do Brasil.</p>
      </div>
      <div className="login-card">
        <div className="login-tabs" role="tablist">
          <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Entrar</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setMessage(""); }}>Criar conta</button>
        </div>

        {mode === "login" ? <form className="auth-form" onSubmit={login}>
          <label>Usuário ou e-mail<input value={form.acesso} onChange={(event) => update("acesso", event.target.value)} autoComplete="username" /></label>
          <label>Senha<input type="password" value={form.senha} onChange={(event) => update("senha", event.target.value)} autoComplete="current-password" /></label>
          {message && <p className="auth-message">{message}</p>}
          <button className="tool primary" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        </form> : <form className="auth-form" onSubmit={register}>
          <label>Nome completo<input value={form.nome} onChange={(event) => update("nome", event.target.value)} autoComplete="name" /></label>
          <label>Usuário<input value={form.usuario} onChange={(event) => update("usuario", event.target.value)} autoComplete="username" placeholder="ex.: alysson.silva" /></label>
          <label>Telefone com DDD<input value={form.telefone} onChange={(event) => update("telefone", event.target.value)} inputMode="tel" autoComplete="tel" placeholder="(11) 91234-5678" /></label>
          <label>E-mail<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" /></label>
          <label>Senha<input type="password" value={form.senha} onChange={(event) => update("senha", event.target.value)} autoComplete="new-password" /></label>
          <div className="plan-choice" role="radiogroup" aria-label="Escolha do plano">
            <button type="button" className={form.plano === "free" ? "active" : ""} onClick={() => update("plano", "free")}>
              <strong>Free</strong><span>10 minutos por dia</span>
            </button>
            <button type="button" className={form.plano === "pro" ? "active" : ""} onClick={() => update("plano", "pro")}>
              <strong>Pro</strong><span>Acesso completo com mensalidade</span>
            </button>
          </div>
          {message && <p className="auth-message">{message}</p>}
          <button className="tool primary" disabled={loading}>{loading ? "Criando..." : "Criar conta"}</button>
        </form>}
      </div>
    </section>
  </main>;
}

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState("comunicar");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState("A");
  const [phrase, setPhrase] = useState([]);
  const [custom, setCustom] = useStoredState("ck_custom", []);
  const [name, setName] = useStoredState("ck_name", "");
  const [notes, setNotes] = useStoredState("ck_notes", "");
  const [count, setCount] = useStoredState("ck_count", 0);
  const [lowStim, setLowStim] = useStoredState("ck_low", false);
  const [largeTouch, setLargeTouch] = useStoredState("ck_large", false);
  const [letterWords, setLetterWords] = useState({});
  const [letterStatus, setLetterStatus] = useState("Carregando palavras.");
  const [freeUsageSeconds, setFreeUsageSeconds] = useState(0);
  const [planSettings, setPlanSettings] = useState(defaultPlanSettings);
  const [paintSelectedNumber, setPaintSelectedNumber] = useState("1");
  const [drawingSelectedNumber, setDrawingSelectedNumber] = useState("1");

  const symbols = useMemo(() => baseSymbols.concat(custom).filter((item) => {
    const byCategory = category === "all" || item.category === category;
    const bySearch = !query || item.text.toLowerCase().includes(query.toLowerCase());
    return byCategory && bySearch;
  }), [category, query, custom]);

  const bump = () => setCount((current) => current + 1);
  const addPhrase = (item, options = {}) => {
    setPhrase((current) => current.concat(item));
    if (!options.silent) speak(item.text);
    bump();
  };
  const phraseText = phrase.map((item) => item.text).join(". ");
  const isRoot = userProfile?.papel === "root" || authUser?.email?.toLowerCase() === rootEmail;
  const isFreePlan = !isRoot && (userProfile?.plano || "free") === "free";
  const freeUsageKey = authUser ? `sk_free_usage_${authUser.uid}_${new Date().toISOString().slice(0, 10)}` : "";
  const freeLimitSeconds = Number(planSettings.freeMinutosDiarios || 10) * 60;
  const proPlanPrice = Number(planSettings.proMensalidade || 0);
  const proPlanPriceText = proPlanPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const freeSecondsLeft = Math.max(0, freeLimitSeconds - freeUsageSeconds);
  const freeLimitReached = isFreePlan && freeSecondsLeft <= 0;

  useEffect(() => {
    let active = true;

    async function fetchWords() {
      setLetterStatus("Buscando palavras no Firebase.");
      try {
        const firebaseWords = await loadLetterWords(letter);
        if (!active) return;

        if (firebaseWords?.length) {
          setLetterWords((current) => ({ ...current, [letter]: normalizeWords(firebaseWords) }));
          setLetterStatus(`Palavras carregadas do Firebase. Limite: até 100 palavras para a letra ${letter}.`);
          return;
        }

        setLetterWords((current) => ({ ...current, [letter]: localWordsForLetter(letter) }));
        setLetterStatus("Usando palavras locais até o Firebase ser configurado ou preenchido.");
      } catch {
        if (!active) return;
        setLetterWords((current) => ({ ...current, [letter]: localWordsForLetter(letter) }));
        setLetterStatus("Não foi possível acessar o Firebase. Usando palavras locais.");
      }
    }

    fetchWords();
    return () => {
      active = false;
    };
  }, [letter]);

  useEffect(() => {
    if (!db) return undefined;
    let active = true;

    async function loadPlanSettings() {
      const snapshot = await getDoc(doc(db, "configuracoes", "planos"));
      if (!active || !snapshot.exists()) return;
      setPlanSettings({ ...defaultPlanSettings, ...snapshot.data() });
    }

    loadPlanSettings().catch(() => setPlanSettings(defaultPlanSettings));
    return () => {
      active = false;
    };
  }, []);

  const currentLetterWords = letterWords[letter] || localWordsForLetter(letter);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return undefined;
    }
    return onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user && db) {
        const profileRef = doc(db, "usuarios", user.uid);
        const profileSnapshot = await getDoc(profileRef);
        const role = user.email?.toLowerCase() === rootEmail ? "root" : "cliente";
        if (profileSnapshot.exists()) {
          const data = profileSnapshot.data();
          if (role === "root" && data.papel !== "root") await setDoc(profileRef, { papel: "root" }, { merge: true });
          setUserProfile({ ...data, papel: role === "root" ? "root" : data.papel || "cliente" });
        } else {
          const profile = { nomeCompleto: user.displayName || "", email: user.email || "", papel: role, criadoEm: serverTimestamp() };
          await setDoc(profileRef, profile, { merge: true });
          setUserProfile({ ...profile, criadoEm: null });
        }
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    const registeredName = userProfile?.nomeCompleto || authUser?.displayName || userProfile?.usuario || authUser?.email?.split("@")[0] || "";
    if (registeredName && !name) setName(registeredName);
  }, [authUser, userProfile, name, setName]);

  useEffect(() => {
    if (!freeUsageKey) {
      setFreeUsageSeconds(0);
      return undefined;
    }
    setFreeUsageSeconds(Number(localStorage.getItem(freeUsageKey) || 0));
    if (!isFreePlan) return undefined;

    const timer = window.setInterval(() => {
      setFreeUsageSeconds((current) => {
        const next = Math.min(freeLimitSeconds, current + 1);
        localStorage.setItem(freeUsageKey, String(next));
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [freeUsageKey, isFreePlan, freeLimitSeconds]);

  const migrateToPro = async () => {
    if (!authUser || !db) return;
    const proAdhesionDate = new Date();
    await setDoc(doc(db, "usuarios", authUser.uid), {
      plano: "pro",
      limiteDiarioMinutos: null,
      pagamento: "pendente",
      mensalidade: proPlanPrice,
      valorFinal: proPlanPrice,
      adesaoProEm: serverTimestamp(),
      vencimento: nextMonthlyDueDate(proAdhesionDate)
    }, { merge: true });
    setUserProfile((current) => ({
      ...current,
      plano: "pro",
      limiteDiarioMinutos: null,
      pagamento: "pendente",
      mensalidade: proPlanPrice,
      valorFinal: proPlanPrice,
      adesaoProEm: proAdhesionDate,
      vencimento: nextMonthlyDueDate(proAdhesionDate)
    }));
  };

  const saveCurrentLetter = async () => {
    try {
      await saveLetterWords(letter, currentLetterWords);
      setLetterStatus(`Letra ${letter} salva no Firebase com ${currentLetterWords.length} palavra(s).`);
    } catch {
      setLetterStatus("Firebase ainda não configurado. Preencha o arquivo .env com as chaves do projeto.");
    }
  };

  const saveWordsForLetter = async (nextWords) => {
    const limitedWords = normalizeWords(nextWords).slice(0, 100);
    setLetterWords((current) => ({ ...current, [letter]: limitedWords }));

    try {
      await saveLetterWords(letter, limitedWords);
      setLetterStatus(`Letra ${letter} atualizada no Firebase com ${limitedWords.length} palavra(s).`);
    } catch {
      setLetterStatus("Palavra adicionada localmente. Configure o Firebase para salvar no banco de dados.");
    }
  };

  const submitPendingWord = async ({ word, icon, syllables }) => {
    if (!db || !authUser) throw new Error("Usuário não autenticado.");
    const id = `${letter}-${wordKey(word)}-${Date.now()}`;
    await setDoc(doc(db, "palavras_pendentes", id), {
      letra: letter,
      palavra: word,
      imagem: icon,
      silabas: syllables,
      status: "pendente",
      criadoEm: serverTimestamp(),
      criadoPorUid: authUser.uid,
      criadoPorEmail: authUser.email || "",
      criadoPorNome: userProfile?.nomeCompleto || authUser.displayName || ""
    });
  };

  if (authLoading) return <main className="login-page"><section className="login-shell"><div className="login-card">Carregando...</div></section></main>;
  if (!authUser) return <LoginScreen onAuth={setAuthUser} />;

  return (
    <div className={`app ${lowStim ? "low-stim" : ""} ${largeTouch ? "large-touch" : ""}`}>
      <Sidebar view={view} setView={setView} lowStim={lowStim} setLowStim={setLowStim} largeTouch={largeTouch} setLargeTouch={setLargeTouch} user={authUser} isRoot={isRoot} />
      <main>
        <header className="topbar">
          <div className="headline">
            <h2>{viewText[view][0]}</h2>
            <p>{viewText[view][1]}</p>
          </div>
          <label className="profile">Perfil da criança<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome ou apelido" /></label>
        </header>
        {isFreePlan && <div className={`plan-banner ${freeLimitReached ? "blocked" : ""}`}>
          <strong>Plano Free</strong>
          <span>{freeLimitReached ? "Tempo diário encerrado." : `${Math.ceil(freeSecondsLeft / 60)} minuto(s) restante(s) hoje.`}</span>
          <button className="tool primary" onClick={migrateToPro}>Migrar para Pro por {proPlanPriceText}/mês</button>
        </div>}
        {freeLimitReached ? <section className="limit-panel">
          <h3>Seu tempo gratuito de hoje terminou</h3>
          <p>O Plano Free libera {planSettings.freeMinutosDiarios || 10} minutos de uso por dia. Para acesso completo, migre para o Plano Pro por {proPlanPriceText}/mês.</p>
          <button className="tool primary" onClick={migrateToPro}>Migrar para Pro</button>
        </section> : <>
        <div className={`workspace ${["admin", "administrador", "cacapalavras", "memoria"].includes(view) ? "workspace-full" : ""}`}>
          <div>
            {view === "comunicar" && <Communication symbols={symbols} category={category} setCategory={setCategory} query={query} setQuery={setQuery} addPhrase={addPhrase} custom={custom} setCustom={setCustom} />}
            {view === "alfabeto" && <Alphabet letter={letter} setLetter={setLetter} addPhrase={addPhrase} words={currentLetterWords} status={letterStatus} saveCurrentLetter={saveCurrentLetter} saveWordsForLetter={saveWordsForLetter} submitPendingWord={submitPendingWord} isRoot={isRoot} />}
            {view === "vogais" && <VowelsAlphabet />}
            {view === "cacapalavras" && <WordSearchGame bump={bump} />}
            {view === "memoria" && <MemoryGame bump={bump} />}
            {view === "desenhos" && <DrawingsByNumber bump={bump} selectedNumber={drawingSelectedNumber} setSelectedNumber={setDrawingSelectedNumber} />}
            {view === "concentracao" && <PaintByNumber bump={bump} selectedNumber={paintSelectedNumber} setSelectedNumber={setPaintSelectedNumber} />}
            {view === "rotinas" && <Routines bump={bump} />}
            {view === "continhas" && <MathPractice bump={bump} />}
            {view === "treino" && <Exercises bump={bump} />}
            {view === "prompts" && <Prompts setPhrase={setPhrase} bump={bump} />}
            {view === "progresso" && <Progress name={name} notes={notes} setNotes={setNotes} count={count} />}
            {view === "aprovacoes" && isRoot && <AdminApprovals />}
            {view === "admin" && isRoot && <AdminUsers planSettings={planSettings} />}
            {view === "administrador" && isRoot && <AdminSettings planSettings={planSettings} setPlanSettings={setPlanSettings} />}
          </div>
          {view === "desenhos" && <ColorNumberPanel colors={drawingColors} selectedNumber={drawingSelectedNumber} setSelectedNumber={setDrawingSelectedNumber} />}
          {view === "concentracao" && <ColorNumberPanel colors={paintColors} selectedNumber={paintSelectedNumber} setSelectedNumber={setPaintSelectedNumber} />}
          {!["admin", "administrador", "desenhos", "concentracao", "cacapalavras", "memoria"].includes(view) && <PhrasePanel phrase={phrase} setPhrase={setPhrase} phraseText={phraseText} bump={bump} />}
        </div>
        </>}
      </main>
    </div>
  );
}

function Sidebar({ view, setView, lowStim, setLowStim, largeTouch, setLargeTouch, user, isRoot }) {
  const items = [["comunicar", "Comunicar", "💬"], ["alfabeto", "A-Z", "🔤"], ["vogais", "Vogais e Alfabeto", "🅰️"], ["cacapalavras", "Caça Palavras", "🔎"], ["memoria", "Jogo da Memória", "🧠"], ["desenhos", "Desenhos", "🖍️"], ["concentracao", "Concentração", "🎨"], ["rotinas", "Rotinas", "📅"], ["continhas", "Continhas", "🧮"], ["treino", "Treino", "🗣️"], ["prompts", "Pistas", "✨"], ["progresso", "Progresso", "📊"]];
  if (isRoot) items.push(["aprovacoes", "Aprovações", "✅"], ["admin", "Usuários", "👥"], ["administrador", "Administrador", "⚙️"]);
  return (
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">💬</div><div><h1>Soletrar Kids</h1><p>CAA, fala assistiva e rotina visual</p></div></div>
      <nav className="nav">{items.map(([id, label, icon]) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><span aria-hidden="true">{icon}</span>{label}</button>)}</nav>
      <div className="sidebar-footer">
        <Switch label="Baixa estimulação" value={lowStim} onChange={() => setLowStim(!lowStim)} />
        <Switch label="Toques maiores" value={largeTouch} onChange={() => setLargeTouch(!largeTouch)} />
        <button className="tool" onClick={() => signOut(auth)}>Sair</button>
      </div>
    </aside>
  );
}

function Switch({ label, value, onChange }) {
  return <div className="toggle-row"><span>{label}</span><button className={`switch ${value ? "on" : ""}`} onClick={onChange} aria-label={label}><span /></button></div>;
}

function Communication({ symbols, category, setCategory, query, setQuery, addPhrase, custom, setCustom }) {
  const [text, setText] = useState("");
  const [customCategory, setCustomCategory] = useState("want");
  const colors = { want: "c-want", need: "c-need", feel: "c-feel", routine: "c-routine", people: "c-people" };
  const addCustom = (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    const trimmedText = text.trim();
    setCustom(custom.concat({ category: customCategory, text: trimmedText, icon: communicationIconFor(trimmedText), color: colors[customCategory] }));
    setText("");
  };
  return <>
    <div className="toolbar"><div className="segmented">{categories.map((cat) => <button key={cat.id} className={category === cat.id ? "active" : ""} onClick={() => setCategory(cat.id)}>{cat.label}</button>)}</div><input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar símbolo ou palavra" /></div>
    <form className="custom-builder" onSubmit={addCustom}><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Nova palavra ou frase" /><select value={customCategory} onChange={(event) => setCustomCategory(event.target.value)}>{categories.filter((cat) => cat.id !== "all").map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}</select><button className="tool primary">Adicionar</button></form>
    <div className="grid">{symbols.map((item) => <SymbolCard key={`${item.text}-${item.category}`} item={item} onClick={() => addPhrase(item)} />)}</div>
  </>;
}

const communicationIconFallbacks = {
  irmao: "👦",
  saudades: "🥹"
};

function communicationIconFor(text, currentIcon = "⭐") {
  return communicationIconFallbacks[wordKey(text)] || currentIcon;
}

function SymbolCard({ item, onClick }) {
  return <button className={`symbol ${item.color}`} onClick={onClick}><Picto value={communicationIconFor(item.text, item.icon)} /><span><strong>{item.text}</strong><small>{categories.find((cat) => cat.id === item.category)?.label || "Personalizado"}</small></span></button>;
}

function Picto({ value }) {
  const isImage = typeof value === "string" && (value.startsWith("/") || value.startsWith("http") || value.startsWith("data:"));
  return <span className="picto">{isImage ? <img src={value} alt="" /> : value}</span>;
}

const wordSearchThemes = [
  {
    id: "frutas",
    title: "Frutas",
    words: [
      { word: "banana", label: "Banana", icon: "🍌" },
      { word: "abacaxi", label: "Abacaxi", icon: "🍍" },
      { word: "morango", label: "Morango", icon: "🍓" },
      { word: "melancia", label: "Melancia", icon: "🍉" },
      { word: "laranja", label: "Laranja", icon: "🍊" },
      { word: "uva", label: "Uva", icon: "🍇" }
    ]
  },
  {
    id: "transportes",
    title: "Transportes",
    words: [
      { word: "carro", label: "Carro", icon: "🚗" },
      { word: "bicicleta", label: "Bicicleta", icon: "🚲" },
      { word: "aviao", label: "Avião", icon: "✈️" },
      { word: "onibus", label: "Ônibus", icon: "🚌" },
      { word: "moto", label: "Moto", icon: "🏍️" },
      { word: "barco", label: "Barco", icon: "⛵" }
    ]
  },
  {
    id: "imagens",
    title: "Imagens diversas",
    words: [
      { word: "casa", label: "Casa", icon: "🏠" },
      { word: "bola", label: "Bola", icon: "⚽" },
      { word: "livro", label: "Livro", icon: "📚" },
      { word: "lapis", label: "Lápis", icon: "✏️" },
      { word: "estrela", label: "Estrela", icon: "⭐" },
      { word: "cachorro", label: "Cachorro", icon: "🐶" }
    ]
  }
];

function normalizeSearchWord(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
}

function shuffleList(items) {
  const shuffled = items.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function buildWordSearch(words, size = 12) {
  const directions = [
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: -1, col: 1 }
  ];
  const alphabetLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
  const placements = {};

  words.forEach((item) => {
    const letters = normalizeSearchWord(item.word).split("");
    let placed = false;

    for (let attempt = 0; attempt < 160 && !placed; attempt += 1) {
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const startRow = Math.floor(Math.random() * size);
      const startCol = Math.floor(Math.random() * size);
      const endRow = startRow + direction.row * (letters.length - 1);
      const endCol = startCol + direction.col * (letters.length - 1);
      if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;

      const cells = letters.map((letter, index) => ({
        row: startRow + direction.row * index,
        col: startCol + direction.col * index,
        letter
      }));

      if (!cells.every((cell) => !grid[cell.row][cell.col] || grid[cell.row][cell.col] === cell.letter)) continue;

      cells.forEach((cell) => {
        grid[cell.row][cell.col] = cell.letter;
      });
      placements[item.word] = cells.map(({ row, col, letter }) => ({ row, col, letter }));
      placed = true;
    }
  });

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!grid[row][col]) grid[row][col] = alphabetLetters[Math.floor(Math.random() * alphabetLetters.length)];
    }
  }

  return { grid, placements };
}

function WordSearchGame({ bump }) {
  const [themeId, setThemeId] = useState("frutas");
  const [round, setRound] = useState(0);
  const [activeWord, setActiveWord] = useState("banana");
  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState({});
  const [feedback, setFeedback] = useState("Escolha uma palavra e toque nas letras em ordem.");
  const theme = wordSearchThemes.find((item) => item.id === themeId) || wordSearchThemes[0];
  const shuffledWords = useMemo(() => shuffleList(theme.words), [themeId, round]);
  const puzzle = useMemo(() => buildWordSearch(shuffledWords), [shuffledWords]);
  const activeItem = shuffledWords.find((item) => item.word === activeWord) || shuffledWords[0];
  const activeCells = puzzle.placements[activeItem.word] || [];
  const selectedKey = (row, col) => selectedCells.some((cell) => cell.row === row && cell.col === col);
  const foundKey = (row, col) => Object.entries(foundWords).some(([word, found]) =>
    found && (puzzle.placements[word] || []).some((cell) => cell.row === row && cell.col === col)
  );

  useEffect(() => {
    const firstWord = shuffledWords[0]?.word || "";
    setActiveWord(firstWord);
    setSelectedCells([]);
    setFoundWords({});
    setFeedback(`Tema ${theme.title}. Encontre ${shuffledWords[0]?.label || "a primeira palavra"}.`);
  }, [themeId, round, shuffledWords, theme.title]);

  const chooseTheme = (nextThemeId) => {
    const nextTheme = wordSearchThemes.find((item) => item.id === nextThemeId) || wordSearchThemes[0];
    setThemeId(nextTheme.id);
    speak(`Tema ${nextTheme.title}.`);
  };

  const chooseWord = (word) => {
    const item = shuffledWords.find((entry) => entry.word === word);
    setActiveWord(word);
    setSelectedCells([]);
    const message = item ? `Procure ${item.label}. Comece pela letra ${normalizeSearchWord(item.word)[0]}.` : "Escolha uma palavra.";
    setFeedback(message);
    speak(message);
  };

  const restart = () => {
    setRound((current) => current + 1);
    speak("Novo caça palavras.");
  };

  const touchCell = (row, col, letter) => {
    if (foundWords[activeItem.word]) {
      setFeedback(`${activeItem.label} já foi encontrada. Escolha outra palavra.`);
      speak(`${activeItem.label} já foi encontrada.`);
      return;
    }

    const nextCell = activeCells[selectedCells.length];
    if (!nextCell) return;

    if (nextCell.row !== row || nextCell.col !== col) {
      const message = `Toque na letra correta. Agora procure a letra ${nextCell.letter}.`;
      setFeedback(message);
      speak(message);
      return;
    }

    const nextSelection = selectedCells.concat({ row, col, letter });
    setSelectedCells(nextSelection);

    if (nextSelection.length === activeCells.length) {
      const nextFound = { ...foundWords, [activeItem.word]: true };
      const nextWord = shuffledWords.find((item) => !nextFound[item.word]);
      setFoundWords(nextFound);
      setSelectedCells([]);
      setFeedback(nextWord ? `Muito bem. ${activeItem.label} encontrada. Agora procure ${nextWord.label}.` : "Parabéns. Você encontrou todas as palavras.");
      speak(nextWord ? `Muito bem. ${activeItem.label} encontrada. Agora procure ${nextWord.label}.` : "Parabéns. Você encontrou todas as palavras.");
      bump();
      if (nextWord) setActiveWord(nextWord.word);
      return;
    }

    const upcoming = activeCells[nextSelection.length];
    const message = upcoming ? `Isso. Próxima letra: ${upcoming.letter}.` : "Continue.";
    setFeedback(message);
    speak(message);
  };

  const completed = shuffledWords.every((item) => foundWords[item.word]);

  return <section className="word-search-board">
    <div className="word-search-toolbar">
      <div className="segmented">
        {wordSearchThemes.map((item) => <button key={item.id} className={themeId === item.id ? "active" : ""} onClick={() => chooseTheme(item.id)}>{item.title}</button>)}
      </div>
      <button className="tool" onClick={() => speak(`Tema ${theme.title}. Procure ${activeItem.label}.`)}>Falar dica</button>
      <button className="tool primary" onClick={restart}>Novo caça palavras</button>
    </div>

    <div className="word-search-layout">
      <div className="word-search-grid" style={{ "--search-size": puzzle.grid.length }}>
        {puzzle.grid.map((rowItems, row) => rowItems.map((letter, col) => {
          const selected = selectedKey(row, col);
          const found = foundKey(row, col);
          return <button
            key={`${row}-${col}`}
            className={`word-search-cell ${selected ? "selected" : ""} ${found ? "found" : ""}`}
            onClick={() => touchCell(row, col, letter)}
            aria-label={`Letra ${letter}`}
          >
            {letter}
          </button>;
        }))}
      </div>

      <aside className="word-search-words">
        <strong>Palavras do tema</strong>
        {shuffledWords.map((item) => <button
          key={item.word}
          className={`word-search-word ${activeWord === item.word ? "active" : ""} ${foundWords[item.word] ? "done" : ""}`}
          onClick={() => chooseWord(item.word)}
        >
          <span>{item.icon}</span>
          <span><b>{item.label}</b><small>{foundWords[item.word] ? "Encontrada" : "Procurar"}</small></span>
        </button>)}
      </aside>
    </div>

    <p className={completed ? "syllable-feedback" : "syllable-feedback error"}>{feedback}</p>
  </section>;
}

const memoryLevels = {
  facil: { label: "Fácil", pairs: 4 },
  medio: { label: "Médio", pairs: 6 },
  dificil: { label: "Difícil", pairs: 8 }
};

const memoryThemes = [
  {
    id: "frutas",
    title: "Frutas",
    cards: [
      { id: "banana", label: "Banana", icon: "🍌" },
      { id: "abacaxi", label: "Abacaxi", icon: "🍍" },
      { id: "morango", label: "Morango", icon: "🍓" },
      { id: "melancia", label: "Melancia", icon: "🍉" },
      { id: "laranja", label: "Laranja", icon: "🍊" },
      { id: "uva", label: "Uva", icon: "🍇" },
      { id: "maca", label: "Maçã", icon: "🍎" },
      { id: "pera", label: "Pera", icon: "🍐" }
    ]
  },
  {
    id: "transportes",
    title: "Transportes",
    cards: [
      { id: "carro", label: "Carro", icon: "🚗" },
      { id: "bicicleta", label: "Bicicleta", icon: "🚲" },
      { id: "aviao", label: "Avião", icon: "✈️" },
      { id: "onibus", label: "Ônibus", icon: "🚌" },
      { id: "moto", label: "Moto", icon: "🏍️" },
      { id: "barco", label: "Barco", icon: "⛵" },
      { id: "trem", label: "Trem", icon: "🚆" },
      { id: "caminhao", label: "Caminhão", icon: "🚚" }
    ]
  },
  {
    id: "animais",
    title: "Animais",
    cards: [
      { id: "cachorro", label: "Cachorro", icon: "🐶" },
      { id: "gato", label: "Gato", icon: "🐱" },
      { id: "leao", label: "Leão", icon: "🦁" },
      { id: "macaco", label: "Macaco", icon: "🐵" },
      { id: "peixe", label: "Peixe", icon: "🐟" },
      { id: "passaro", label: "Pássaro", icon: "🐦" },
      { id: "coelho", label: "Coelho", icon: "🐰" },
      { id: "tartaruga", label: "Tartaruga", icon: "🐢" }
    ]
  },
  {
    id: "numeros",
    title: "Números",
    cards: [
      { id: "um", label: "Um", icon: "1" },
      { id: "dois", label: "Dois", icon: "2" },
      { id: "tres", label: "Três", icon: "3" },
      { id: "quatro", label: "Quatro", icon: "4" },
      { id: "cinco", label: "Cinco", icon: "5" },
      { id: "seis", label: "Seis", icon: "6" },
      { id: "sete", label: "Sete", icon: "7" },
      { id: "oito", label: "Oito", icon: "8" }
    ]
  }
];

function buildMemoryDeck(theme, level) {
  const pairs = memoryLevels[level]?.pairs || memoryLevels.facil.pairs;
  const selected = shuffleList(theme.cards).slice(0, pairs);
  return shuffleList(selected.flatMap((item) => [
    { ...item, cardId: `${item.id}-a`, pairId: item.id },
    { ...item, cardId: `${item.id}-b`, pairId: item.id }
  ]));
}

function MemoryGame({ bump }) {
  const [themeId, setThemeId] = useState("frutas");
  const [level, setLevel] = useState("facil");
  const [round, setRound] = useState(0);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState({});
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("Escolha duas cartas para encontrar o par.");
  const theme = memoryThemes.find((item) => item.id === themeId) || memoryThemes[0];
  const cards = useMemo(() => buildMemoryDeck(theme, level), [themeId, level, round]);
  const matchedCount = Object.keys(matched).filter((key) => matched[key]).length;
  const totalPairs = cards.length / 2;
  const completed = totalPairs > 0 && matchedCount >= totalPairs;

  useEffect(() => {
    setFlipped([]);
    setMatched({});
    setBusy(false);
    setFeedback(`${theme.title}, nível ${memoryLevels[level].label}. Cartas embaralhadas.`);
  }, [themeId, level, round, theme.title]);

  const restart = () => {
    setRound((current) => current + 1);
    speak("Jogo da memória recomeçado. Cartas embaralhadas.");
  };

  const chooseTheme = (nextThemeId) => {
    const nextTheme = memoryThemes.find((item) => item.id === nextThemeId) || memoryThemes[0];
    setThemeId(nextTheme.id);
    speak(`Tema ${nextTheme.title}.`);
  };

  const chooseLevel = (nextLevel) => {
    setLevel(nextLevel);
    speak(`Nível ${memoryLevels[nextLevel].label}.`);
  };

  const flipCard = (card) => {
    if (busy || matched[card.pairId] || flipped.some((item) => item.cardId === card.cardId)) return;

    const nextFlipped = flipped.concat(card);
    setFlipped(nextFlipped);
    speak(card.label);

    if (nextFlipped.length < 2) {
      setFeedback(`Carta ${card.label}. Escolha outra carta.`);
      return;
    }

    setBusy(true);
    const [first, second] = nextFlipped;
    if (first.pairId === second.pairId) {
      const nextMatched = { ...matched, [card.pairId]: true };
      setMatched(nextMatched);
      setFlipped([]);
      setBusy(false);
      bump();
      const nextMatchedCount = Object.keys(nextMatched).filter((key) => nextMatched[key]).length;
      const message = nextMatchedCount >= totalPairs ? "Parabéns. Você encontrou todos os pares." : `Muito bem. Par de ${card.label} encontrado.`;
      setFeedback(message);
      speak(message);
      return;
    }

    const message = `${first.label} e ${second.label}. Não formam par. Tente novamente.`;
    setFeedback(message);
    speak(message);
    window.setTimeout(() => {
      setFlipped([]);
      setBusy(false);
    }, 1100);
  };

  return <section className="memory-board">
    <div className="memory-toolbar">
      <div className="segmented">
        {Object.entries(memoryLevels).map(([id, item]) => <button key={id} className={level === id ? "active" : ""} onClick={() => chooseLevel(id)}>{item.label}</button>)}
      </div>
      <div className="segmented">
        {memoryThemes.map((item) => <button key={item.id} className={themeId === item.id ? "active" : ""} onClick={() => chooseTheme(item.id)}>{item.title}</button>)}
      </div>
      <button className="tool" onClick={() => speak(`${theme.title}, nível ${memoryLevels[level].label}. Encontre os pares.`)}>Falar instrução</button>
      <button className="tool primary" onClick={restart}>Recomeçar</button>
    </div>

    <div className={`memory-grid level-${level}`}>
      {cards.map((card) => {
        const isOpen = matched[card.pairId] || flipped.some((item) => item.cardId === card.cardId);
        return <button
          key={card.cardId}
          className={`memory-card ${isOpen ? "open" : ""} ${matched[card.pairId] ? "done" : ""}`}
          onClick={() => flipCard(card)}
          aria-label={isOpen ? card.label : "Carta virada"}
        >
          <span className="memory-back">?</span>
          <span className="memory-face"><b>{card.icon}</b><small>{card.label}</small></span>
        </button>;
      })}
    </div>

    <div className="round-panel">
      <strong>{matchedCount} de {totalPairs} par(es)</strong>
      <span>{completed ? "Jogo concluído" : "Cartas embaralhadas a cada nova sessão ou recomeço"}</span>
      <button className="tool primary" disabled={!completed} onClick={() => speak("Parabéns. Jogo da memória concluído.")}>Celebrar</button>
    </div>
    <p className={completed ? "syllable-feedback" : "syllable-feedback error"}>{feedback}</p>
  </section>;
}

function VowelsAlphabet() {
  const [selectedLetter, setSelectedLetter] = useState("B");
  const syllables = vowels.map((vowel) => `${selectedLetter}${vowel}`);
  const speakSyllable = (syllable) => speak(syllable.toLowerCase());
  const speakFamily = () => speak(syllables.map((syllable) => syllable.toLowerCase()).join(". "));

  return <section className="vowels-board">
    <div className="vowel-row">
      {vowels.map((vowel, index) => <button key={vowel} className={`vowel-btn tone-${index % 5}`} onClick={() => speak(vowel)}>{vowel}</button>)}
    </div>

    <div className="letter-title">
      <div>
        <strong>Letra {selectedLetter}</strong>
        <small>Família silábica: {syllables.join(" - ")}</small>
      </div>
      <div className="letter-actions">
        <button className="tool" onClick={() => speak(`Letra ${selectedLetter}`)}>Falar letra</button>
        <button className="tool primary" onClick={speakFamily}>Falar família</button>
      </div>
    </div>

    <div className="syllable-letter-grid">
      {syllableLetters.map((letter) => <button key={letter} className={`letter-btn ${selectedLetter === letter ? "active" : ""}`} onClick={() => { setSelectedLetter(letter); speak(`Letra ${letter}`); }}>{letter}</button>)}
    </div>

    <div className="family-grid">
      {syllables.map((syllable, index) => <button key={syllable} className={`family-card tone-${index % 5}`} onClick={() => speakSyllable(syllable)}>
        <strong>{syllable}</strong>
        <small>Falar sílaba</small>
      </button>)}
    </div>
  </section>;
}

function ColorNumberPanel({ colors, selectedNumber, setSelectedNumber }) {
  const chooseColor = (number) => {
    setSelectedNumber(number);
    speak(`Número ${colors[number].number || number}, ${colors[number].label}.`);
  };

  return <aside className="color-panel">
    <strong>Cores e números</strong>
    <div className="side-colors">
      {Object.entries(colors).map(([number, item]) => <button key={number} className={`paint-color ${selectedNumber === number ? "active" : ""}`} onClick={() => chooseColor(number)} style={{ "--paint": item.color }}>
        <strong>{item.number || number}</strong><span>{item.label}</span>
      </button>)}
    </div>
  </aside>;
}

const paintColors = {
  1: { label: "vermelho", color: "#f36b6b" },
  2: { label: "azul", color: "#58a6ff" },
  3: { label: "amarelo", color: "#ffd95a" },
  4: { label: "verde", color: "#6ed39a" },
  5: { label: "roxo", color: "#b89cff" }
};

const paintDrawings = [
  {
    id: "bloco-feliz",
    title: "Bloco feliz",
    rows: 8,
    cols: 8,
    cells: [
      "00111100",
      "01111110",
      "11222211",
      "11233211",
      "11333311",
      "11444411",
      "01155110",
      "00111100"
    ]
  },
  {
    id: "torre-numeros",
    title: "Torre de números",
    rows: 9,
    cols: 7,
    cells: [
      "0003000",
      "0033300",
      "0222220",
      "0222220",
      "0444440",
      "0444440",
      "1555551",
      "1555551",
      "1111111"
    ]
  }
];

function shufflePaintCells(drawing) {
  const values = drawing.cells.join("").split("").filter((value) => value !== "0");
  const shuffled = values.slice().sort(() => Math.random() - 0.5);
  let index = 0;
  return drawing.cells.map((row) => row.split("").map((value) => {
    if (value === "0") return "0";
    const nextValue = shuffled[index];
    index += 1;
    return nextValue;
  }).join(""));
}

function paintSequence(cells) {
  return cells.flatMap((row, rowIndex) => row.split("").map((value, colIndex) => ({ key: `${rowIndex}-${colIndex}`, value }))).filter((item) => item.value !== "0");
}

function PaintByNumber({ bump, selectedNumber, setSelectedNumber }) {
  const [drawingId, setDrawingId] = useState(paintDrawings[0].id);
  const [currentCells, setCurrentCells] = useState(() => shufflePaintCells(paintDrawings[0]));
  const [filled, setFilled] = useState({});
  const [feedback, setFeedback] = useState("Escolha uma cor pelo número e toque no desenho.");
  const drawing = paintDrawings.find((item) => item.id === drawingId) || paintDrawings[0];
  const sequence = paintSequence(currentCells);
  const nextCell = sequence.find((item) => !filled[item.key]);
  const paintableCells = sequence.length;
  const filledCount = Object.keys(filled).filter((key) => filled[key]).length;
  const completed = paintableCells > 0 && filledCount >= paintableCells;

  useEffect(() => {
    const saved = localStorage.getItem("sk_concentracao_progress");
    if (!saved) return;
    try {
      const progress = JSON.parse(saved);
      const savedDrawing = paintDrawings.find((item) => item.id === progress.drawingId);
      if (!savedDrawing || !Array.isArray(progress.currentCells)) return;
      setDrawingId(savedDrawing.id);
      setCurrentCells(progress.currentCells);
      setFilled(progress.filled || {});
      if (progress.selectedNumber) setSelectedNumber(progress.selectedNumber);
      setFeedback("Pintura recuperada de onde parou.");
    } catch {
      localStorage.removeItem("sk_concentracao_progress");
    }
  }, [setSelectedNumber]);

  useEffect(() => {
    localStorage.setItem("sk_concentracao_progress", JSON.stringify({ drawingId, currentCells, filled, selectedNumber }));
  }, [drawingId, currentCells, filled, selectedNumber]);

  const chooseDrawing = (nextId) => {
    const next = paintDrawings.find((item) => item.id === nextId) || paintDrawings[0];
    setDrawingId(next.id);
    const nextCells = shufflePaintCells(next);
    const first = paintSequence(nextCells)[0];
    setCurrentCells(nextCells);
    setFilled({});
    setFeedback(`Desenho ${next.title}. Siga a sequência. O primeiro bloco é número ${first?.value}.`);
    speak(`Desenho ${next.title}. Siga a sequência. O primeiro bloco é número ${first?.value}.`);
  };

  const chooseColor = (number) => {
    setSelectedNumber(number);
    const colorName = paintColors[number].label;
    setFeedback(nextCell?.value === number ? `Cor ${number}: ${colorName}. Agora toque no bloco indicado.` : `Cor ${number}: ${colorName}. O próximo bloco pede o número ${nextCell?.value || number}.`);
    speak(`Cor ${number}, ${colorName}.`);
  };

  const paintCell = (rowIndex, colIndex, value) => {
    if (value === "0") return;
    const key = `${rowIndex}-${colIndex}`;
    if (filled[key]) return;
    if (!nextCell || key !== nextCell.key) {
      const message = `Siga a sequência. O próximo bloco é número ${nextCell?.value}.`;
      setFeedback(message);
      speak(message);
      return;
    }

    if (value !== selectedNumber) {
      const colorName = paintColors[value]?.label || "cor correta";
      const message = `Este quadradinho é número ${value}. Escolha a cor ${colorName}.`;
      setFeedback(message);
      speak(message);
      return;
    }

    const nextFilled = { ...filled, [key]: true };
    setFilled(nextFilled);
    bump();

    const nextCount = Object.keys(nextFilled).length;
    if (nextCount >= paintableCells) {
      const message = `Muito bem. O desenho ${drawing.title} ficou pronto.`;
      setFeedback(message);
      speak(message);
      return;
    }

    const upcoming = sequence.find((item) => !nextFilled[item.key]);
    const message = upcoming ? `Muito bem. Agora o próximo bloco é número ${upcoming.value}.` : `Muito bem. Pintou o número ${value}.`;
    setFeedback(message);
    speak(message);
  };

  const restart = () => {
    if (!window.confirm("A pintura será reiniciada. Deseja continuar?")) return;
    const nextCells = shufflePaintCells(drawing);
    const first = paintSequence(nextCells)[0];
    setCurrentCells(nextCells);
    setFilled({});
    setFeedback(`Desenho recomeçado. O primeiro bloco é número ${first?.value}.`);
    speak(`Desenho recomeçado. O primeiro bloco é número ${first?.value}.`);
  };

  return <section className="paint-board">
    <div className="paint-toolbar">
      <label className="drawing-picker">Escolher desenho
        <select value={drawing.id} onChange={(event) => chooseDrawing(event.target.value)}>
          {paintDrawings.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>
      <button className="tool" onClick={() => speak(`Desenho ${drawing.title}. Siga a sequência. Escolha a cor do próximo número e pinte o bloco indicado.`)}>Falar instrução</button>
      <button className="tool" onClick={restart}>Recomeçar</button>
    </div>

    <div className="paint-canvas" style={{ "--paint-cols": drawing.cols }}>
      {currentCells.flatMap((row, rowIndex) => row.split("").map((value, colIndex) => {
        const key = `${rowIndex}-${colIndex}`;
        const isBlank = value === "0";
        const color = paintColors[value]?.color || "transparent";
        const isNext = nextCell?.key === key;
        return <button
          key={key}
          className={`paint-cell ${isBlank ? "blank" : ""} ${filled[key] ? "filled" : ""} ${isNext ? "next" : ""}`}
          onClick={() => paintCell(rowIndex, colIndex, value)}
          style={{ "--cell-color": color }}
          aria-label={isBlank ? "espaço vazio" : `número ${value}`}
        >
          {!isBlank && !filled[key] ? value : ""}
        </button>;
      }))}
    </div>

    <div className="round-panel">
      <strong>{drawing.title}</strong>
      <span>{filledCount} de {paintableCells} parte(s) pintada(s){nextCell ? ` · próximo: ${nextCell.value}` : ""}</span>
      <button className="tool primary" disabled={!completed} onClick={() => speak(`Parabéns. Você terminou o desenho ${drawing.title}.`)}>Celebrar</button>
    </div>
    <p className={feedback.includes("Escolha a cor") || feedback.includes("Este quadradinho") ? "syllable-feedback error" : "syllable-feedback"}>{feedback}</p>
  </section>;
}

const drawingColors = {
  1: { label: "azul claro", color: "#8cc9ff" },
  2: { label: "laranja", color: "#f59a3d" },
  3: { label: "marrom", color: "#9a560f" },
  4: { label: "verde claro", color: "#a9d632" },
  5: { label: "verde", color: "#51ad35" },
  6: { label: "branco", color: "#ffffff" },
  7: { label: "vermelho", color: "#f35050" },
  8: { label: "amarelo", color: "#ffd84d" },
  9: { label: "rosa", color: "#ff61b6" },
  A: { number: "10", label: "azul", color: "#33c4d8" },
  B: { number: "11", label: "cinza", color: "#a6a6a6" },
  C: { number: "12", label: "lilás", color: "#d992ff" }
};

function drawingNumber(value) {
  return drawingColors[value]?.number || value;
}

const numberDrawings = [
  {
    id: "cachorrinho",
    title: "Cachorrinho",
    cols: 18,
    cells: [
      "111111111111111111",
      "111111122222111111",
      "111112222222211111",
      "111122333332221111",
      "111223362633222111",
      "111223666633222111",
      "111122266222211111",
      "111112227222111111",
      "111111222221111111",
      "111111226221111111",
      "111111266621111111",
      "111112666662111111",
      "111122666662211111",
      "444422266222244444",
      "445522222222245544",
      "445522244422245544",
      "444444455544444444",
      "444444444444444444"
    ]
  },
  {
    id: "casinha",
    title: "Casinha",
    cols: 16,
    cells: [
      "1111111111111111",
      "1111111331111111",
      "1111113333111111",
      "1111133333311111",
      "1111333333331111",
      "1112222222222111",
      "1122262226222111",
      "1122262226222111",
      "1122222772222111",
      "1122222772222111",
      "1122222772222111",
      "1122222772222111",
      "1144444444444111",
      "4455554455554444",
      "4444444444444444",
      "4444444444444444"
    ]
  },
  {
    id: "princesa",
    title: "Princesa",
    cols: 24,
    cells: [
      "CCCCCCCCCCCCCCCCCCCCCCCC",
      "CCCCCCCCCC888888CCCCCCCC",
      "CCCCCCCCC88888888CCCCCCC",
      "CCCCCCCC8888888888CCCCCC",
      "CCCCCCC888888888888CCCCC",
      "CCCCCC88883333888888CCCC",
      "CCCCC888334444338888CCCC",
      "CCCC8883344444433888CCCC",
      "CCCC8833445555443388CCCC",
      "CCCC8334455555544338CCCC",
      "CCCC8334456665544338CCCC",
      "CCCC8833445555443388CCCC",
      "CCCCC88333444433388CCCCC",
      "CCCCCC888333333888CCCCCC",
      "CCCCCCC9999999999CCCCCCC",
      "CCCCCC9999AAA99999CCCCCC",
      "CCCCC99999999999999CCCCC",
      "CCCC9999997777999999CCCC",
      "CCC99999997777999999CCCC",
      "CC9999999777779999999CCC",
      "C99999999777777999999CCC",
      "BBBBBBBBB777777BBBBBBBBB",
      "BBBBBBBBBB7777BBBBBBBBBB",
      "BBBBBBBBBBB77BBBBBBBBBBB"
    ]
  }
];

function DrawingsByNumber({ bump, selectedNumber, setSelectedNumber }) {
  const [drawingId, setDrawingId] = useState(numberDrawings[0].id);
  const [filled, setFilled] = useState({});
  const [feedback, setFeedback] = useState("Escolha uma cor pelo número e pinte os quadradinhos correspondentes.");
  const drawing = numberDrawings.find((item) => item.id === drawingId) || numberDrawings[0];
  const totalCells = drawing.cells.join("").length;
  const filledCount = Object.keys(filled).length;
  const completed = filledCount >= totalCells;

  useEffect(() => {
    const saved = localStorage.getItem("sk_desenhos_progress");
    if (!saved) return;
    try {
      const progress = JSON.parse(saved);
      const savedDrawing = numberDrawings.find((item) => item.id === progress.drawingId);
      if (!savedDrawing) return;
      setDrawingId(savedDrawing.id);
      setFilled(progress.filled || {});
      if (progress.selectedNumber) setSelectedNumber(progress.selectedNumber);
      setFeedback("Desenho recuperado de onde parou.");
    } catch {
      localStorage.removeItem("sk_desenhos_progress");
    }
  }, [setSelectedNumber]);

  useEffect(() => {
    localStorage.setItem("sk_desenhos_progress", JSON.stringify({ drawingId, filled, selectedNumber }));
  }, [drawingId, filled, selectedNumber]);

  const chooseDrawing = (id) => {
    const next = numberDrawings.find((item) => item.id === id) || numberDrawings[0];
    setDrawingId(next.id);
    setFilled({});
    setFeedback(`Desenho ${next.title}. Escolha uma cor pelo número.`);
    speak(`Desenho ${next.title}. Escolha uma cor pelo número.`);
  };

  const chooseColor = (number) => {
    setSelectedNumber(number);
    speak(`Número ${drawingNumber(number)}, ${drawingColors[number].label}.`);
    setFeedback(`Número ${drawingNumber(number)}: ${drawingColors[number].label}.`);
  };

  const paintCell = (rowIndex, colIndex, value) => {
    const key = `${rowIndex}-${colIndex}`;
    if (filled[key]) return;
    if (value !== selectedNumber) {
      const message = `Este quadradinho é número ${drawingNumber(value)}. Escolha ${drawingColors[value].label}.`;
      setFeedback(message);
      speak(message);
      return;
    }
    const nextFilled = { ...filled, [key]: true };
    setFilled(nextFilled);
    bump();
    if (Object.keys(nextFilled).length >= totalCells) {
      const message = `Muito bem. Você terminou o desenho ${drawing.title}.`;
      setFeedback(message);
      speak(message);
    } else {
      speak(`Pintou o número ${drawingNumber(value)}.`);
      setFeedback(`Pintou o número ${drawingNumber(value)}.`);
    }
  };

  const reveal = () => {
    const next = {};
    drawing.cells.forEach((row, rowIndex) => row.split("").forEach((_, colIndex) => {
      next[`${rowIndex}-${colIndex}`] = true;
    }));
    setFilled(next);
    speak(`Modelo do desenho ${drawing.title}.`);
  };

  const restart = () => {
    if (!window.confirm("A pintura será reiniciada. Deseja continuar?")) return;
    setFilled({});
    setFeedback("Desenho recomeçado. Escolha uma cor pelo número.");
    speak("Desenho recomeçado.");
  };

  return <section className="drawing-board">
    <div className="paint-toolbar">
      <label className="drawing-picker">Escolher desenho
        <select value={drawing.id} onChange={(event) => chooseDrawing(event.target.value)}>
          {numberDrawings.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>
      <button className="tool" onClick={() => speak(`Escolha uma cor pelo número e pinte todos os quadradinhos daquele número.`)}>Falar instrução</button>
      <button className="tool" onClick={restart}>Recomeçar</button>
      <button className="tool primary" onClick={reveal}>Ver modelo</button>
    </div>

    <div className="drawing-layout">
      <div className="number-canvas" style={{ "--draw-cols": drawing.cols }}>
        {drawing.cells.flatMap((row, rowIndex) => row.split("").map((value, colIndex) => {
          const key = `${rowIndex}-${colIndex}`;
          const filledCell = filled[key];
          return <button
            key={key}
            className={`number-cell ${filledCell ? "filled" : ""}`}
            onClick={() => paintCell(rowIndex, colIndex, value)}
            style={{ "--cell-color": drawingColors[value].color }}
            aria-label={`número ${drawingNumber(value)}`}
          >
            {filledCell ? "" : drawingNumber(value)}
          </button>;
        }))}
      </div>
    </div>

    <div className="round-panel">
      <strong>{drawing.title}</strong>
      <span>{filledCount} de {totalCells} quadradinho(s) pintado(s)</span>
      <button className="tool primary" disabled={!completed} onClick={() => speak(`Parabéns. Você terminou o desenho ${drawing.title}.`)}>Celebrar</button>
    </div>
    <p className={feedback.includes("Este quadradinho") ? "syllable-feedback error" : "syllable-feedback"}>{feedback}</p>
  </section>;
}

function Alphabet({ letter, setLetter, addPhrase, words, status, saveCurrentLetter, saveWordsForLetter, submitPendingWord, isRoot }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [chosen, setChosen] = useState([]);
  const [feedback, setFeedback] = useState("Escolha uma palavra para treinar as sílabas.");
  const [roundIndex, setRoundIndex] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [newWord, setNewWord] = useState("");
  const [newIcon, setNewIcon] = useState("🔤");
  const [newSyllables, setNewSyllables] = useState("");

  const roundWords = useMemo(() => {
    const start = roundIndex * 4;
    return words.slice(start, start + 4);
  }, [roundIndex, words]);

  const roundFinished = roundWords.length > 0 && completed.length >= roundWords.length;
  const hasNextRound = (roundIndex + 1) * 4 < words.length;
  const canRestartRounds = roundFinished && !hasNextRound && words.length > 4;

  const startWord = (item) => {
    const syllables = item.syllables?.length ? item.syllables : getSyllables(item.word);
    setSelectedWord({ ...item, syllables, options: syllableOptions(syllables) });
    setChosen([]);
    setFeedback(`Monte a palavra ${item.word} tocando nas sílabas em ordem.`);
    speak(item.word);
  };

  const selectSyllable = (option) => {
    if (!selectedWord) return;
    const nextIndex = chosen.length;
    const correct = selectedWord.syllables[nextIndex];

    if (option.index !== nextIndex) {
      const message = `A sílaba correta agora é ${correct}.`;
      setFeedback(message);
      speak(message);
      return;
    }

    const nextChosen = chosen.concat(option.syllable);
    setChosen(nextChosen);
    speak(option.syllable);

    if (nextChosen.length === selectedWord.syllables.length) {
      const message = `Muito bem. Você formou ${selectedWord.word}.`;
      setFeedback(message);
      speak(message);
      addPhrase({ text: selectedWord.word, icon: selectedWord.icon, category: "alphabet", color: "c-routine" }, { silent: true });
      setCompleted((current) => current.includes(selectedWord.word) ? current : current.concat(selectedWord.word));
      return;
    }

    setFeedback(`Agora escolha a sílaba ${selectedWord.syllables[nextChosen.length]}.`);
  };

  const resetPractice = () => {
    setSelectedWord(null);
    setChosen([]);
    setCompleted([]);
    setRoundIndex(0);
    setFeedback("Escolha uma palavra para treinar as sílabas.");
  };

  const nextRound = () => {
    setRoundIndex(hasNextRound ? roundIndex + 1 : 0);
    setSelectedWord(null);
    setChosen([]);
    setCompleted([]);
    setFeedback(hasNextRound ? "Escolha uma das novas palavras para treinar as sílabas." : "A lista recomeçou. Escolha uma palavra para treinar.");
    speak(hasNextRound ? "Outras palavras." : "A lista recomeçou.");
  };

  const addDatabaseWord = async (event) => {
    event.preventDefault();
    const word = newWord.trim();
    if (!word) return;

    const alreadyExists = words.some((item) => wordKey(item.word) === wordKey(word));
    if (alreadyExists) {
      setFeedback(`A palavra ${word} já existe na letra ${letter}.`);
      speak(`A palavra ${word} já existe.`);
      return;
    }

    if (words.length >= 100) {
      setFeedback(`A letra ${letter} já tem 100 palavras. Remova uma palavra no Firebase antes de adicionar outra.`);
      speak("Esta letra já tem cem palavras.");
      return;
    }

    const syllables = newSyllables
      .split("-")
      .map((item) => item.trim())
      .filter(Boolean);
    const newItem = { word, icon: newIcon.trim() || "🔤", syllables: syllables.length ? syllables : getSyllables(word) };
    const nextWords = words.concat(newItem);

    if (isRoot) {
      await saveWordsForLetter(nextWords);
      setFeedback(`Palavra ${word} adicionada à letra ${letter}.`);
      speak(`Palavra ${word} adicionada.`);
    } else {
      await submitPendingWord(newItem);
      setFeedback(`Palavra ${word} enviada para aprovação do usuário root.`);
      speak("Palavra enviada para aprovação.");
    }
    setNewWord("");
    setNewIcon("🔤");
    setNewSyllables("");
  };

  return <div className="alphabet-board">
    <div className="letter-grid">{alphabet.map((item) => <button key={item} className={`letter-btn ${letter === item ? "active" : ""}`} onClick={() => { setLetter(item); resetPractice(); speak(`Letra ${item}`); }}>{item}</button>)}</div>
    <div className="letter-title">
      <div>
        <strong>Letra {letter}</strong>
        <small>{status}</small>
      </div>
      <div className="letter-actions">
        <button className="tool" onClick={() => speak(`Letra ${letter}`)}>Falar letra</button>
        {isRoot && <button className="tool" onClick={saveCurrentLetter}>Salvar no Firebase</button>}
      </div>
    </div>
    <div className="round-panel">
      <strong>Rodada de 4 palavras</strong>
      <span>{completed.length} de {roundWords.length} concluída(s) · {words.length} no total</span>
      {roundFinished && hasNextRound && <button className="tool primary" onClick={nextRound}>Outras palavras</button>}
      {canRestartRounds && <button className="tool primary" onClick={nextRound}>Recomeçar lista</button>}
    </div>
    <form className="word-builder" onSubmit={addDatabaseWord}>
      <input value={newWord} onChange={(event) => setNewWord(event.target.value)} placeholder={`Nova palavra com ${letter}`} />
      <input value={newIcon} onChange={(event) => setNewIcon(event.target.value)} placeholder="Imagem ou símbolo" maxLength="8" />
      <input value={newSyllables} onChange={(event) => setNewSyllables(event.target.value)} placeholder="Sílabas: ca-sa" />
      <button className="tool primary">{isRoot ? "Adicionar ao banco" : "Enviar para aprovação"}</button>
    </form>
    <div className="word-grid">{roundWords.map((item) => <button key={item.word} className={`word-card ${selectedWord?.word === item.word ? "active" : ""} ${completed.includes(item.word) ? "done" : ""}`} onClick={() => startWord(item)}><Picto value={item.icon} /><span><strong>{item.word}</strong><small>{completed.includes(item.word) ? "Concluída" : "Treinar sílabas"}</small></span></button>)}</div>
    {selectedWord && <section className="syllable-panel" aria-live="polite">
      <div className="syllable-word">
        <Picto value={selectedWord.icon} />
        <div>
          <strong>{selectedWord.word}</strong>
          <small>{selectedWord.syllables.join(" - ")}</small>
        </div>
      </div>
      <div className="syllable-slots">
        {selectedWord.syllables.map((syllable, index) => <span key={`${syllable}-${index}`} className={chosen[index] ? "filled" : ""}>{chosen[index] || "..."}</span>)}
      </div>
      <div className="syllable-options">
        {selectedWord.options.map((option) => <button key={`${option.syllable}-${option.index}`} className="syllable-btn" disabled={option.index < chosen.length} onClick={() => selectSyllable(option)}>{option.syllable}</button>)}
      </div>
      <p className={feedback.includes("correta") ? "syllable-feedback error" : "syllable-feedback"}>{feedback}</p>
      <div className="prompt-actions">
        <button className="tool" onClick={() => speak(selectedWord.syllables[chosen.length] ? `A próxima sílaba é ${selectedWord.syllables[chosen.length]}` : selectedWord.word)}>Dica</button>
        <button className="tool" onClick={() => startWord(selectedWord)}>Recomeçar palavra</button>
      </div>
    </section>}
  </div>;
}

function Routines({ bump }) {
  return <div className="routine-list">{routines.map((routine) => <article className="routine-card" key={routine.title}><div className="routine-head"><h3>{routine.title}</h3><button className="icon-btn" onClick={() => speak(routine.steps.map(([label]) => label).join(". "))}>▶</button></div><div className="steps">{routine.steps.map(([label, icon]) => <button className="step" key={label} onClick={() => { speak(label); bump(); }}><span>{icon}</span>{label}</button>)}</div></article>)}</div>;
}

const mathOperations = {
  add: { label: "Somar", symbol: "+", speak: "mais", icon: "➕" },
  subtract: { label: "Diminuir", symbol: "-", speak: "menos", icon: "➖" },
  multiply: { label: "Multiplicar", symbol: "×", speak: "vezes", icon: "✖️" },
  divide: { label: "Dividir", symbol: "÷", speak: "dividido por", icon: "➗" }
};

function createMathProblem(operation, level = "medio") {
  const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const easy = level === "facil";
  let left = easy ? random(1, 4) : random(1, 9);
  let right = easy ? random(1, 3) : random(1, 9);
  let answer = left + right;

  if (operation === "subtract") {
    left = easy ? random(1, 5) : random(2, 12);
    right = random(1, left);
    answer = left - right;
  } else if (operation === "multiply") {
    left = easy ? random(1, 3) : random(1, 5);
    right = easy ? random(1, 3) : random(1, 5);
    answer = left * right;
  } else if (operation === "divide") {
    right = easy ? random(1, 3) : random(1, 5);
    answer = easy ? random(1, 3) : random(1, 5);
    left = right * answer;
  }

  const options = new Set([answer]);
  while (options.size < 4) {
    options.add(Math.max(0, answer + random(easy ? -2 : -4, easy ? 2 : 4)));
  }

  return { left, right, answer, options: Array.from(options).sort(() => Math.random() - 0.5) };
}

function MathPractice({ bump }) {
  const [operation, setOperation] = useState("add");
  const [level, setLevel] = useState("medio");
  const [problem, setProblem] = useState(() => createMathProblem("add", "medio"));
  const [feedback, setFeedback] = useState("Escolha uma operação e toque em uma resposta.");
  const currentOperation = mathOperations[operation];
  const spokenProblem = `${problem.left} ${currentOperation.speak} ${problem.right}`;

  const newProblem = (nextOperation = operation, nextLevel = level) => {
    const nextProblem = createMathProblem(nextOperation, nextLevel);
    const operationText = mathOperations[nextOperation];
    setProblem(nextProblem);
    setFeedback(`Quanto é ${nextProblem.left} ${operationText.symbol} ${nextProblem.right}?`);
    speak(`Quanto é ${nextProblem.left} ${operationText.speak} ${nextProblem.right}?`);
  };

  const chooseOperation = (nextOperation) => {
    setOperation(nextOperation);
    newProblem(nextOperation);
  };

  const chooseLevel = (nextLevel) => {
    setLevel(nextLevel);
    newProblem(operation, nextLevel);
  };

  const answer = (value) => {
    bump();
    if (value === problem.answer) {
      const message = `Muito bem. ${spokenProblem} é igual a ${problem.answer}.`;
      setFeedback(message);
      speak(message);
      return;
    }
    const message = `Ainda não. A resposta correta é ${problem.answer}.`;
    setFeedback(message);
    speak(message);
  };

  return <section className="math-board">
    <div className="math-level">
      <span>Nível</span>
      <div className="segmented">
        <button className={level === "facil" ? "active" : ""} onClick={() => chooseLevel("facil")}>Fácil</button>
        <button className={level === "medio" ? "active" : ""} onClick={() => chooseLevel("medio")}>Médio</button>
      </div>
    </div>

    <div className="operation-grid">
      {Object.entries(mathOperations).map(([id, item]) => <button key={id} className={`operation-btn ${operation === id ? "active" : ""}`} onClick={() => chooseOperation(id)}>
        <span>{item.icon}</span><strong>{item.label}</strong>
      </button>)}
    </div>

    <article className="math-card">
      <div className="math-problem" aria-label={`Conta: ${problem.left} ${currentOperation.label} ${problem.right}`}>
        <span>{problem.left}</span><small>{currentOperation.symbol}</small><span>{problem.right}</span>
      </div>
      <div className="math-actions">
        <button className="tool" onClick={() => speak(`Quanto é ${spokenProblem}?`)}>Falar conta</button>
        <button className="tool" onClick={() => speak(`Pense em ${problem.left}, ${currentOperation.speak}, ${problem.right}.`)}>
          Dica
        </button>
        <button className="tool primary" onClick={() => newProblem()}>Nova continha</button>
      </div>
    </article>

    <div className="answer-grid">
      {problem.options.map((option) => <button key={option} className="answer-btn" onClick={() => answer(option)}>{option}</button>)}
    </div>

    <p className={feedback.includes("Ainda") ? "syllable-feedback error" : "syllable-feedback"}>{feedback}</p>
  </section>;
}

function Exercises({ bump }) {
  return <div className="exercise-list">{exercises.map((exercise) => <article className="exercise-card" key={exercise.title}><div className="exercise-head"><h3>{exercise.title}</h3><button className="icon-btn" onClick={() => { speak(exercise.phrase); bump(); }}>▶</button></div><p>{exercise.text}</p></article>)}</div>;
}

function Prompts({ setPhrase, bump }) {
  return <div className="prompt-list"><div className="prompt-note">Use a menor ajuda possível, aguarde a resposta e reduza a pista assim que a criança conseguir comunicar por olhar, gesto, toque, som, palavra ou frase.</div>{prompts.map((prompt) => <article className="prompt-card" key={prompt.level}><div className="prompt-head"><div><span className="prompt-level">{prompt.level}</span><h3>{prompt.title}</h3></div><button className="icon-btn" onClick={() => speak(prompt.model)}>▶</button></div><p>{prompt.text}</p><div className="prompt-actions"><button className="tool" onClick={() => { speak(prompt.model); bump(); }}>Ouvir modelo</button><button className="tool primary" onClick={() => { setPhrase([{ text: prompt.phrase, icon: "💬", category: "need", color: "c-need" }]); speak(prompt.phrase); bump(); }}>Aplicar na frase</button></div></article>)}</div>;
}

function AdminApprovals() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("Carregando palavras pendentes.");
  const [busy, setBusy] = useState("");

  const loadPending = async () => {
    if (!db) return;
    const snapshot = await getDocs(query(collection(db, "palavras_pendentes"), where("status", "==", "pendente")));
    const pending = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    setItems(pending);
    setMessage(pending.length ? `${pending.length} palavra(s) aguardando aprovação.` : "Nenhuma palavra pendente no momento.");
  };

  useEffect(() => {
    loadPending().catch(() => setMessage("Não foi possível carregar as aprovações."));
  }, []);

  const approve = async (item) => {
    setBusy(item.id);
    try {
      const letterRef = doc(db, "alfabeto", item.letra);
      const letterSnapshot = await getDoc(letterRef);
      const current = letterSnapshot.exists() && Array.isArray(letterSnapshot.data().palavras) ? letterSnapshot.data().palavras : [];
      const exists = current.some((word) => wordKey(word.palavra || word.word || "") === wordKey(item.palavra));

      if (exists) {
        await updateDoc(doc(db, "palavras_pendentes", item.id), {
          status: "duplicada",
          motivoRevisao: `A palavra ${item.palavra} já existe na letra ${item.letra}.`,
          revisadoEm: serverTimestamp()
        });
        setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id));
        setMessage(`A palavra "${item.palavra}" já existe na letra ${item.letra} e não foi salva em duplicidade.`);
        return;
      }

      const palavras = current.concat({
        palavra: item.palavra,
        imagem: item.imagem || "🔤",
        silabas: Array.isArray(item.silabas) && item.silabas.length ? item.silabas : getSyllables(item.palavra)
      }).slice(0, 100);
      await setDoc(letterRef, { palavras, atualizadoEm: new Date().toISOString() }, { merge: true });
      await updateDoc(doc(db, "palavras_pendentes", item.id), {
        status: "aprovada",
        revisadoEm: serverTimestamp()
      });
      await loadPending();
      setMessage(`A palavra "${item.palavra}" foi aprovada e salva na letra ${item.letra}.`);
    } catch {
      setMessage("Não foi possível aprovar esta palavra.");
    } finally {
      setBusy("");
    }
  };

  const reject = async (item) => {
    setBusy(item.id);
    try {
      await updateDoc(doc(db, "palavras_pendentes", item.id), {
        status: "rejeitada",
        revisadoEm: serverTimestamp()
      });
      await loadPending();
    } catch {
      setMessage("Não foi possível rejeitar esta palavra.");
    } finally {
      setBusy("");
    }
  };

  return <section className="admin-panel">
    <div className="prompt-note">{message}</div>
    <div className="approval-list">
      {items.map((item) => <article className="approval-card" key={item.id}>
        <div className="approval-word">
          <Picto value={item.imagem || "🔤"} />
          <div>
            <h3>{item.palavra}</h3>
            <p>Letra {item.letra} · {(item.silabas || []).join(" - ")}</p>
            <small>Usuário: {item.criadoPorNome || "Nome não informado"} · {item.criadoPorEmail || "e-mail não informado"}</small>
          </div>
        </div>
        <div className="prompt-actions">
          <button className="tool primary" disabled={busy === item.id} onClick={() => approve(item)}>Aprovar</button>
          <button className="tool" disabled={busy === item.id} onClick={() => reject(item)}>Rejeitar</button>
        </div>
      </article>)}
    </div>
  </section>;
}

function AdminUsers({ planSettings }) {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("Carregando usuários.");
  const [busy, setBusy] = useState("");
  const [form, setForm] = useState({ nome: "", usuario: "", telefone: "", email: "", senha: "", plano: "free", papel: "cliente", status: "ativo", pagamento: "ativo", mensalidade: "", desconto: "", vencimento: "" });

  const loadUsers = async () => {
    if (!db) return;
    const snapshot = await getDocs(collection(db, "usuarios"));
    const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (a.nomeCompleto || "").localeCompare(b.nomeCompleto || "", "pt-BR"));
    setUsers(list);
    setMessage(`${list.length} usuário(s) cadastrado(s).`);
  };

  useEffect(() => {
    loadUsers().catch(() => setMessage("Não foi possível carregar os usuários."));
  }, []);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: field === "telefone" ? formatBrazilPhone(value) : value }));
  };

  const createAdminUser = async (event) => {
    event.preventDefault();
    const usuario = normalizeUsername(form.usuario);
    if (form.nome.trim().split(/\s+/).length < 2) return setMessage("Digite o nome completo.");
    if (!/^[a-z0-9._-]{3,20}$/.test(usuario)) return setMessage("Digite um usuário válido.");
    if (!isValidBrazilPhone(form.telefone)) return setMessage("Digite um telefone válido com DDD.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setMessage("Digite um e-mail válido.");
    if (form.senha.length < 6) return setMessage("A senha precisa ter pelo menos 6 caracteres.");

    setBusy("create");
    try {
      const usernameRef = doc(db, "usuarios_por_usuario", usuario);
      const usernameSnapshot = await getDoc(usernameRef);
      if (usernameSnapshot.exists()) {
        setMessage("Este usuário já está em uso.");
        setBusy("");
        return;
      }

      const secondaryApp = initializeApp(firebaseConfig, `admin-create-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      const credential = await createUserWithEmailAndPassword(secondaryAuth, form.email.trim(), form.senha);
      await updateProfile(credential.user, { displayName: form.nome.trim() });
      const proValue = Number(planSettings?.proMensalidade || 0);
      const monthlyValue = Number(form.mensalidade || 0) || (form.plano === "pro" ? proValue : 0);
      const discountValue = Number(form.desconto || 0);
      const profile = {
        nomeCompleto: form.nome.trim(),
        usuario,
        telefone: onlyDigits(form.telefone),
        telefoneFormatado: formatBrazilPhone(form.telefone),
        email: form.email.trim().toLowerCase(),
        plano: form.plano,
        limiteDiarioMinutos: form.plano === "free" ? 10 : null,
        papel: form.papel,
        status: form.status,
        pagamento: form.pagamento,
        mensalidade: monthlyValue,
        desconto: discountValue,
        valorFinal: Math.max(0, monthlyValue - discountValue),
        vencimento: form.vencimento || nextMonthlyDueDate(),
        adesaoProEm: form.plano === "pro" ? serverTimestamp() : null,
        criadoPeloRoot: true,
        origemCadastro: getRegistrationOrigin("criado_pelo_root"),
        criadoEm: serverTimestamp()
      };
      await setDoc(doc(db, "usuarios", credential.user.uid), profile);
      await setDoc(usernameRef, { uid: credential.user.uid, email: profile.email, criadoEm: serverTimestamp() });
      await signOut(secondaryAuth);
      setForm({ nome: "", usuario: "", telefone: "", email: "", senha: "", plano: "free", papel: "cliente", status: "ativo", pagamento: "ativo", mensalidade: "", desconto: "", vencimento: "" });
      setMessage("Usuário criado com sucesso.");
      await loadUsers();
    } catch (error) {
      setMessage(authMessage(error));
    } finally {
      setBusy("");
    }
  };

  const updateUserField = async (user, field, value) => {
    setBusy(user.id);
    try {
      const patch = { [field]: ["mensalidade", "desconto"].includes(field) ? Number(value || 0) : value };
      if (["mensalidade", "desconto"].includes(field)) {
        const mensalidade = field === "mensalidade" ? Number(value || 0) : Number(user.mensalidade || 0);
        const desconto = field === "desconto" ? Number(value || 0) : Number(user.desconto || 0);
        patch.valorFinal = Math.max(0, mensalidade - desconto);
      }
      if (field === "plano") {
        patch.limiteDiarioMinutos = value === "free" ? 10 : null;
        if (value === "pro") {
          const proAdhesionDate = new Date();
          const proValue = Number(planSettings?.proMensalidade || 0);
          patch.mensalidade = Number(user.mensalidade || 0) || proValue;
          patch.valorFinal = Math.max(0, patch.mensalidade - Number(user.desconto || 0));
          if ((user.plano || "free") !== "pro") {
            patch.adesaoProEm = serverTimestamp();
            patch.vencimento = nextMonthlyDueDate(proAdhesionDate);
          }
          if (user.pagamento === "isento") patch.pagamento = "pendente";
        }
      }
      await setDoc(doc(db, "usuarios", user.id), patch, { merge: true });
      await loadUsers();
      setMessage("Usuário atualizado.");
    } catch {
      setMessage("Não foi possível atualizar o usuário.");
    } finally {
      setBusy("");
    }
  };

  const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatRegistrationDate = (value) => {
    const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "Sem data";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return <section className="admin-panel">
    <div className="prompt-note">{message}</div>
    <form className="admin-create-form" onSubmit={createAdminUser}>
      <input value={form.nome} onChange={(event) => updateForm("nome", event.target.value)} placeholder="Nome completo" />
      <input value={form.usuario} onChange={(event) => updateForm("usuario", event.target.value)} placeholder="Usuário" />
      <input value={form.telefone} onChange={(event) => updateForm("telefone", event.target.value)} placeholder="Telefone com DDD" />
      <input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="E-mail" />
      <input type="password" value={form.senha} onChange={(event) => updateForm("senha", event.target.value)} placeholder="Senha" />
      <select value={form.plano} onChange={(event) => updateForm("plano", event.target.value)}>
        <option value="free">Plano Free</option>
        <option value="pro">Plano Pro</option>
      </select>
      <select value={form.papel} onChange={(event) => updateForm("papel", event.target.value)}>
        <option value="cliente">Cliente</option>
        <option value="parceiro">Parceiro</option>
        <option value="root">Root</option>
      </select>
      <select value={form.status} onChange={(event) => updateForm("status", event.target.value)}>
        <option value="ativo">Ativo</option>
        <option value="bloqueado">Bloqueado</option>
        <option value="cancelado">Cancelado</option>
      </select>
      <select value={form.pagamento} onChange={(event) => updateForm("pagamento", event.target.value)}>
        <option value="ativo">Ativo</option>
        <option value="pendente">Pendente</option>
        <option value="atrasado">Atrasado</option>
        <option value="isento">Isento</option>
      </select>
      <input type="number" min="0" step="0.01" value={form.mensalidade} onChange={(event) => updateForm("mensalidade", event.target.value)} placeholder="Mensalidade" />
      <input type="number" min="0" step="0.01" value={form.desconto} onChange={(event) => updateForm("desconto", event.target.value)} placeholder="Desconto" />
      <input type="date" value={form.vencimento} onChange={(event) => updateForm("vencimento", event.target.value)} />
      <button className="tool primary" disabled={busy === "create"}>{busy === "create" ? "Criando..." : "Criar usuário"}</button>
    </form>

    <div className="user-ledger">
      <div className="user-ledger-head">
        <span>Nome</span><span>Usuário</span><span>Telefone</span><span>E-mail</span><span>Cadastro</span><span>Origem</span><span>Fuso/Idioma</span><span>Plano</span><span>Migração Pro</span><span>Tipo</span><span>Status</span><span>Pagamento</span><span>Mensalidade</span><span>Desconto</span><span>Valor final</span><span>Vencimento</span>
      </div>
      {users.map((user) => <article className="user-ledger-row" key={user.id}>
        <strong className="user-field">{user.nomeCompleto || "Sem nome"}</strong>
        <span className="user-field">{user.usuario || "sem usuário"}</span>
        <span className="user-field">{user.telefoneFormatado || user.telefone || "sem telefone"}</span>
        <span className="user-field">{user.email || "sem e-mail"}</span>
        <span className="registration-date">{formatRegistrationDate(user.criadoEm)}</span>
        <span className="user-field">{user.origemCadastro?.tipo === "criado_pelo_root" ? "Root" : "Cadastro"}</span>
        <span className="user-field">{user.origemCadastro?.fusoHorario || "sem fuso"} · {user.origemCadastro?.idioma || "sem idioma"}</span>
        <select value={user.plano || "free"} disabled={busy === user.id} onChange={(event) => updateUserField(user, "plano", event.target.value)}>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
        <span className="registration-date">{user.adesaoProEm ? formatRegistrationDate(user.adesaoProEm) : "Sem adesão"}</span>
        <select value={user.papel || "cliente"} disabled={busy === user.id} onChange={(event) => updateUserField(user, "papel", event.target.value)}>
          <option value="cliente">Cliente</option>
          <option value="parceiro">Parceiro</option>
          <option value="root">Root</option>
        </select>
        <select value={user.status || "ativo"} disabled={busy === user.id} onChange={(event) => updateUserField(user, "status", event.target.value)}>
          <option value="ativo">Ativo</option>
          <option value="bloqueado">Bloqueado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <select value={user.pagamento || "ativo"} disabled={busy === user.id} onChange={(event) => updateUserField(user, "pagamento", event.target.value)}>
          <option value="ativo">Ativo</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
          <option value="isento">Isento</option>
        </select>
        <input type="number" min="0" step="0.01" value={user.mensalidade || ""} onChange={(event) => updateUserField(user, "mensalidade", event.target.value)} />
        <input type="number" min="0" step="0.01" value={user.desconto || ""} onChange={(event) => updateUserField(user, "desconto", event.target.value)} />
        <strong className="money">{money(user.valorFinal ?? (Number(user.mensalidade || 0) - Number(user.desconto || 0)))}</strong>
        <input type="date" value={user.vencimento || nextMonthlyDueDate(user.criadoEm)} onChange={(event) => updateUserField(user, "vencimento", event.target.value)} />
      </article>)}
    </div>
  </section>;
}

function AdminSettings({ planSettings, setPlanSettings }) {
  const [form, setForm] = useState({
    proMensalidade: String(planSettings.proMensalidade || ""),
    freeMinutosDiarios: String(planSettings.freeMinutosDiarios || 10)
  });
  const [message, setMessage] = useState("Configure o valor exibido para migração ao Plano Pro.");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      proMensalidade: String(planSettings.proMensalidade || ""),
      freeMinutosDiarios: String(planSettings.freeMinutosDiarios || 10)
    });
  }, [planSettings]);

  const saveSettings = async (event) => {
    event.preventDefault();
    const nextSettings = {
      proMensalidade: Number(form.proMensalidade || 0),
      freeMinutosDiarios: Math.max(1, Number(form.freeMinutosDiarios || 10)),
      atualizadoEm: new Date().toISOString()
    };

    if (nextSettings.proMensalidade <= 0) {
      setMessage("Informe um valor válido para o Plano Pro.");
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, "configuracoes", "planos"), nextSettings, { merge: true });
      setPlanSettings((current) => ({ ...current, ...nextSettings }));
      setMessage("Configuração salva com sucesso.");
    } catch {
      setMessage("Não foi possível salvar a configuração.");
    } finally {
      setSaving(false);
    }
  };

  const price = Number(form.proMensalidade || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return <section className="admin-panel settings-panel">
    <div className="prompt-note">{message}</div>
    <form className="settings-form" onSubmit={saveSettings}>
      <label>Valor mensal do Plano Pro
        <input type="number" min="0" step="0.01" value={form.proMensalidade} onChange={(event) => setForm((current) => ({ ...current, proMensalidade: event.target.value }))} placeholder="49.90" />
      </label>
      <label>Minutos diários do Plano Free
        <input type="number" min="1" step="1" value={form.freeMinutosDiarios} onChange={(event) => setForm((current) => ({ ...current, freeMinutosDiarios: event.target.value }))} />
      </label>
      <article className="plan-preview">
        <strong>Prévia para o usuário</strong>
        <p>Migrar para Pro por {price}/mês</p>
      </article>
      <button className="tool primary" disabled={saving}>{saving ? "Salvando..." : "Salvar configuração"}</button>
    </form>
  </section>;
}

function Progress({ name, notes, setNotes, count }) {
  const displayName = name || "A criança";
  return <div className="note-list"><article className="note-card"><h3>Observações do cuidador ou terapeuta</h3><p>Registre padrões de comunicação, gatilhos sensoriais, preferências e sons que a criança tentou produzir.</p><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ex.: hoje apontou para água sem ajuda." /></article><article className="note-card"><h3>Uso recente</h3><p>{count ? `${displayName} teve ${count} interações registradas neste navegador.` : "Nenhuma interação registrada ainda."}</p><div className="meter"><span style={{ width: `${Math.min(100, count * 8)}%` }} /></div></article><article className="note-card"><h3>Aviso importante</h3><p>Este sistema é apoio educativo e de comunicação. Para avaliação, diagnóstico ou plano terapêutico, procure profissionais especializados.</p></article></div>;
}

function PhrasePanel({ phrase, setPhrase, phraseText }) {
  return <aside className="phrase-panel"><strong>Frase atual</strong><div className="phrase-output">{phrase.length ? phrase.map((item, index) => <button className="token" key={`${item.text}-${index}`} onClick={() => setPhrase(phrase.filter((_, itemIndex) => itemIndex !== index))}><Picto value={item.icon} />{item.text}</button>) : <span className="empty">Toque nos símbolos para montar uma mensagem.</span>}</div><div className="actions"><button className="tool primary" onClick={() => phraseText && speak(phraseText)}>Falar</button><button className="tool" onClick={() => setPhrase([])}>Limpar</button><button className="tool warning" onClick={() => { setPhrase([{ text: "Preciso de ajuda", icon: "🆘", category: "need", color: "c-need" }]); speak("Preciso de ajuda"); }}>Ajuda</button><button className="tool" onClick={() => phraseText && navigator.clipboard?.writeText(phraseText)}>Copiar</button></div></aside>;
}

createRoot(document.getElementById("root")).render(<App />);
