import { CHARACTERS } from "./characters.js";
import { startRecording, stopRecording } from "./audio/recorder.js";
function rmjShowDebug(text) {
  try {
    let el = document.getElementById("rmjDebugBox");
    if (!el) {
      el = document.createElement("pre");
      el.id = "rmjDebugBox";
      el.style.position = "fixed";
      el.style.left = "10px";
      el.style.right = "10px";
      el.style.bottom = "10px";
      el.style.maxHeight = "45vh";
      el.style.overflow = "auto";
      el.style.zIndex = "999999";
      el.style.background = "rgba(0,0,0,0.85)";
      el.style.color = "white";
      el.style.padding = "10px";
      el.style.borderRadius = "12px";
      el.style.fontSize = "12px";
      el.style.whiteSpace = "pre-wrap";
      el.style.userSelect = "text";
      el.style.webkitUserSelect = "text";
      el.style.border = "1px solid rgba(255,255,255,0.15)";
      el.style.boxShadow = "0 10px 30px rgba(0,0,0,0.4)";
      el.addEventListener("click", () => (el.style.display = "none"));
      document.body.appendChild(el);
    }
    el.textContent = String(text || "");
    el.style.display = "block";
  } catch (e) {
    // not fatal
  }
}

document.addEventListener("DOMContentLoaded", () => {
    // ========= API BASE (Web vs. Capacitor Native) =========
 const IS_CAPACITOR = !!window.Capacitor;

const API_ORIGIN = IS_CAPACITOR
  ? "https://rede-mit-jesus-live-production.up.railway.app"
  : "";
console.log("[RMJ] IS_CAPACITOR =", IS_CAPACITOR);
console.log("[RMJ] API_ORIGIN =", API_ORIGIN);

function apiUrl(path) {
  if (!path.startsWith("/")) path = "/" + path;
  return API_ORIGIN + path;
}

async function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), options);
}



    // ===== i18n (DE/EN) =====
  const LANG_KEY = "rmj_lang";
  function getLang() {
    const v = (localStorage.getItem(LANG_KEY) || "de").toLowerCase();
    return (v === "en") ? "en" : "de";
  }
  function setLang(lang) {
    const v = (String(lang || "de").toLowerCase() === "en") ? "en" : "de";
    localStorage.setItem(LANG_KEY, v);
    state.lang = v;
    try {
      document.documentElement.lang = v;
      document.documentElement.setAttribute("data-lang", v);
    } catch {}
    applyI18nStatic();
    render();
  }

  const I18N = {
    de: {
      app_title: "Rede mit Jesus",
      back: "← Zurück",
      free_today: "Heute frei:",
      texts: "Texte",
      voice: "Voice",
      credits: "Credits",
      buy_credits: "Credits kaufen",
      buy: "Kaufen",
      cancel: "Abbrechen",
      paypal_loading: "PayPal ist noch nicht geladen.",
      payment_confirming: "Zahlung wird bestätigt…",
      credits_added_alert: "✅ Credits wurden gutgeschrieben.",
      credits_added: "✅ Credits gutgeschrieben!",
      unknown_pack: "Unbekanntes Paket.",
      send: "Senden",
      placeholder_write: "Schreibe deine Nachricht...",
      placeholder_write_or_speak: "Schreibe oder sprich mit mir…",
      placeholder_free_words_used: "Heute sind die freien Worte aufgebraucht.",
      hint_ptt: "🎙️ Tippe auf das Mikrofon, sprich – und tippe erneut zum Senden.",

      hint_free_words_used: "Heute sind die freien Worte aufgebraucht.",
      modal_title: "Rede mit Jesus",
      modal_ok: "OK",
      ptt_release_send: "Tippe erneut zum Senden",

      home_hint_title: "Ein stiller Hinweis",
      home_hint_body_1: "Jeden Tag schenke ich dir",
      home_hint_body_2: "5 freie Texte",
      home_hint_body_3: "und",
      home_hint_body_4: "1 freie Stimme",
      home_hint_body_5: "Danach helfen Credits, die laufenden Kosten für Technik und KI zu tragen.",
      home_hint_mic: "Mikrofon:",
      home_hint_mic_text: "Tippe auf das Mikrofon, sprich – und tippe erneut zum Senden.",

      limit_voice: "Mein Kind,\n\nheute ist keine freie Stimme mehr verfügbar.\nKomm morgen wieder – oder nutze Credits.",
      limit_text: "Mein Kind,\n\nfür heute sind keine freien Worte mehr verfügbar.\nKomm morgen wieder – oder nutze Credits, um weiterzusprechen.",
      system_error_bot: "(Systemfehler beim Bot-Request)",
      mic_denied: "Mikrofon nicht verfügbar oder abgelehnt.",
      record_stop_failed: "Aufnahme konnte nicht beendet werden: ",
      paypal_error: "PayPal Fehler. Bitte erneut versuchen.",
      legal_imprint: "Impressum",
      legal_privacy: "Datenschutz",
      legal_terms: "AGB",
      legal_about: "Über die App",
      legal_responsibility: "Verantwortung"
    },
    en: {
      app_title: "Talk with Jesus",
      back: "← Back",
      free_today: "Free today:",
      texts: "texts",
      voice: "voice",
      credits: "Credits",
      buy_credits: "Buy credits",
      buy: "Buy",
      cancel: "Cancel",
      paypal_loading: "PayPal is still loading.",
      payment_confirming: "Confirming payment…",
      credits_added_alert: "✅ Credits have been added.",
      credits_added: "✅ Credits added!",
      unknown_pack: "Unknown package.",
      send: "Send",
      placeholder_write: "Type your message...",
      placeholder_write_or_speak: "Type or speak to me…",
      placeholder_free_words_used: "Today's free messages are used up.",
      hint_ptt: "🎙️ Hold the microphone and speak from your heart.",
      hint_free_words_used: "Today's free messages are used up.",
      modal_title: "Talk with Jesus",
      modal_ok: "OK",
      ptt_release_send: "Release to send",
      home_hint_title: "A quiet note",
      home_hint_body_1: "Every day I give you",
      home_hint_body_2: "5 free texts",
      home_hint_body_3: "and",
      home_hint_body_4: "1 free voice",
      home_hint_body_5: "After that, credits help cover the ongoing costs for technology and AI.",
      home_hint_mic: "Microphone:",
      home_hint_mic_text: "Hold it and speak freely from your heart.",
      limit_voice: "My child,\n\ntoday there is no free voice left.\nCome back tomorrow — or use credits.",
      limit_text: "My child,\n\ntoday there are no free words left.\nCome back tomorrow — or use credits to continue.",
      system_error_bot: "(System error during bot request)",
      mic_denied: "Microphone not available or permission denied.",
      record_stop_failed: "Recording could not be stopped: ",
      paypal_error: "PayPal error. Please try again.",
      legal_imprint: "Imprint",
      legal_privacy: "Privacy",
      legal_terms: "Terms",
      legal_about: "About",
      legal_responsibility: "Responsibility"
    }
  };

  function t(key) {
    const lang = state.lang || getLang();
    return (I18N[lang] && I18N[lang][key]) || (I18N.de[key] || key);
  }

  function applyI18nStatic() {
    // index.html elements with data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.getAttribute("data-i18n");
      if (!k) return;
      el.textContent = t(k);
    });
  }

    // ===== DEF-LOGGER (Recorder / PTT) =====
  function DEFLOG(scope, event, data) {
    const ts = new Date().toISOString();
    let payload = "";
    try {
      payload = data === undefined ? "" : JSON.stringify(data);
    } catch {
      payload = String(data);
    }
    console.log(`DEF|${ts}|${scope}|${event}${payload ? "|" + payload : ""}`);
  }

    const DEVICE_KEY = "rmj_device_id";
  function getDeviceId() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() || ("dev_" + Math.random().toString(16).slice(2) + Date.now()));
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  }
  const deviceId = getDeviceId();
