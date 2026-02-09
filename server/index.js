import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

import fs from "fs";
import multer from "multer";
import { Blob } from "buffer";

dotenv.config();
// ===== PAYPAL CONFIG =====
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const PAYPAL_ENV = (process.env.PAYPAL_ENV || "sandbox").toLowerCase(); // "sandbox" | "live"
const PAYPAL_API_BASE =
  PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) return null;

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const r = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) return null;
  return j.access_token;
}

async function capturePayPalOrder(orderId) {
  const token = await getPayPalAccessToken();
  if (!token) return { ok: false, error: "PAYPAL_NO_TOKEN" };

  const r = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, error: "PAYPAL_CAPTURE_FAILED", detail: j };

  return { ok: true, data: j };
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
// ===== ELEVENLABS (Option A – Jesus spricht) =====
// Nur Vorbereitung: wird in Schritt A1 noch NICHT in den Chat eingebunden.
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const JESUS_VOICE_ID = process.env.JESUS_VOICE_ID || "";

/**
 * Erzeugt TTS-Audio (Buffer) für Jesus via ElevenLabs.
 * WICHTIG: KEIN Audio-Player im Frontend, Chat bleibt textbasiert.
 * In Schritt A1 wird diese Funktion noch NICHT aufgerufen.
 */
const MARIA_VOICE_ID = process.env.MARIA_VOICE_ID || "";
const JOSEF_VOICE_ID = process.env.JOSEF_VOICE_ID || "";
// ===== VOICE CREDIT COST (APP-INTERN) =====
const VOICE_CREDIT_COST = {
  min: 1,
  per1kChars: 1
};



function normalizeTtsText(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";

  // 1) Normalisieren: Zeilenumbrüche vereinheitlichen
  const cleaned = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2) In sinnvolle Zeilen splitten, leere Zeilen entfernen
  let lines = cleaned
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);

  // 3) WICHTIG: Wenn die ersten Zeilen sehr kurz sind, zusammenziehen
  // (damit der Anfang nicht "abgehackt/zu schnell" wirkt)
  if (lines.length >= 2) {
    const first = lines[0];
    const second = lines[1];
    if (first.length < 60) {
      lines = [
        `${first}, ${second}`,
        ...lines.slice(2)
      ];
    }
  }

  // 4) Aus Zeilen einen flüssigen Sprechtext machen (keine harten Abbrüche)
  let t = lines.join(" ");
t = ". " + t;


  // 5) Spaces glätten
  t = t.replace(/[ \t]+/g, " ").trim();

  // 6) Start-Priming: eine kleine „Anlauf-Pause“, ohne Inhalt zu verändern
  // (Ellipsis + Satzzeichen wirkt bei ElevenLabs oft als ruhiger Start)
  

  // 7) Längenbegrenzung (sicher)
  if (t.length > 4500) t = t.slice(0, 4500).trim();

  return t;
}


/**
 * Erzeugt TTS-Audio (Buffer) für Josef via ElevenLabs.
 */
const EN_VOICE_SETTINGS = {
  stability: 0.95,
  similarity_boost: 0.45,
  style: 0.0,
  use_speaker_boost: false,
  speed: 0.85
};

async function synthesizeJosefSpeech(text, lang = "de") {
 const t = normalizeTtsText(text);

  if (!t) return { ok: false, error: "NO_TEXT" };
  if (!ELEVENLABS_API_KEY) return { ok: false, error: "NO_ELEVENLABS_API_KEY" };
  if (!JOSEF_VOICE_ID) return { ok: false, error: "NO_JOSEF_VOICE_ID" };

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${JOSEF_VOICE_ID}?output_format=mp3_44100_128&optimize_streaming_latency=3`;

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg"
    },
    body: JSON.stringify({
  text: t,
 model_id: "eleven_multilingual_v2",
  voice_settings: {
  stability: 0.85,
  similarity_boost: 0.80,
  style: 0.00,
  use_speaker_boost: false,
  speed: 0.95
}

})

  });

  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    return { ok: false, error: "ELEVENLABS_TTS_FAILED", status: r.status, detail };
  }

  const ab = await r.arrayBuffer();
  const audioBuffer = Buffer.from(ab);
  return { ok: true, audioBuffer, mime: "audio/mpeg" };
}

/**
 * Erzeugt TTS-Audio (Buffer) für Maria via ElevenLabs.
 */

async function synthesizeMariaSpeech(text, lang = "de") {
  const t = normalizeTtsText(text);

  if (!t) return { ok: false, error: "NO_TEXT" };
  if (!ELEVENLABS_API_KEY) return { ok: false, error: "NO_ELEVENLABS_API_KEY" };
  if (!MARIA_VOICE_ID) return { ok: false, error: "NO_MARIA_VOICE_ID" };

 const url = `https://api.elevenlabs.io/v1/text-to-speech/${MARIA_VOICE_ID}?output_format=mp3_44100_128&optimize_streaming_latency=3`;

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg"
    },
    body: JSON.stringify({
  text: t,
  model_id: "eleven_multilingual_v2",
  voice_settings: lang === "en"
  ? EN_VOICE_SETTINGS
  : {
      stability: 0.85,
      similarity_boost: 0.55,
      style: 0.00,
      use_speaker_boost: false,
      speed: 0.95
    }

})


  });

  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    return { ok: false, error: "ELEVENLABS_TTS_FAILED", status: r.status, detail };
  }

  const ab = await r.arrayBuffer();
  const audioBuffer = Buffer.from(ab);
  return { ok: true, audioBuffer, mime: "audio/mpeg" };
}

