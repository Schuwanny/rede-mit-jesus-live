// public/js/audio/recorder.js
// Robust MediaRecorder helper (Chrome/Edge + Firefox)
// - wählt automatisch ein unterstütztes mimeType (ogg/webm)
// - gibt bei Fehlern den echten Grund (err.name/err.message) weiter

let mediaRecorder = null;
let chunks = [];
let streamRef = null;

function pickMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg"
  ];
  if (typeof MediaRecorder === "undefined") return null;
  for (const t of candidates) {
    try {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
    } catch (_) {}
  }
  return null; // -> MediaRecorder entscheidet selbst
}

export async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia) {
    const e = new Error("getUserMedia not supported");
    e.name = "NO_GETUSERMEDIA";
    throw e;
  }

  // stream holen
  try {
    try {
  streamRef = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });
} catch (err) {
  // Android/WebView Fallback: so simpel wie möglich
  try {
    streamRef = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err2) {
    const e = new Error(`${err2?.name || err?.name || "GETUSERMEDIA_FAILED"}: ${(err2?.message || err?.message || "")}`.trim());
    e.name = err2?.name || err?.name || "GETUSERMEDIA_FAILED";
    throw e;
  }
}

  } catch (err) {
    // NotAllowedError / NotFoundError / NotReadableError etc.
    const e = new Error(`${err?.name || "GETUSERMEDIA_FAILED"}: ${err?.message || ""}`.trim());
    e.name = err?.name || "GETUSERMEDIA_FAILED";
    throw e;
  }

  chunks = [];

  // MediaRecorder erstellen
  const mimeType = pickMimeType();
  try {
    const opts = mimeType ? { mimeType } : undefined;
    mediaRecorder = opts ? new MediaRecorder(streamRef, opts) : new MediaRecorder(streamRef);
  } catch (err) {
    // z.B. NotSupportedError (mimeType) oder andere
    const e = new Error(`${err?.name || "MEDIARECORDER_FAILED"}: ${err?.message || ""}`.trim());
    e.name = err?.name || "MEDIARECORDER_FAILED";
    // stream wieder sauber schließen
    try { streamRef?.getTracks()?.forEach(t => t.stop()); } catch (_) {}
    streamRef = null;
    throw e;
  }

  mediaRecorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data);
  };

  mediaRecorder.start();
}

export function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      const e = new Error("No active recording");
      e.name = "NO_ACTIVE_RECORDER";
      return reject(e);
    }

    mediaRecorder.onstop = () => {
      try {
        const mime = mediaRecorder.mimeType || (chunks[0]?.type || "audio/webm");
        const blob = new Blob(chunks, { type: mime });

        // stream freigeben
        try { streamRef?.getTracks()?.forEach(t => t.stop()); } catch (_) {}
        streamRef = null;

        // reset
        mediaRecorder = null;
        chunks = [];

        resolve(blob);
      } catch (err) {
        reject(err);
      }
    };

    try {
      mediaRecorder.stop();
    } catch (err) {
      reject(err);
    }
  });
}

// optional: Abbruch ohne Upload (z.B. bei mouseleave)
export function cancelRecording() {
  try {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
    }
  } catch (_) {}

  try { streamRef?.getTracks()?.forEach(t => t.stop()); } catch (_) {}
  streamRef = null;
  mediaRecorder = null;
  chunks = [];
}