// ===== API Base für Capacitor (Android/iOS) =====
const CAP_PLATFORM = window.Capacitor?.getPlatform?.();
const IS_NATIVE_APP = CAP_PLATFORM === "android" || CAP_PLATFORM === "ios";

// WICHTIG: hier DEINE Railway Domain eintragen (mit https://)
const API_BASE_URL = IS_NATIVE_APP ? "rede-mit-jesus-live-production.up.railway.app" : "";

function apiUrl(path) {
  return API_BASE_URL ? (API_BASE_URL + path) : path;
}

function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}
// ==============================================

  async function syncStatus() {
  try {
    const r = await apiFetch("/api/status", {
      headers: { "x-device-id": deviceId }
    });

    const j = await r.json().catch(() => ({}));

    if (r.ok && j.ok && j.status) {
      state.credits = j.status.credits ?? state.credits;
      state.dailyTextUsed = j.status.dailyTextUsed ?? state.dailyTextUsed;
      state.dailyVoiceUsed = j.status.dailyVoiceUsed ?? state.dailyVoiceUsed;
      render();
    }
  } catch (e) {
    console.warn("syncStatus failed:", e);
  }
}


  const app = document.getElementById("app");
// ===== Option A – Audio Unlock (Autoplay sicher, einmalig, ohne UI) =====
let AUDIO_UNLOCKED = false;
async function unlockAudioOnce() {
  if (AUDIO_UNLOCKED) return;
  AUDIO_UNLOCKED = true;
  try {
    const a = new Audio();
    a.muted = true;
    await a.play().catch(() => {});
  } catch {}
}
window.addEventListener("pointerdown", unlockAudioOnce, { once: true });

    const state = {
    screen: "home",        // "home" | "chat"
    character: null,       // "jesus" | "maria" | "josef"
    messages: [],          // { role: "user"|"bot", text: string }
    resumeCandidate: null,
    resumePromptShown: false,

    lang: getLang(),

    // Credits (lokal, nur UI-Vorbereitung)
    credits: 0,
    dailyTextUsed: 0,
    dailyVoiceUsed: 0
  };
  


  // ================== Conversation Persist (lokal) ==================
  const CONV_KEY_PREFIX = "rmj_conv_v1";

  function convKey(character, lang) {
    return `${CONV_KEY_PREFIX}:${deviceId}:${character}:${lang}`;
  }

  function saveConversation() {
    try {
      if (state.screen !== "chat") return;
      if (!state.character) return;

      const key = convKey(state.character, state.lang);

      // Begrenzen (z.B. die letzten 60 Messages reichen völlig)
      const messages = Array.isArray(state.messages) ? state.messages.slice(-60) : [];

      const payload = {
        v: 1,
        character: state.character,
        lang: state.lang,
        ts: Date.now(),
        messages
      };

      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn("saveConversation failed:", e);
    }
  }

  function loadConversation(character, lang) {
    try {
      const key = convKey(character, lang);
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.messages)) return null;

      return data;
    } catch (e) {
      console.warn("loadConversation failed:", e);
      return null;
    }
  }

  function clearConversation(character, lang) {
    try {
      const key = convKey(character, lang);
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("clearConversation failed:", e);
    }
  }
  // ================================================================

  syncStatus();
  applyI18nStatic();
  try { document.documentElement.lang = state.lang; } catch {}


  render();