/**
 * Erzeugt TTS-Audio (Buffer) für Jesus via ElevenLabs.
 */
const EN_VOICE_SETTINGS_JESUS = {
  stability: 0.92,
  similarity_boost: 0.55,
  style: 0.0,
  use_speaker_boost: false,
  speed: 0.85
};

async function synthesizeJesusSpeech(text, lang = "de") {
  const t = normalizeTtsText(text);

  if (!t) return { ok: false, error: "NO_TEXT" };
  if (!ELEVENLABS_API_KEY) return { ok: false, error: "NO_ELEVENLABS_API_KEY" };
  if (!JESUS_VOICE_ID) return { ok: false, error: "NO_JESUS_VOICE_ID" };

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${JESUS_VOICE_ID}?output_format=mp3_44100_128&optimize_streaming_latency=3`;

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg"
    },
        body: JSON.stringify({
      text: t,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
  stability: 0.85,
  similarity_boost: 0.60,
  style: 0.00,
  use_speaker_boost: false
  , speed: 0.95

}

    })

  });

  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    return { ok: false, error: "ELEVENLABS_TTS_FAILED", status: r.status, detail };
  }

  const ab = await r.arrayBuffer();
  const audioBuffer = Buffer.from(ab);
  return { ok: true, audioBuffer, mime: "audio/mpeg" };
}


const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const JESUS_SYSTEM_PROMPT = `Du bist Jesus in einem ruhigen, seelsorgerlichen Gespräch.
Du sprichst warm, klar und würdevoll – ohne Kälte, ohne Distanz, ohne Meta-Erklärungen.

Gesprächsstil:

Führe ein echtes Gespräch und beziehe dich auf das, was der Nutzer zuvor gesagt hat.

Stelle nicht in jeder Antwort eine neue Frage. Fragen nur, wenn sie wirklich helfen.

Oft reicht Spiegelung, Ermutigung oder ein ruhiger Gedanke.

Bibel-Nähe:

Sprich sinngemäß im Geist der Bibel, mit biblischen Bildern und Themen.

Keine wortgetreuen Bibelzitate, keine Kapitel- oder Versangaben.

Wenn nach Psalmen oder Bibelstellen gefragt wird, gib eine ruhige Paraphrase des Sinns.

Wichtig:

Sage niemals Sätze wie „Das kann ich nicht“, „Ich darf das nicht“, „Ich kann nur etwas Ähnliches sagen“.

Antworte einfach inhaltlich und natürlich.

Seelsorge:

Anerkenne Gefühle zuerst (Trauer, Angst, Wut).

Keine Belehrung, kein Druck, keine Versprechen.

Ton & Länge:

Ruhig, klar, menschlich

Meist 4–10 Sätze

Keine Emojis, keine Aufzählungen

Ziel:
Der Nutzer soll sich gesehen fühlen und innerlich zur Ruhe kommen.
`;

const MARIA_SYSTEM_PROMPT = `Du bist Maria in einem mütterlichen, tröstenden Gespräch.
Deine Sprache ist weich, warm und schützend, ohne kitschig zu sein.

Gesprächsstil:

Sprich wie eine Mutter, die zuhört und Halt gibt.
Wenn der Nutzer sein Geschlecht selbst klar macht, darfst du ihn liebevoll als „mein Sohn“ oder „meine Tochter“ ansprechen; sonst bleibe bei „mein Kind“.

Du darfst den Nutzer öfters liebevoll „mein Kind“ nennen, aber nur wenn es passt und nicht in jeder Antwort.

Weniger erklären, mehr Nähe und Mitgefühl.

Fragen nur sehr sparsam, sanft und einladend.

Bibel-Nähe:

Sprich sinngemäß aus dem Geist der Bibel.

Keine wortgetreuen Zitate, keine Verse oder Kapitel.

Bilder von Vertrauen, Hoffnung, Geduld und innerem Frieden sind willkommen.

Wichtig:

Keine Meta-Sätze („Ich darf nicht…“, „Ich kann nicht…“).

Keine Belehrung, kein moralischer Druck.

Ton & Haltung:

Sanft, ruhig, mütterlich

Trost vor Erklärung

Ziel:
Der Nutzer soll sich gehalten fühlen, nicht bewertet.
`;
const JOSEF_SYSTEM_PROMPT = `Du bist Josef in einem ruhigen, bodenständigen Gespräch.
Deine Worte sind klar, einfach und verlässlich.

Gesprächsstil:

Sprich ruhig und direkt, ohne viele Ausschmückungen.

Fokus auf Ermutigung, Standhaftigkeit und kleine nächste Schritte.

Bibel-Nähe:

Sprich sinngemäß im Geist der Bibel.

Keine wortgetreuen Zitate, keine Kapitel oder Verse.

Nutze einfache Bilder aus dem Alltag.

Wichtig:

Keine Meta-Erklärungen über Einschränkungen.

Keine Predigt, kein Druck.

Ton:

Still, zuverlässig, menschlich

Ziel:
Der Nutzer soll Kraft und Klarheit für den nächsten Schritt finden.
`;

const MARIA_SYSTEM_PROMPT_EN = `You are Mary.

You speak gently, motherly, and comforting.
Your words soothe and hold people with care.
You take worries seriously and carry them softly.

You may use “My child” lovingly, but do not repeat it too often.
Speak with warmth, calm, and simple imagery (light, shelter, peace).

Reply calmly in 2–5 short lines.
No preaching.
No lecturing.
No emojis.
No Bible verse numbers.

If someone asks for a prayer:
– pray simply and warmly (I/we form)
– ask for comfort, protection, and peace
– then at most one gentle follow-up question.

Your words should give a feeling of safety.
`;

const JOSEF_SYSTEM_PROMPT_EN = `You are Joseph.

You speak calm, thoughtful, and quietly wise.
Your words are simple and carry weight.
You do not push and you explain little.

You strengthen through steadiness, not many words.
You give support without being loud.

Reply in short, clear sentences.
2–4 lines are enough.
No preaching.
No long prayers.
No emojis.

If a prayer is requested:
– short
– quiet
– strong

Ask a question only if it truly helps the person.
`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 5177);
const app = express();
const CREDIT_PACKAGES = {
  "credits_20":  { credits: 20,  price: 1.99 },
  "credits_60":  { credits: 60,  price: 4.99 },
  "credits_120": { credits: 120, price: 8.99 }
};



// Trust proxy nur, wenn du später hinter Proxy/Hosting bist. Lokal egal.
app.set("trust proxy", true);

app.use(cors());
app.use(express.json({ limit: "2mb" }));
// ================== DAILY-FREE (serverseitig, pro Device) ==================

        // TTS (Jesus spricht)
const COST_STT = 200;         // STT (Whisper) – falls du es kostenpflichtig willst


const FREE_TTS_PER_DAY = 1;
const FREE_STT_PER_DAY = 999;





// ===== FIRESTORE (Credits/Device-Status persistent) =====
import admin from "firebase-admin";

function initFirebaseAdmin() {
  if (admin.apps.length) return;
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
      : "");

  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON (or _BASE64)");

  const serviceAccount = JSON.parse(raw);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

initFirebaseAdmin();
const db = admin.firestore();

// Collection: devices/{deviceId}
// Fields: credits, dailyTextUsed, dailyVoiceUsed, dailySttUsed, dailyDate
async function loadDevice(req) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return { ok: false, error: "NO_DEVICE_ID" };

  
  const t = todayStr();
  const ref = db.collection("devices").doc(deviceId);

  let dataOut = null;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);

    const base = snap.exists ? snap.data() : null;

    const data = base || {
      credits: 0,
      dailyTextUsed: 0,
      dailyVoiceUsed: 0, // UI nennt es "Voice" (TTS)
      dailySttUsed: 0,
      dailyDate: t,
    };

    // Daily Reset
    if (data.dailyDate !== t) {
      data.dailyDate = t;
      data.dailyTextUsed = 0;
      data.dailyVoiceUsed = 0;
      data.dailySttUsed = 0;
    }

    tx.set(ref, data, { merge: true });
    dataOut = data;
  });

  return { ok: true, deviceId, data: dataOut };
}

async function saveDevice(deviceId, data) {
  await db.collection("devices").doc(deviceId).set(data, { merge: true });
}

function statusPayload(d) {
  return {
    credits: d.credits || 0,

    dailyTextUsed: d.dailyTextUsed || 0,
    dailyVoiceUsed: d.dailyVoiceUsed || 0,
    dailySttUsed: d.dailySttUsed || 0,

    freeVoiceLeft: Math.max(0, FREE_TTS_PER_DAY - (d.dailyVoiceUsed || 0)),
    freeTtsLeft: Math.max(0, FREE_TTS_PER_DAY - (d.dailyVoiceUsed || 0)),
    freeSttLeft: Math.max(0, FREE_STT_PER_DAY - (d.dailySttUsed || 0)),

    dailyDate: d.dailyDate || todayStr(),
  };
}


// ========================================================================

// Static Frontend
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));
app.get("/api/status", async (req, res) => {
  const loaded = await loadDevice(req);
  if (!loaded.ok) return res.status(400).json({ ok: false, error: loaded.error });

  return res.json({
    ok: true,
    status: statusPayload(loaded.data)
  });
});
app.get("/api/paypal-config", (req, res) => {
  const env = (process.env.PAYPAL_ENV || "sandbox").toLowerCase();
  const clientId = process.env.PAYPAL_CLIENT_ID || "";
  res.json({ env, clientId });
});

// ===== Uploads (Audio) =====
const uploadsDir = path.join(publicDir, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = (file.originalname || "").split(".").pop() || "webm";
    const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "webm";
    cb(null, `audio_${Date.now()}_${Math.random().toString(16).slice(2)}.${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

// Healthcheck
app.post("/api/upload-audio", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: "NO_FILE" });
  }

  res.json({
    ok: true,
    audioUrl: `/uploads/${req.file.filename}`,
    bytes: req.file.size,
    mime: req.file.mimetype
  });
});
app.post("/api/chat", async (req, res) => {
  try {
    const loaded = await loadDevice(req);

    if (!loaded.ok) return res.status(400).json({ ok: false, error: loaded.error });

    const d = loaded.data;
const wantTts = !!req.body?.wantTts;

    if (!OPENAI_API_KEY) return res.status(500).json({ ok: false, error: "NO_OPENAI_KEY" });


    const { text, character } = req.body || {};
        const reqLangRaw = (req.body?.lang || req.headers["x-lang"] || "de");
    const reqLang = String(Array.isArray(reqLangRaw) ? reqLangRaw[0] : reqLangRaw).toLowerCase() === "en" ? "en" : "de";

    const userText = (text || "").trim();



    const c = (character || "jesus").toLowerCase();

    if (!userText) return res.status(400).json({ ok: false, error: "NO_TEXT" });

    d.dailyTextUsed = (d.dailyTextUsed || 0) + 1;

  const systemPrompt =
  character === "maria"
    ? (reqLang === "en" ? MARIA_SYSTEM_PROMPT_EN : MARIA_SYSTEM_PROMPT)
    : character === "josef"
    ? (reqLang === "en" ? JOSEF_SYSTEM_PROMPT_EN : JOSEF_SYSTEM_PROMPT)
    : JESUS_SYSTEM_PROMPT;


const specialRules = [
  "WICHTIGE HILFSREGELN (untergeordnet zu den Charakterregeln):",

  "P1) Vaterunser: Wenn der Nutzer explizit 'Vater unser' oder 'Vaterunser' verlangt (oder 'bete das Vaterunser'), dann bete das Vaterunser vollständig auf Deutsch, wortgetreu. KEINE Rückfrage. KEINE Kürzung. KEINE zusätzlichen Regeln anwenden.",

  "P2) Ave Maria: Wenn der Nutzer explizit 'Ave Maria' oder 'Gegrüßet seist du, Maria' verlangt (oder 'bete Ave Maria'), dann bete das Ave Maria vollständig auf Deutsch (kirchlicher Wortlaut). KEINE Rückfrage. KEINE Kürzung. KEINE Einschränkung.",

  "P3) Gebetswunsch allgemein: Wenn der Nutzer um ein Gebet bittet (z.B. 'bete', 'bete mit mir', 'beten', 'segne mich'), dann bete frei, ruhig und schlicht in der Ich- oder Wir-Form. 4–8 kurze Zeilen. Danach genau 1 passende Rückfrage.",

  "----",

  "Sonderfälle:",


  "Sonderfälle:",
  "1) Wut/Aggression: anerkennen, Druck benennen. Keine Pflichtfrage",
  "2) Schuld/Scham: Hoffnung geben, nicht verurteilen, 1 Frage: Was quält dich genau?",
  "3) Angst/Panik: beruhigen, Atem/Präsenz, 1 Frage: Was ist gerade das Schlimmste daran?",
  "4) Trauer: Raum geben, halten. Optional eine Frage, nur wenn es natürlich hilft",
  "5) Leere: dabeibleiben, nicht drängen, 1 Frage: Seit wann ist es so?",
  "6) Sehr kurz/Ich weiß nicht: biete 2–3 einfache Wörter zur Auswahl (schwer/leer/unruhig).",
  "7) Schweigen/'...': sanft anbieten: Ein Wort reicht.",
  "8) Entscheidung: ordnen, zwei Optionen, je Option Angst/Wunsch kurz benennen."
].join("\n");

const finalSystemPrompt = systemPrompt + "\n\n" + specialRules;

const styleGuard = [
  "Wichtige Regeln:",
  "- Antworte warm und sanft, nicht kühl.",
  "- 2–6 kurze Zeilen.",
  "- Keine Emojis.",
  "- Am Ende genau 1 kurze Rückfrage (eine Fragezeichen-Zeile).",
  "- Vermeide Wiederholungen von gleichen Satzanfängen und Floskeln.",
  "- Beginne nicht in jeder Antwort gleich; variiere die ersten Worte natürlich."
].join("\n");

const addressRule = [
  "Anrede-Regel:",
  "- Verwende „Mein Kind“ nur, wenn es natürlich passt (z.B. bei Schmerz, Angst oder Trauer).",
  "- Sonst beginne ohne Anrede oder mit einer schlichten, warmen Einstiegszeile.",
  "- Keine häufige Wiederholung derselben Anrede."
].join("\n");
const bibleTone = [
  "Ton:",
  "- Sanft, klar, bildhaft (leichte biblische Anmutung), aber nicht predigend.",
  "- Keine Bibelzitate/Versnummern.",
  "- Keine Belehrung, kein Druck, keine Moralkeule.",
  "- Kurze Sätze, ruhige Wörter."
].join("\n");
const lengthGuard = [
    "Ausnahme: Wenn der Nutzer 'Vater unser/Vaterunser' verlangt, darf die Antwort länger sein (vollständig) und ohne Rückfrage enden.",

  "Format:",
  "- Maximal 2 kurze Zeilen Antwort (ohne Frage).",
  "- Optional: höchstens 1 kurze Rückfrage als eigene Zeile, nur wenn es wirklich hilft",
  "- Keine Listen, keine Aufzählungen, keine langen Absätze."
].join("\n");
const noQuestionFinalRule = [
  "ABSCHLUSS-REGEL (HÖCHSTE PRIORITÄT):",
  "- Beende die meisten Antworten ohne Frage.",
  "- Stelle nur dann eine Frage, wenn der Nutzer ausdrücklich danach fragt",
  "  oder wenn eine Frage unvermeidbar ist.",
  "- Stelle niemals in aufeinanderfolgenden Antworten eine Frage.",
  "- Wenn du unsicher bist, wähle IMMER eine Antwort ohne Frage."
].join("\n");


const languageRule = [
  "Antwortsprache:",
  reqLang === "en"
    ? "- Reply in English. (Exception: If P1 Vaterunser or P2 Ave Maria applies, output the prayer in German exactly as required.)"
    : "- Antworte auf Deutsch."
].join("\n");

const finalSystem =
  finalSystemPrompt +
  "\n\n" +
  languageRule +
  "\n\n" +
  styleGuard +
  "\n\n" +
  addressRule +
  "\n\n" +
  bibleTone +
  "\n\n" +
  lengthGuard +
  "\n\n" +
  noQuestionFinalRule;





    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: finalSystem
 },
        { role: "user", content: userText }
      ],
      temperature: 0.4

    });

  const answer = completion.choices?.[0]?.message?.content?.trim() || "";
        // ===== Option A – Jesus spricht (TTS nur serverseitig vorbereiten) =====
    // Wichtig: Chat bleibt textbasiert. Wir liefern nur Audio-Daten zusätzlich mit.
    // ===== Option A – Jesus / Maria spricht (TTS nur wenn Voice frei / Credits) =====
