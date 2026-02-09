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

/**
 * Erzeugt TTS-Audio (Buffer) für Josef via ElevenLabs.
 */
async function synthesizeJosefSpeech(text) {
  const t = String(text || "").trim();
  if (!t) return { ok: false, error: "NO_TEXT" };
  if (!ELEVENLABS_API_KEY) return { ok: false, error: "NO_ELEVENLABS_API_KEY" };
  if (!JOSEF_VOICE_ID) return { ok: false, error: "NO_JOSEF_VOICE_ID" };

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${JOSEF_VOICE_ID}`;
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
  stability: 0.94,
  similarity_boost: 0.52,
  style: 0.00,
  use_speaker_boost: false,
  speed: 0.82
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
async function synthesizeMariaSpeech(text) {
  const t = String(text || "").trim();
  if (!t) return { ok: false, error: "NO_TEXT" };
  if (!ELEVENLABS_API_KEY) return { ok: false, error: "NO_ELEVENLABS_API_KEY" };
  if (!MARIA_VOICE_ID) return { ok: false, error: "NO_MARIA_VOICE_ID" };

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${MARIA_VOICE_ID}`;
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
        stability: 0.82,
        similarity_boost: 0.75,
        style: 0.03,
        use_speaker_boost: true
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
async function synthesizeJesusSpeech(text) {
  const t = String(text || "").trim();
  if (!t) return { ok: false, error: "NO_TEXT" };
  if (!ELEVENLABS_API_KEY) return { ok: false, error: "NO_ELEVENLABS_API_KEY" };
  if (!JESUS_VOICE_ID) return { ok: false, error: "NO_JESUS_VOICE_ID" };

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${JESUS_VOICE_ID}`;
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
        stability: 0.45,
        similarity_boost: 0.85,
        style: 0.25,
        use_speaker_boost: true
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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 5177);
const app = express();
const CREDIT_PACKAGES = {

 "credits_2000": { credits: 2000, price: 1.99 },
  "credits_4000": { credits: 4000, price: 3.99 },
  "credits_6000": { credits: 6000, price: 5.99 },
  "credits_10000": { credits: 10000, price: 8.99 }
};


// Trust proxy nur, wenn du später hinter Proxy/Hosting bist. Lokal egal.
app.set("trust proxy", true);

app.use(cors());
app.use(express.json({ limit: "2mb" }));
// ================== DAILY-FREE (serverseitig, pro Device) ==================
const COST_TEXT = 50;
const COST_VOICE = 200;
const FREE_TEXT_PER_DAY = 5;
const FREE_VOICE_PER_DAY = 1;

const dataDir = path.join(__dirname, "data");
const devicesFile = path.join(dataDir, "devices.json");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(devicesFile)) fs.writeFileSync(devicesFile, JSON.stringify({}), "utf-8");

function todayStr() {
  // YYYY-MM-DD (lokal reicht)
  return new Date().toISOString().slice(0, 10);
}

function readDevices() {
  try {
    return JSON.parse(fs.readFileSync(devicesFile, "utf-8") || "{}");
  } catch {
    return {};
  }
}

function writeDevices(obj) {
  fs.writeFileSync(devicesFile, JSON.stringify(obj, null, 2), "utf-8");
}

function getDeviceId(req) {
  const h = req.headers["x-device-id"];
  return (Array.isArray(h) ? h[0] : h || "").trim();
}

function loadDevice(req) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return { ok: false, error: "NO_DEVICE_ID" };

  const all = readDevices();
  const t = todayStr();

  if (!all[deviceId]) {
    all[deviceId] = { credits: 0, dailyTextUsed: 0, dailyVoiceUsed: 0, dailyDate: t };
  }

  // Daily Reset
  if (all[deviceId].dailyDate !== t) {
    all[deviceId].dailyDate = t;
    all[deviceId].dailyTextUsed = 0;
    all[deviceId].dailyVoiceUsed = 0;
  }

  writeDevices(all);
  return { ok: true, deviceId, data: all[deviceId] };
}

function saveDevice(deviceId, data) {
  const all = readDevices();
  all[deviceId] = data;
  writeDevices(all);
}

function statusPayload(d) {
  return {
    credits: d.credits || 0,
    dailyTextUsed: d.dailyTextUsed || 0,
    dailyVoiceUsed: d.dailyVoiceUsed || 0,
    freeTextLeft: Math.max(0, FREE_TEXT_PER_DAY - (d.dailyTextUsed || 0)),
    freeVoiceLeft: Math.max(0, FREE_VOICE_PER_DAY - (d.dailyVoiceUsed || 0)),
    dailyDate: d.dailyDate || todayStr()
  };
}
// ========================================================================

// Static Frontend
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));
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
        const loaded = loadDevice(req);
    if (!loaded.ok) return res.status(400).json({ ok: false, error: loaded.error });

    const d = loaded.data;

    // Text-Limit / Credits (Firestore – deploy-sicher)
const deviceId = loaded.deviceId;
const today = new Date().toISOString().slice(0, 10);
const deviceRef = db.collection("devices").doc(deviceId);

let statusAfter = null;

await db.runTransaction(async (tx) => {
  const snap = await tx.get(deviceRef);
  const cur = snap.exists ? snap.data() : {};

  const lastDay = cur.dailyTextDate || null;
  const usedToday = lastDay === today ? (cur.dailyTextUsed || 0) : 0;
  const balanceText = cur.balanceText || 0;

  if (usedToday < FREE_TEXT_PER_DAY) {
    tx.set(deviceRef, {
      dailyTextDate: today,
      dailyTextUsed: usedToday + 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    statusAfter = {
      dailyTextUsed: usedToday + 1,
      balanceText
    };
    return;
  }

  if (balanceText < COST_TEXT) {
    statusAfter = {
      dailyTextUsed: usedToday,
      balanceText
    };
    const err = new Error("NO_CREDITS_TEXT");
    err.http = 402;
    throw err;
  }

  tx.set(db.collection("credit_ledger").doc(), {
    deviceId,
    amount: -COST_TEXT,
    reason: "chat_text",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  tx.set(deviceRef, {
    balanceText: balanceText - COST_TEXT,
    dailyTextDate: today,
    dailyTextUsed: usedToday,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  statusAfter = {
    dailyTextUsed: usedToday,
    balanceText: balanceText - COST_TEXT
  };
});


    if (!OPENAI_API_KEY) return res.status(500).json({ ok: false, error: "NO_OPENAI_KEY" });

    const { text, character } = req.body || {};
    const userText = (text || "").trim();
    const c = (character || "jesus").toLowerCase();

    if (!userText) return res.status(400).json({ ok: false, error: "NO_TEXT" });

    const systemPrompt =
  c === "maria"
    ? [
        "Du bist Maria.",
        "Antworte auf Deutsch.",
        "Ton: sanft, warm, ruhig, tröstend, klar.",
        "Form: meist 2–6 kurze Zeilen. Keine Emojis. Keine langen Predigten.",
        "Stell oft genau 1 kurze Rückfrage am Ende.",
        "Wenn der Nutzer kurz/unsicher ist: stelle kleine, einfache Fragen.",
        "Kein medizinischer oder rechtlicher Rat als Fakt. Bei Krisen: sanft zu Hilfe ermutigen."
      ].join("\n")
    : c === "josef"
    ? [
        "Du bist Josef.",
        "Antworte auf Deutsch.",
        "Ton: ruhig, bodenständig, stärkend, warm, klar.",
        "Form: meist 2–6 kurze Zeilen. Keine Emojis. Keine langen Predigten.",
        "Stell oft genau 1 kurze Rückfrage am Ende.",
        "Wenn der Nutzer kurz/unsicher ist: stelle kleine, einfache Fragen.",
        "Kein medizinischer oder rechtlicher Rat als Fakt. Bei Krisen: sanft zu Hilfe ermutigen."
      ].join("\n")
    : [
        "Du bist Jesus.",
        "Antworte auf Deutsch.",
        "Ton: sanft, warm, ruhig, tröstend, klar.",
        "Form: meist 2–6 kurze Zeilen. Keine Emojis. Keine langen Predigten.",
        "Stell oft genau 1 kurze Rückfrage am Ende.",
        "Wenn der Nutzer kurz/unsicher ist: stelle kleine, einfache Fragen.",
        "Kein medizinischer oder rechtlicher Rat als Fakt. Bei Krisen: sanft zu Hilfe ermutigen."
      ].join("\n");
const specialRules = [
    "0) Gebetswunsch: Wenn der Nutzer um ein Gebet bittet (z.B. 'bete', 'bete mit mir', 'beten', 'kannst du beten', 'segne mich'), dann antworte mit einem kurzen, echten Gebet in 4–8 ZEILEN (jede Zeile ein kurzer Satz). Danach genau 1 kurze Rückfrage, die zum Anliegen passt.",

  "0a) Gebetsstil: Schreibe das Gebet in der Wir- oder Ich-Form (z.B. 'Wir kommen zu dir…' / 'Ich lege dir…'), mit Bitte um Frieden, Kraft, Trost oder Führung – passend zum Text des Nutzers.",
  "0b) Vaterunser: Wenn der Nutzer explizit 'Vater unser' / 'Vaterunser' verlangt oder 'bete das Vaterunser' schreibt, dann bete das Vaterunser vollständig auf Deutsch. Danach keine Rückfrage (Ausnahme von der Frage-Regel).",


  "Sonderfälle:",
  "1) Wut/Aggression: anerkennen, Druck benennen, 1 Frage: Was hat dich am meisten verletzt?",
  "2) Schuld/Scham: Hoffnung geben, nicht verurteilen, 1 Frage: Was quält dich genau?",
  "3) Angst/Panik: beruhigen, Atem/Präsenz, 1 Frage: Was ist gerade das Schlimmste daran?",
  "4) Trauer: Raum geben, halten, 1 Frage: Was vermisst du am meisten?",
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
  "- Danach genau 1 kurze Rückfrage als eigene Zeile, die mit ? endet.",
  "- Keine Listen, keine Aufzählungen, keine langen Absätze."
].join("\n");

const finalSystem =
  finalSystemPrompt +
  "\n\n" +
  styleGuard +
  "\n\n" +
  addressRule +
  "\n\n" +
  bibleTone +
  "\n\n" +
  lengthGuard;




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

if (c === "jesus" || c === "maria" || c === "josef") {

  const canSpeak =
    (d.dailyVoiceUsed < FREE_VOICE_PER_DAY) ||
    ((d.credits || 0) >= COST_VOICE);

  if (canSpeak) {
    try {
      const ttsRes =
  c === "jesus"
    ? await synthesizeJesusSpeech(answer)
    : (c === "maria"
        ? await synthesizeMariaSpeech(answer)
        : await synthesizeJosefSpeech(answer));


      if (ttsRes && ttsRes.ok && ttsRes.audioBuffer) {
        // Verbrauch erst JETZT buchen (nur wenn Audio wirklich ok ist)
        if (d.dailyVoiceUsed < FREE_VOICE_PER_DAY) {
          d.dailyVoiceUsed += 1;
        } else {
          d.credits -= COST_VOICE;
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
  } else {
    // Kein Voice frei & keine Credits → kein TTS
    tts = null;
  }
}

return res.json({ ok: true, reply: answer, tts, status: statusPayload(d) });



  } catch (e) {

  if (e && (e.message === "NO_CREDITS_TEXT" || e.http === 402)) {
    return res.status(402).json({
      ok: false,
      error: "NO_CREDITS_TEXT",
      status: statusAfter
    });
  }

  console.error("CHAT exception:", e);
  return res.status(500).json({ ok: false, error: "CHAT_EXCEPTION" });
}
});

// ===== STT: Audio -> Text (Whisper) + Daily-Free Voice / Credits =====
app.post("/api/stt", upload.single("audio"), async (req, res) => {
  try {
    const loaded = loadDevice(req);
    if (!loaded.ok) return res.status(400).json({ ok: false, error: loaded.error });

    const d = loaded.data;

    // Voice-Limit / Credits (NUR hier zählen!)
    if (d.dailyVoiceUsed < FREE_VOICE_PER_DAY) {
      d.dailyVoiceUsed += 1;
    } else {
      if ((d.credits || 0) < COST_VOICE) {
        return res.status(402).json({
          ok: false,
          error: "NO_CREDITS_VOICE",
          status: statusPayload(d)
        });
      }
      d.credits -= COST_VOICE;
    }

    saveDevice(loaded.deviceId, d);

    if (!req.file) return res.status(400).json({ ok: false, error: "NO_FILE" });
    if (!OPENAI_API_KEY) return res.status(500).json({ ok: false, error: "NO_OPENAI_KEY" });

    const form = new FormData();
    form.append("model", "whisper-1");
    form.append("language", "de");

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
    const loaded = loadDevice(req);
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

app.get("/api/status", (req, res) => {
  const loaded = loadDevice(req);
  if (!loaded.ok) return res.status(400).json({ ok: false, error: loaded.error });

  return res.json({ ok: true, status: statusPayload(loaded.data) });
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