// ===== PayPal Packages UI (Phase 8.2.3.2) =====
function setBuyStatus(msg) {
  const el = document.getElementById("buyStatus");
  if (el) el.textContent = msg || "";
}
function resetPayPalUI() {
  // alle gerenderten PayPal-Hosts entfernen
  document.querySelectorAll(".paypal-host").forEach(el => el.remove());

  // alle Cancel-Buttons entfernen
  document.querySelectorAll(".paypal-cancel").forEach(el => el.remove());

  // alle Kaufen-Buttons wieder herstellen
  document.querySelectorAll("#paypal-packages .buyBtn").forEach(b => {
    b.disabled = false;
    b.textContent = t("buy");
    b.style.display = "";
  });

  setBuyStatus("");
}

function resetPayPalUI() {
  // alle gerenderten PayPal-Hosts entfernen
  document.querySelectorAll(".paypal-host").forEach(el => el.remove());

  // alle Cancel-Buttons entfernen
  document.querySelectorAll(".paypal-cancel").forEach(el => el.remove());

  // alle Kaufen-Buttons wieder herstellen
  document.querySelectorAll("#paypal-packages .buyBtn").forEach(b => {
    b.disabled = false;
    b.textContent = "Kaufen";
    b.style.display = "";
  });

  setBuyStatus("");
}

function renderPayPalPackages() {
  const wrap = document.getElementById("paypal-packages");
  if (!wrap) return;

  // IDs müssen zu server/index.js CREDIT_PACKAGES passen
  const PACKS = [
    { id: "credits_2000",  label: "2.000 Credits",  price: "1,99 €" },
    { id: "credits_4000",  label: "4.000 Credits",  price: "3,99 €" },
    { id: "credits_6000",  label: "6.000 Credits",  price: "5,99 €" },
    { id: "credits_10000", label: "10.000 Credits", price: "8,99 €" }
  ];
// ===== PayPal Start (Phase 8.2.3.3) =====
function startPayPalBuy(packageId) {
  console.log("startPayPalBuy packageId=", packageId);


      // Immer zuerst ALLES schließen, damit nie 2 PayPal-Auswahlen gleichzeitig offen sind
  resetPayPalUI();


  // PayPal SDK muss geladen sein
  if (!window.paypal) {
        setBuyStatus(t("paypal_loading"));

    return;
  }

  const wrap = document.getElementById("paypal-packages");
  if (!wrap) return;

  // passenden Karten-Block finden
  const btn = wrap.querySelector(`.buyBtn[data-pack="${packageId}"]`);
  if (!btn) return;

  // UI: Button ersetzen durch PayPal Buttons
  btn.disabled = true;
// kein "Warten"-Text – Button ausblenden, PayPal-Buttons erscheinen direkt darunter
btn.style.display = "none";


  const buttonHost = document.createElement("div");
    buttonHost.className = "paypal-host";
  buttonHost.dataset.pack = packageId;

  buttonHost.style.marginTop = "8px";
  btn.parentElement.appendChild(buttonHost);
  // Abbrechen-Button (schließt PayPal-Auswahl wieder)
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "paypal-cancel";
  cancelBtn.textContent = t("cancel");

  cancelBtn.style.marginLeft = "10px";
  cancelBtn.style.padding = "8px 12px";
  cancelBtn.style.borderRadius = "10px";
  cancelBtn.style.border = "1px solid rgba(255,255,255,.14)";
  cancelBtn.style.background = "rgba(255,255,255,.06)";
  cancelBtn.style.color = "rgba(255,255,255,.9)";
  cancelBtn.style.cursor = "pointer";

  cancelBtn.addEventListener("click", () => {
    resetPayPalUI();
  });

  btn.parentElement.appendChild(cancelBtn);

  // Preise müssen zu deinen Paketen passen (nur Anzeige / PayPal Order)
  const PRICE_MAP = {
    credits_2000: "1.99",
    credits_4000: "3.99",
    credits_6000: "5.99",
    credits_10000: "8.99"
  };

  const value = PRICE_MAP[packageId];
  if (!value) {
       setBuyStatus(t("unknown_pack"));

    return;
  }

  setBuyStatus("");

  window.paypal.Buttons({
    createOrder: (data, actions) => {
      return actions.order.create({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "EUR",
              value
            },
            custom_id: packageId
          }
        ]
      });
    },

    onApprove: async (data, actions) => {
    setBuyStatus(t("payment_confirming"));


      // Capture passiert serverseitig in Phase 8.2.3 (oder jetzt schon über confirm)
      // Wir rufen unseren Server an, der Credits gutschreibt
      const r = await apiFetch("/api/paypal/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": deviceId
        },
        body: JSON.stringify({
          orderId: data.orderID,
          packageId
        })
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j.ok) {
        setBuyStatus("Fehler: " + (j?.error || "CONFIRM_FAILED"));
        return;
      }
// ✅ UI sofort aktualisieren (Credits neu holen + Screen neu rendern)
await syncStatus();
render();

// ✅ Kauf-UI schließen (falls du ein Modal/Overlay hast)
const buyModal =
  document.getElementById("buyCreditsModal") ||
  document.getElementById("paypalModal") ||
  document.getElementById("creditsModal");

if (buyModal) buyModal.style.display = "none";

// ✅ Mini-Feedback (falls du kein Toast-System hast)
alert(t("credits_added_alert"));

setBuyStatus(t("credits_added"));

// UI aufräumen: alle gerenderten PayPal-Hosts entfernen + Kaufbuttons wieder aktivieren
document.querySelectorAll(".paypal-host").forEach(el => el.remove());
document.querySelectorAll("#paypal-packages .buyBtn").forEach(b => {
  b.disabled = false;
  b.textContent = "Kaufen";
});

// ✅ WICHTIG: onApprove sauber schließen
}, // <-- DAS ist die fehlende Klammer bei dir!