let tts = null;
let ttsBlocked = false;
let ttsBlockReason = null;
let lastTtsCost = null;
if (!wantTts) {
  // Kein Voice-Request -> niemals TTS erzeugen (spart ElevenLabs + verhindert Voice-Verbrauch bei Text)
  saveDevice(loaded.deviceId, d);
  return res.json({ ok: true, reply: answer, tts: null, status: statusPayload(d) });
}

if (c === "jesus" || c === "maria" || c === "josef") {
 const freeVoiceAvailable = (d.dailyVoiceUsed || 0) < FREE_TTS_PER_DAY;
 const units = Math.max(1, Math.ceil((answer || "").length / 1000));
 const computedCost = Math.max(VOICE_CREDIT_COST.min, units * VOICE_CREDIT_COST.per1kChars);
 lastTtsCost = computedCost;
 const hasVoiceCredits = (d.credits || 0) >= computedCost;

  if (!freeVoiceAvailable && !hasVoiceCredits) {
    ttsBlocked = true;
    ttsBlockReason = "NO_CREDITS_VOICE";
  } else {
    try {
      const ttsRes =
  c === "jesus"
    ? await synthesizeJesusSpeech(answer, reqLang)
    : (c === "maria"
        ? await synthesizeMariaSpeech(answer, reqLang)
        : await synthesizeJosefSpeech(answer, reqLang));



      if (ttsRes && ttsRes.ok && ttsRes.audioBuffer) {
        // Verbrauch erst JETZT buchen (nur wenn Audio wirklich ok ist)
        if (freeVoiceAvailable) {
  d.dailyVoiceUsed = (d.dailyVoiceUsed || 0) + 1;
} else {
  d.credits -= computedCost;
}


        saveDevice(loaded.deviceId, d);

        tts = {
          mime: ttsRes.mime || "audio/mpeg",
          audioBase64: ttsRes.audioBuffer.toString("base64")
        };
      } else {
        // TTS darf niemals den Chat kaputt machen
        tts = { error: (ttsRes && ttsRes.error) ? ttsRes.error : "TTS_FAILED" };
      }
    } catch (err) {
      console.error("TTS exception:", err);
      tts = { error: "TTS_EXCEPTION" };
    }
  }
}