onError: (err) => {
  console.error("PayPal error:", err);
    setBuyStatus(t("paypal_error"));

}
}).render(buttonHost);

}

  wrap.innerHTML = PACKS.map(p => `
    <div style="
      display:flex; align-items:center; justify-content:space-between;
      padding:12px; border:1px solid rgba(0,0,0,.12); border-radius:12px;
      background:#fff;
    ">
      <div>
        <div style="font-weight:700;">${p.label}</div>
        <div style="opacity:.8; font-size:13px;">${p.price}</div>
      </div>

      <button class="buyBtn" data-pack="${p.id}" style="
        padding:9px 12px; border-radius:10px; border:0; cursor:pointer;
        background:#2f6fed; color:#fff; font-weight:700;
            ">${t("buy")}</button>

    </div>
  `).join("");

  wrap.querySelectorAll(".buyBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const packId = btn.dataset.pack;
      // kommt in Schritt 8.2.3.3
      startPayPalBuy(packId);
    });
  });
}

  // ===== RENDER =====
function render() {
  // Screen-spezifische CSS-Scopes (damit Startscreen-Theme NICHT den Chat beeinflusst)
  document.body.classList.toggle("rmj-home", state.screen === "home");
  document.body.classList.toggle("rmj-chat", state.screen === "chat");

  // Chat-CSS nutzt .chat-screen als Scope (liegt auf #app)
  if (typeof app?.classList?.toggle === "function") {
    app.classList.toggle("chat-screen", state.screen === "chat");
  }

  if (state.screen === "home") return renderHome();
  if (state.screen === "chat") return renderChat();
}

function applyHomeHint() {
  const list = document.querySelector(".character-list");
  if (!list) return;

  list.setAttribute(
    "data-hint",
    state.lang === "en" ? "Tap to speak" : "Tippe, um zu sprechen"
  );
}

  function renderHome() {

        app.innerHTML = `
            <div class="app-header" style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div>${t("app_title")}</div>
        <button id="langToggle" style="
          padding:6px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);
          background:rgba(255,255,255,.06);color:rgba(255,255,255,.9);cursor:pointer;
          font-size:12px;
        ">${state.lang.toUpperCase()}</button>
      </div>


      <div class="chat-screen" style="margin-top:-6px;">
        <div style="opacity:.7;font-size:13px;">
          ${t("free_today")} <strong>${Math.max(0, 5 - state.dailyTextUsed)}</strong> ${t("texts")}, 
<strong>${Math.max(0, 1 - state.dailyVoiceUsed)}</strong> ${t("voice")}
· ${t("credits")}: <strong>${state.credits}</strong>

          <details class="buy-credits">
 <summary>${t("buy_credits")}</summary>


  <div class="buy-credits-body">
    <div id="paypal-packages" style="display:grid; gap:10px;"></div>
    <div id="buyStatus" style="margin-top:8px; font-size:13px; opacity:.8;"></div>
  </div>
</details>


        </div>
      </div>

      <div class="character-list">
        ${Object.values(CHARACTERS).map(c => `
          <div class="character-card" data-character="${c.id}">
  <div class="character-avatar">
    <img
      src="/assets/avatars/${c.id}-avatar.png"
      alt="${c.name}"
      loading="lazy"
      decoding="async"
    />
  </div>

  <div class="character-name">${c.name}</div>
  <div class="character-subtitle">${c.subtitle}</div>
</div>

        `).join("")}
      </div>
          <div class="home-info" style="
      max-width:760px;
      margin:18px auto 0;
      padding:14px 16px;
      border:1px solid rgba(255,255,255,.10);
      border-radius:14px;
      background:rgba(255,255,255,.04);
      backdrop-filter: blur(6px);
      text-align:center;
    ">
      <div style="font-weight:600; margin-bottom:6px; opacity:.95;">
        Ein stiller Hinweis
      </div>

      <div style="font-size:13px; line-height:1.45; opacity:.85;">
        Jeden Tag schenke ich dir <strong>5 freie Texte</strong> und
        <strong>1 freie Stimme</strong>.<br>
        Danach helfen Credits, die laufenden Kosten für Technik und KI zu tragen.
      </div>

      <div style="margin-top:10px; font-size:13px; opacity:.85;">
        <strong>Mikrofon:</strong> Halte es gedrückt und sprich frei aus deinem Herzen.
      </div>
    </div>

    `;

// ===== Resume-Popup (minimal) =====
if (state.resumeCandidate && !state.resumePromptShown) {
  state.resumePromptShown = true;

  const who = CHARACTERS[state.character]?.name || "";
  const title = state.lang === "en" ? "Continue?" : "Fortsetzen?";
  const text =
    state.lang === "en"
      ? `Do you want to continue your last conversation with ${who}?`
      : `Möchtest du das letzte Gespräch mit ${who} fortsetzen?`;

  const yesLabel = state.lang === "en" ? "Continue" : "Fortsetzen";
  const noLabel = state.lang === "en" ? "Start new" : "Neu starten";

  app.insertAdjacentHTML("beforeend", `
    <div id="resumeModal" style="
      position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,.45); z-index:99999;
    ">
      <div style="
      width:min(520px, 92vw);
      background:rgba(20,20,24,.96);
      border:1px solid rgba(255,255,255,.08);
      border-radius:16px;
      padding:20px 20px 16px;
      box-shadow:0 20px 60px rgba(0,0,0,.6);
      color:#fff;
      backdrop-filter: blur(10px);
    ">

        <div style="font-weight:800; font-size:16px; margin-bottom:10px;">${title}</div>
        <div style="line-height:1.35; opacity:.9;">${text}</div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px;">
          <button id="resumeNo" style="
            padding:9px 14px; border-radius:10px; border:1px solid rgba(0,0,0,.12);
            background:#fff; cursor:pointer; font-weight:600;
          ">${noLabel}</button>

          <button id="resumeYes" style="
            padding:9px 14px; border-radius:10px; border:0; cursor:pointer;
            background:#2f6fed; color:#fff; font-weight:700;
          ">${yesLabel}</button>
        </div>
      </div>
    </div>
  `);

  const modal = document.getElementById("resumeModal");
  const btnYes = document.getElementById("resumeYes");
  const btnNo = document.getElementById("resumeNo");

  // Klick auf Hintergrund = schließen (optional)
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  btnYes?.addEventListener("click", async () => {
    modal?.remove();
    state.screen = "chat";
    state.messages = Array.isArray(state.resumeCandidate?.messages) ? state.resumeCandidate.messages : [];
    state.resumeCandidate = null;
    await syncStatus();
    render();
  });

  btnNo?.addEventListener("click", async () => {
    modal?.remove();

    // altes Gespräch löschen + neu starten
    try { clearConversation(state.character, state.lang); } catch {}

    state.screen = "chat";
    state.messages = [
      {
  role: "bot",
  text: state.lang === "en"
    ? "My child, I am with you.\nSpeak freely what is on your heart."
    : "Mein Kind, ich bin bei dir.\nSprich frei, was dich bewegt."
}

    ];

    state.resumeCandidate = null;
    await syncStatus();
    render();
  });
}


    const cards = document.querySelectorAll(".character-card");
cards.forEach(card => {
  card.addEventListener("click", async () => {
    const selected = card.dataset.character; // "jesus" | "maria" | "josef"
    state.character = selected;

    // 1) Versuch: gespeichertes Gespräch laden
    const cand = loadConversation(selected, state.lang); // returns { ... , messages } oder null
    const hasSaved = !!(cand && Array.isArray(cand.messages) && cand.messages.length > 0);

    // 2) Entscheiden: fortsetzen oder neu starten
    if (hasSaved) {
      const who = CHARACTERS[selected]?.name || "";
      const msg = state.lang === "en"
        ? `Continue your last conversation with ${who}?`
        : `Möchtest du das letzte Gespräch mit ${who} fortsetzen?`;

      state.resumeCandidate = cand;
state.resumePromptShown = false;
render();
return;

    } else {
      state.messages = [];
    }

    // 3) In den Chat wechseln
    state.screen = "chat";

    // 4) Begrüßung NUR, wenn noch keine Messages existieren
    if (!Array.isArray(state.messages) || state.messages.length === 0) {
      state.messages = [
        {
          role: "bot",
          text:
            state.lang === "en"
              ? `My child, I am with you.\nSpeak freely what is on your heart.`
              : `Mein Kind, ich bin bei dir.\nSprich frei, was dich bewegt.`
        }
      ];
    }

    await syncStatus();
    render();
  });
});

// Hint unter den Charakteren (nach komplettem Render)
const list = document.querySelector(".character-list");
if (list) {
  list.setAttribute(
    "data-hint",
    state.lang === "en" ? "Tap to speak" : "Tippe, um zu sprechen"
  );
}

    const langToggle = document.getElementById("langToggle");
    if (langToggle) {
      langToggle.addEventListener("click", () => {
        setLang(state.lang === "de" ? "en" : "de");
      });
    }

renderPayPalPackages();


}


  function renderChat() {
      // PTT Overlay elements
  const recordingOverlay = document.getElementById("recordingOverlay");
  const pttTextEl = document.getElementById("pttText");

        const title = CHARACTERS[state.character].name;
const subtitle = CHARACTERS[state.character].subtitle;


        app.innerHTML = `
      <div class="chat-top">
                <button class="back-btn" id="backBtn">${t("back")}</button>

        <div class="chat-title">
  <div class="chat-avatar">
    <img src="/assets/avatars/${state.character}-avatar.png" alt="${title}" />
  </div>
  <div class="chat-title-text">
    <div class="chat-name">${title}</div>
    <div class="chat-subtitle">${subtitle}</div>
  </div>
</div>

        <div class="chat-status">
        <button id="test402Btn"
  style="
    margin-left:10px;
    padding:4px 8px;
    border-radius:8px;
    border:1px solid rgba(0,0,0,.15);
    background:#fff;
    font-size:11px;
    cursor:pointer;
    opacity:.8;
  ">
  Test 402
</button>

  frei: ${Math.max(0, 5 - state.dailyTextUsed)} Text · ${Math.max(0, 1 - state.dailyVoiceUsed)} Voice · ${state.credits} C
</div>

      </div>


      <div class="chat-wrap">
        <div class="msg-list" id="msgList"></div>

        <div class="chat-input">
  <button class="voice-btn" id="voiceBtn">🎙️</button>
    <input id="msgInput" type="text" placeholder="${t("placeholder_write")}" autocomplete="off" />

    <button class="send-btn" id="sendBtn" disabled>${t("send")}</button>

</div>
<div class="hint-line" id="hintLine"></div>
<!-- Limit-Modal (statt alert) -->
<div id="limitModal" style="
  position:fixed; inset:0; display:none; align-items:center; justify-content:center;
  background:rgba(0,0,0,.35); z-index:9999;
">
  <div style="
    width:min(560px, 92vw);
    background:#fff;
    border-radius:14px;
    padding:18px 18px 14px;
    box-shadow:0 10px 30px rgba(0,0,0,.18);
  ">
    <div style="font-weight:700; font-size:16px; margin-bottom:10px;">
            ${t("modal_title")}

    </div>
    <div id="limitModalText" style="white-space:pre-line; line-height:1.35; opacity:.9;"></div>
    <div style="display:flex; justify-content:flex-end; margin-top:14px;">
      <button id="limitModalOk" style="
        padding:9px 14px; border-radius:10px; border:0; cursor:pointer;
        background:#2f6fed; color:#fff; font-weight:600;
            ">${t("modal_ok")}</button>

    </div>
  </div>
</div>

<div class="ptt-overlay" id="pttOverlay">
  <div class="ptt-overlay-inner">
    <div class="ptt-arrow">↑</div>
    <div class="ptt-text">Loslassen zum Senden</div>
  </div>
</div>


      </div>
    `;

    // Back
    document.getElementById("backBtn").addEventListener("click", () => {
      state.screen = "home";
      state.character = null;
      state.messages = [];
      render();
    });

    // Render messages
    const msgList = document.getElementById("msgList");
    
    msgList.innerHTML = state.messages.map(m => `
      <div class="msg ${m.role === "user" ? "user" : "bot"}">
        ${escapeHtml(m.text)}

      </div>
    `).join("");
    // Auto-Scroll: immer die neuesten Nachrichten sichtbar machen
requestAnimationFrame(() => {
  const last = msgList.lastElementChild;
  if (last) {
    last.scrollIntoView({ behavior: "auto", block: "end" });
  }
});



    // Input logic
    const input = document.getElementById("msgInput");
    // Text nicht clientseitig sperren – serverseitig entscheidet /api/chat
input.disabled = false;
input.placeholder = t("placeholder_write_or_speak");


if (state.dailyTextUsed >= 5) {
  input.placeholder = t("placeholder_free_words_used");
}





    const sendBtn = document.getElementById("sendBtn");
    const hintLine = document.getElementById("hintLine");

    const textLocked = state.dailyTextUsed >= 5;
if (textLocked) {
  hintLine.textContent = t("hint_free_words_used");
} else {
  hintLine.textContent = t("hint_ptt");
}



    // Senden nur deaktivieren, wenn Feld leer ist – nicht wegen Daily-Free
sendBtn.disabled = input.value.trim().length === 0;


const voiceBtn = document.getElementById("voiceBtn");
// DEV TEST – 402 ohne Credits
const test402Btn = document.getElementById("test402Btn");
if (test402Btn) {
  test402Btn.addEventListener("click", () => {
    openLimitModal(
  "Mein Kind,\n\n" +
  "heute ist keine freie Stimme mehr verfügbar.\n" +
  "Komm morgen wieder – oder nutze Credits."
);

  });
}

const pttOverlay = document.getElementById("pttOverlay");
const pttText = pttOverlay?.querySelector(".ptt-text");
// ===== Limit-Modal helpers (statt alert) =====
const limitModal = document.getElementById("limitModal");
const limitModalText = document.getElementById("limitModalText");
const limitModalOk = document.getElementById("limitModalOk");

function openLimitModal(message) {
  if (!limitModal || !limitModalText) return;
  limitModalText.textContent = message;
  limitModal.style.display = "flex";
}

function closeLimitModal() {
  if (!limitModal) return;
  limitModal.style.display = "none";
}

if (limitModalOk) limitModalOk.addEventListener("click", closeLimitModal);
if (limitModal) limitModal.addEventListener("click", (e) => {
  if (e.target === limitModal) closeLimitModal();
});

// Voice nicht clientseitig blocken – serverseitig entscheidet /api/stt
voiceBtn.disabled = false;


// Voice nur anzeigen, wenn Charakter Voice erlaubt
if (!CHARACTERS[state.character].voiceEnabled) {
  voiceBtn.style.display = "none";
}

  input.addEventListener("input", () => {
  // Text nicht clientseitig blocken – serverseitig entscheidet /api/chat
  sendBtn.disabled = input.value.trim().length === 0;
});




    input.addEventListener("keydown", (e) => {
  // Text nicht clientseitig blocken – serverseitig entscheidet /api/chat
  if (e.key === "Enter" && !sendBtn.disabled) {
    sendMessage(false);

  }
});



    sendBtn.addEventListener("click", () => {
  
  sendMessage(false);

});

// ===== DEBUG (PTT) – minimal & risikoarm =====
const DEBUG_PTT = false; // bei Bedarf auf true stellen

function pttLog(...args) {
  if (!DEBUG_PTT) return;
  console.log(...args);
}

// Tap-to-record (Android/WebView stabil): 1x Tippen = Start, 1x Tippen = Stop+Senden
let isRecording = false;
let isRecordBusy = false;
let recordAutoStopTimer = null;

function setRecordingUI(active) {
  // Overlay / UI-States (wenn vorhanden)
  if (recordingOverlay) recordingOverlay.classList.toggle("active", !!active);
  document.body.classList.toggle("recording", !!active);
  voiceBtn.classList.toggle("recording", !!active);

  // Button-Text/Icon
  voiceBtn.textContent = active ? "⏹️" : "🎙️";

  // optionaler Hinweistext
  if (pttText) {
    pttText.textContent = active ? t("ptt_release_send") : t("hint_ptt");
  }
}

function clearAutoStop() {
  if (recordAutoStopTimer) {
    clearTimeout(recordAutoStopTimer);
    recordAutoStopTimer = null;
  }
}

function attachSafetyStops() {
  // Wenn WebView/App den Fokus verliert oder tab wechselt, sauber stoppen (einmalig pro Aufnahme)
  const stopIfRecording = async () => {
    if (!isRecording || isRecordBusy) return;
    try { await stopVoiceFlow(); } catch (_) {}
  };

  window.addEventListener("blur", stopIfRecording, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopIfRecording();
  }, { once: true });
}