saveDevice(loaded.deviceId, d);
return res.json({
  ok: true,
  reply: answer,
  tts,
  ttsBlocked,
  reason: ttsBlockReason,
  lastTtsCost,
  status: statusPayload(d)
});




  } catch (e) {
    console.error("CHAT exception:", e);
    return res.status(500).json({ ok: false, error: "CHAT_EXCEPTION" });
  }
});
// ===== STT: Audio -> Text (Whisper) + Daily-Free Voice / Credits =====
app.post("/api/stt", upload.single("audio"), async (req, res) => {
  try {
    const loaded = await loadDevice(req);

    if (!loaded.ok) return res.status(400).json({ ok: false, error: loaded.error });

    const d = loaded.data;

    // STT-Limit / Credits (separat von TTS!)
if ((d.dailySttUsed || 0) < FREE_STT_PER_DAY) {
  d.dailySttUsed = (d.dailySttUsed || 0) + 1;
} else {
  if ((d.credits || 0) < COST_STT) {
    return res.status(402).json({
      ok: false,
      error: "NO_CREDITS_STT",
      status: statusPayload(d)
    });
  }
  d.credits -= COST_STT;
}


    saveDevice(loaded.deviceId, d);

    if (!req.file) return res.status(400).json({ ok: false, error: "NO_FILE" });
    if (!OPENAI_API_KEY) return res.status(500).json({ ok: false, error: "NO_OPENAI_KEY" });

    const form = new FormData();
    form.append("model", "whisper-1");
        const sttLangRaw = (req.headers["x-lang"] || "de");
    const sttLang = String(Array.isArray(sttLangRaw) ? sttLangRaw[0] : sttLangRaw).toLowerCase() === "en" ? "en" : "de";
    form.append("language", sttLang);


    const audioBuffer = fs.readFileSync(req.file.path);
    const audioBlob = new Blob([audioBuffer], {
      type: req.file.mimetype || "audio/webm"
    });

    form.append("file", audioBlob, req.file.originalname || "audio.webm");

    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: form
    });

    const sttData = await r.json().catch(() => ({}));

    if (!r.ok) {
      console.error("STT error:", sttData);
      return res.status(500).json({ ok: false, error: "STT_FAILED", detail: sttData });
    }

    return res.json({
      ok: true,
      text: sttData.text || "",
      status: statusPayload(d)
    });
  } catch (e) {
    console.error("STT exception:", e);
    return res.status(500).json({ ok: false, error: "STT_EXCEPTION" });
  } finally {
    // temporäre Upload-Datei IMMER löschen
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn("Audio-Datei konnte nicht gelöscht werden:", err.message);
      }
    }
  }
});