async function startVoiceFlow() {
  if (voiceBtn.disabled) return;
  if (isRecording) return;

  isRecordBusy = true;

  try {
    setRecordingUI(true);
    isRecording = true;

    // Start echte Aufnahme
    await startRecording();

    // Safety: Auto-Stop nach 60s (gegen “hängen bleiben” in WebViews)
    clearAutoStop();
    recordAutoStopTimer = setTimeout(async () => {
      if (isRecording && !isRecordBusy) {
        try { await stopVoiceFlow(); } catch (_) {}
      }
    }, 60000);

    attachSafetyStops();
  } catch (err) {
    // Fallback sauber zurücksetzen
    isRecording = false;
    setRecordingUI(false);
    console.error("startRecording() failed:", err);
    alert(t("record_start_failed") + (err?.message || err));
  } finally {
    isRecordBusy = false;
  }
}

async function stopVoiceFlow() {
  if (!isRecording) return;

  isRecordBusy = true;

  try {
    clearAutoStop();

    // Stop + Blob holen
    const blob = await stopRecording();

    // Overlay aus + UI zurück
    setRecordingUI(false);
    isRecording = false;

    // Schutz: zu kurze / leere Aufnahme ignorieren
    if (!blob || blob.size < 1500) return;

    // 2) STT: gleiche Aufnahme -> Text
const sttFd = new FormData();
const ext2 = (blob && blob.type && blob.type.includes("ogg")) ? "ogg" : "webm";
sttFd.append("audio", blob, `recording.${ext2}`);

const sttRes = await apiFetch("/api/stt", {
  method: "POST",
  headers: {
    "x-device-id": deviceId,
    "x-lang": state.lang
  },
  body: sttFd
});

if (!sttRes.ok) {
  const errText = await sttRes.text().catch(() => "");
  rmjShowDebug(
    [
      "=== STT RESPONSE ERROR ===",
      `status: ${sttRes.status}`,
      `statusText: ${sttRes.statusText}`,
      "response:",
      errText
    ].join("\n")
  );
  throw new Error("STT_REQUEST_FAILED");
}

rmjShowDebug(
  [
    "=== STT DEBUG ===",
    `apiOrigin: ${API_ORIGIN || "(same-origin)"}`,
    `sttUrl: ${apiUrl("/api/stt")}`,
    `res.url: ${sttRes.url || "(no url)"}`,
    `status: ${sttRes.status} ${sttRes.statusText || ""}`,
    `content-type: ${sttRes.headers.get("content-type") || ""}`,
    `blob.size: ${blob?.size ?? "?"}`,
    `blob.type: ${blob?.type ?? "?"}`
  ].join("\n")
);

// ===== DEBUG STT (Schritt 7.1) =====
try {
  console.log("[STT] blob", {
    size: blob?.size,
    type: blob?.type
  });
} catch (e) {
  console.warn("[STT] blob log failed", e);
}

const sttContentType = sttRes.headers.get("content-type") || "";
console.log("[STT] response", {
  status: sttRes.status,
  statusText: sttRes.statusText,
  contentType: sttContentType
});

// JSON lesen (mit Fallback-Log, falls kein JSON zurückkommt)
let sttJson = {};
try {
  sttJson = await sttRes.clone().json();
} catch (e) {
  console.warn("[STT] JSON parse failed:", e);
  try {
    const raw = await sttRes.clone().text();
    console.warn("[STT] raw (first 600 chars):", String(raw || "").slice(0, 600));
  } catch (e2) {
    console.warn("[STT] raw text read failed:", e2);
  }
  sttJson = {};
}

console.log("[STT] json", sttJson);
// ===== /DEBUG STT =====


if (!sttRes.ok) {
  const detail = sttJson?.error || `HTTP_${sttRes.status}`;
  throw new Error("stt_error: " + detail);
}



const transcript = (
  sttJson.text ||
  sttJson.transcript ||
  sttJson.result ||
  ""
).trim();

if (transcript) {
  input.value = transcript;
  await sendMessage(true);
}


  } catch (err) {
    isRecording = false;
    setRecordingUI(false);
    console.error("stopRecording() failed:", err);
    alert(t("record_stop_failed") + (err?.message || err));
  } finally {
    isRecordBusy = false;
  }
}