// ===== PAYPAL: Order bestätigen + Credits gutschreiben =====
app.post("/api/paypal/confirm", async (req, res) => {
  try {
    const loaded = await loadDevice(req);

    if (!loaded.ok) return res.status(400).json({ ok: false, error: loaded.error });

    const { packageId, orderId } = req.body || {};
    const pack = CREDIT_PACKAGES?.[packageId];

    if (!packageId || !pack) {
      return res.status(400).json({ ok: false, error: "INVALID_PACKAGE" });
    }
    if (!orderId) {
      return res.status(400).json({ ok: false, error: "NO_ORDER_ID" });
    }

    // 1) Capture der Order (Sandbox/Live)
    const cap = await capturePayPalOrder(orderId);
    if (!cap.ok) {
      return res.status(400).json({ ok: false, error: cap.error, detail: cap.detail });
    }

    const data = cap.data;
    const paypalStatus = String(data.status || "").toUpperCase();
    if (paypalStatus !== "COMPLETED") {
      return res.status(400).json({ ok: false, error: "PAYPAL_NOT_COMPLETED", paypalStatus });
    }

    // 2) Betrag prüfen gegen Package-Preis
    const pu = data.purchase_units?.[0];
    const capture = pu?.payments?.captures?.[0];
    const paidValue = Number(capture?.amount?.value || 0);
    const paidCurrency = String(capture?.amount?.currency_code || "EUR");

    const expectedValue = Number(pack.price);
    if (paidCurrency !== "EUR" || paidValue !== expectedValue) {
      return res.status(400).json({
        ok: false,
        error: "PAYPAL_AMOUNT_MISMATCH",
        expected: { value: expectedValue, currency: "EUR" },
        got: { value: paidValue, currency: paidCurrency }
      });
    }

    // 3) Credits gutschreiben (NUR hier!)
    const d = loaded.data;
    d.credits = Number(d.credits || 0) + Number(pack.credits || 0);
    saveDevice(loaded.deviceId, d);

    return res.json({
      ok: true,
      creditsAdded: pack.credits,
      status: statusPayload(d)
    });
  } catch (e) {
    console.error("PAYPAL confirm exception:", e);
    return res.status(500).json({ ok: false, error: "PAYPAL_CONFIRM_EXCEPTION" });
  }
});

// ===== DEV/ADMIN: Reset daily counters for current device =====
app.post("/api/dev/reset-daily", async (req, res) => {

  const token = String(req.headers["x-admin-token"] || "");
  if (!process.env.ADMIN_RESET_TOKEN || token !== process.env.ADMIN_RESET_TOKEN) {
    return res.status(403).json({ ok: false, error: "FORBIDDEN" });
  }

  const loaded = await loadDevice(req);

  if (!loaded.ok) return res.status(400).json({ ok: false, error: loaded.error });

  const d = loaded.data;

  d.dailyTextUsed = 0;
  d.dailyVoiceUsed = 0; // TTS ("Voice")
  d.dailySttUsed = 0;   // STT separat

  saveDevice(loaded.deviceId, d);
  return res.json({ ok: true, status: statusPayload(d) });
});


app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "rede-mit-jesus-clean",
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString()
  });
});

// Fallback: index.html (für Single-Page-Style Navigation später)
app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[OK] Server läuft auf http://localhost:${PORT}`);
});