// Toggle: 1x Tap Start, 1x Tap Stop
voiceBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (isRecordBusy) return;

  if (!isRecording) {
    await startVoiceFlow();
  } else {
    await stopVoiceFlow();
  }
});




/*voiceBtn.addEventListener("mouseleave", () => {
      if (recordingOverlay) recordingOverlay.classList.remove("active");

  if (!isRecording) return;

  // Wichtig: sofort beenden, damit mouseup nicht doppelt stoppt
  isRecording = false;

  // UI zurücksetzen
  document.body.classList.remove("recording");
  voiceBtn.classList.remove("recording");
  voiceBtn.textContent = "🎤";
  if (pttText) pttText.textContent = "";

  // Recorder "clean" abbrechen (ohne stopRecording doppelt aufzurufen)
  if (typeof cancelRecording === "function") {
    cancelRecording();
  }

  // Abbruch-Feedback
  state.messages.push({ role: "bot", text: "(Aufnahme abgebrochen)" });
  render();
});
*/



    async function sendMessage(wantTts = false) {

  const text = input.value.trim();
  if (!text) return;

  // user message
  state.messages.push({ role: "user", text });
  saveConversation();

    // Sofortiges Voice-Loading (damit es nicht "hängt" wirkt)
  const thinkingIndex = wantTts ? state.messages.length : -1;
  if (wantTts) {
    const speakingText =
  state.character === "maria" ? "Maria spricht …" :
  state.character === "josef" ? "Josef spricht …" :
  "Jesus spricht …";

state.messages.push({ role: "bot", text: speakingText });

  }

  input.value = "";
  sendBtn.disabled = true;
  render();

  // Daily-Free Textverbrauch (nur lokal, UI-Vorbereitung)
  

  try {
    const r = await apiFetch("/api/chat", {
      method: "POST",
      headers: {
  "Content-Type": "application/json",
  "x-device-id": deviceId
},

           body: JSON.stringify({
        text,
        character: state.character,
        wantTts,
        lang: state.lang
      })



    });

    const j = await r.json().catch(() => ({}));
    console.log("CHAT RES:", r.status, j);

    await syncStatus();

    // 402 = keine freien Texte / keine Credits -> IMMER Modal zeigen
if (!r.ok && r.status === 402) {
    if (wantTts && thinkingIndex >= 0 && state.messages[thinkingIndex]?.text.endsWith(" spricht …")) {
    state.messages.splice(thinkingIndex, 1);
  }

  openLimitModal(t("limit_text"));

  await syncStatus();
  render();
  return;
}





   await syncStatus();

    if (!r.ok || !j.ok) {
      throw new Error(j?.error || "CHAT_FAILED");
    }

        if (wantTts && thinkingIndex >= 0 && state.messages[thinkingIndex]) {
      state.messages[thinkingIndex] = { role: "bot", text: j.reply || "" };
    } else {
      state.messages.push({ role: "bot", text: j.reply || "" });
    }
saveConversation();

    if (j.tts?.audioBase64 && j.tts?.mime) {
  try {
    const binary = atob(j.tts.audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: j.tts.mime });
    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);
    audio.preload = "auto";

    const cleanup = () => {
      try { URL.revokeObjectURL(url); } catch {}
    };

    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });

    // Start erst, wenn genug geladen/decoded ist
    audio.addEventListener("canplaythrough", () => {
      audio.play().catch(() => {});
    }, { once: true });

    audio.load();
  } catch (e) {
    console.warn("TTS playback failed", e);
  }
}


    await syncStatus();

    render();
  } catch (e) {
        if (wantTts && thinkingIndex >= 0 && state.messages[thinkingIndex]?.text.endsWith(" spricht …")) {
      state.messages.splice(thinkingIndex, 1);
    }

    console.error(e);
    state.messages.push({ role: "bot", text: t("system_error_bot") });

    render();
  } finally {
    sendBtn.disabled = false;
  }
}

  }

  // ===== HELPERS =====


  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
});
