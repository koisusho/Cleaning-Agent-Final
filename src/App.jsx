import { useState, useEffect, useRef } from "react";

const B = {
  gold:"#F7A019", orange:"#E85D1A", red:"#C0271A",
  magenta:"#D62A6E", purple:"#6B2F8A", teal:"#00A896",
  black:"#0D0D0D", cream:"#FBF5E6", green:"#2A6B36",
  dark:"#181818", card:"#1E1E1E", muted:"#777"
};

const AREAS = [
  {id:"prep",     label:"Prep Station",       icon:"🔪", color:B.orange},
  {id:"grill",    label:"Grill & Comal",      icon:"🔥", color:B.red},
  {id:"dishpit",  label:"Dishpit",             icon:"🫧", color:B.teal},
  {id:"walkin",   label:"Walk-in Fridge",      icon:"❄️", color:"#4FC3F7"},
  {id:"storage",  label:"Dry Storage",         icon:"📦", color:B.gold},
  {id:"foh",      label:"Front of House",      icon:"🌮", color:B.magenta},
  {id:"bathrooms",label:"Bathrooms",           icon:"🚿", color:B.purple},
  {id:"patio",    label:"Patio & Outdoor",     icon:"🌿", color:B.green},
  {id:"express",  label:"CJ Express Trailer",  icon:"🚚", color:B.orange},
];

const FREQUENCIES = ["Daily","Weekly","Monthly"];
const FREQ_COLORS = {Daily:B.gold, Weekly:B.teal, Monthly:B.purple};

const DEFAULT_TASKS = [
  {id:"t1",  name:"Wipe down all prep surfaces",         area:"prep",      frequency:"Daily",   priority:"critical", timeEstimate:"10 min", products:"Food-safe degreaser, clean cloths",    sopContent:"1. Clear all items from surface.\n2. Apply food-safe degreaser, let sit 2 min.\n3. Wipe with clean cloth in circular motion.\n4. Rinse with warm water.\n5. Dry with clean towel.\n⚠️ Safety: Never mix cleaning chemicals."},
  {id:"t2",  name:"Clean comal & grill grates",          area:"grill",     frequency:"Daily",   priority:"critical", timeEstimate:"20 min", products:"Grill brush, degreaser, heat gloves",   sopContent:"1. Allow grill to cool below 60°C.\n2. Scrape grates with grill brush.\n3. Apply degreaser, scrub thoroughly.\n4. Rinse and dry.\n5. Season grates with food-grade oil.\n⚠️ Safety: Always wear heat-resistant gloves."},
  {id:"t3",  name:"Sanitise dishpit & sink area",        area:"dishpit",   frequency:"Daily",   priority:"critical", timeEstimate:"15 min", products:"Bleach solution, scrubbing pad",         sopContent:"1. Clear all dishes from sink area.\n2. Scrub sink with bleach solution (1 cap per 5L).\n3. Clean dish rack and drainage.\n4. Mop surrounding floor.\n5. Refill sanitiser bucket.\n⚠️ Safety: Wear gloves and eye protection."},
  {id:"t4",  name:"Clean & sanitise bathrooms",          area:"bathrooms", frequency:"Daily",   priority:"critical", timeEstimate:"20 min", products:"Toilet cleaner, bleach, mop",            sopContent:"1. Apply toilet cleaner, let sit 5 min.\n2. Scrub toilet bowl, wipe seat and exterior.\n3. Clean basin and tap.\n4. Mop floor with bleach solution.\n5. Refill soap, paper, and hand sanitiser.\n⚠️ Safety: Wear gloves at all times."},
  {id:"t5",  name:"Clean tortilla press & masa station", area:"prep",      frequency:"Daily",   priority:"critical", timeEstimate:"10 min", products:"Warm water, cloths, plastic scraper",   sopContent:"1. Wipe press plates with damp cloth while warm.\n2. Remove dried masa with plastic scraper.\n3. Clean surrounding counter thoroughly.\n4. Check press mechanism for damage.\n⚠️ Safety: Do not submerge press in water."},
  {id:"t6",  name:"Wipe FOH tables, chairs & menus",    area:"foh",       frequency:"Daily",   priority:"high",     timeEstimate:"15 min", products:"All-purpose spray, microfibre cloths",  sopContent:"1. Spray all table surfaces, wipe with microfibre cloth.\n2. Wipe chair seats and backs.\n3. Clean menus with damp cloth.\n4. Straighten chairs and placemats.\n5. Check Tajin, salt, pepper refills.\n⚠️ Safety: Check for loose table legs."},
  {id:"t7",  name:"Sweep & mop patio area",             area:"patio",     frequency:"Daily",   priority:"medium",   timeEstimate:"15 min", products:"Broom, mop, outdoor cleaner",           sopContent:"1. Remove furniture and sweep thoroughly.\n2. Mop with outdoor cleaner.\n3. Check furniture for damage.\n4. Reposition tables and chairs.\n⚠️ Safety: Wet floor sign required while mopping."},
  {id:"t8",  name:"Check walk-in fridge & wipe shelves",area:"walkin",    frequency:"Weekly",  priority:"high",     timeEstimate:"30 min", products:"Food-safe sanitiser, cloths",           sopContent:"1. Check all food items — discard expired.\n2. Remove items one shelf at a time.\n3. Wipe shelf with food-safe sanitiser.\n4. Check for spills on floor, mop if needed.\n5. Record temperature log (must be ≤4°C).\n⚠️ Safety: Wear jacket — limit cold exposure."},
  {id:"t9",  name:"Clean CJ Express trailer surfaces",  area:"express",   frequency:"Weekly",  priority:"high",     timeEstimate:"40 min", products:"Degreaser, cloths",                     sopContent:"1. Remove all equipment and food items.\n2. Degrease all cooking surfaces.\n3. Wipe service window and counter.\n4. Check water tank levels.\n5. Inspect waste water tank.\n⚠️ Safety: Check propane connections before service."},
  {id:"t10", name:"Deep clean dry storage & shelves",   area:"storage",   frequency:"Monthly", priority:"medium",   timeEstimate:"45 min", products:"All-purpose cleaner, vacuum, cloths",   sopContent:"1. Remove ALL items from shelves.\n2. Vacuum shelf surfaces.\n3. Wipe with all-purpose cleaner.\n4. Check all products for expiry.\n5. Return items in FIFO order.\n⚠️ Safety: Use step ladder — never overreach."},
];

function load(key, fb) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch { return fb; } }
function save(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch {} }
function getClaudeKey()  { return localStorage.getItem("cj_api_key")    || ""; }
function getGeminiKey()  { return localStorage.getItem("cj_gemini_key") || ""; }

function extractJSON(raw) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  let s = raw.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
  try { return JSON.parse(s); } catch {}
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a !== -1 && b > a) { try { return JSON.parse(s.slice(a, b+1)); } catch {} }
  const m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

// ── Bulletproof helpers ───────────────────────────────────────
const ACCEPTED_MIME    = ["image/jpeg","image/png","image/webp","image/gif"];
const HEIC_PATTERN     = /heic|heif/i;
const MAX_IMAGE_SIDE   = 1568;            // Gemini's recommended max edge
const MAX_IMAGE_BYTES  = 4 * 1024 * 1024; // ~4MB hard cap on the compressed payload
const REQUEST_TIMEOUT  = 60000;           // 60s per API call
const VALID_AREAS      = AREAS.map(a => a.id);
const VALID_PRIORITIES = ["critical","high","medium","low"];
const VALID_GRADES     = ["A+","A","B","C","D","F"];
const VALID_RISKS      = ["low","medium","high","critical"];

function fetchWithTimeout(url, opts = {}, ms = REQUEST_TIMEOUT) {
  const ctl = new AbortController();
  const id  = setTimeout(() => ctl.abort(), ms);
  return fetch(url, { ...opts, signal: ctl.signal }).finally(() => clearTimeout(id));
}

function friendlyError(e, source = "AI") {
  const m = (e?.message || String(e || "")).toLowerCase();
  if (e?.name === "AbortError" || m.includes("aborted"))
    return `Se acabó el tiempo de espera con ${source}. Revisa tu internet y reintenta.`;
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("network request"))
    return `Sin conexión a internet. Conéctate y reintenta.`;
  if (m.includes("credit") || m.includes("billing") || m.includes("quota") || m.includes("402") || m.includes("insufficient"))
    return `Tu cuenta de ${source} no tiene créditos disponibles.`;
  if (m.includes("401") || m.includes("403") || m.includes("api key") || m.includes("api_key") || m.includes("unauthorized") || m.includes("permission") || m.includes("forbidden"))
    return `La API key de ${source} es inválida o no tiene permisos.`;
  if (m.includes("429") || m.includes("rate") || m.includes("too many"))
    return `Demasiadas peticiones a ${source}. Espera unos segundos y reintenta.`;
  if (m.includes("payload") || m.includes("too large") || m.includes("413"))
    return `La imagen es muy pesada. Toma otra foto o reduce su tamaño.`;
  if (m.includes("safety") || m.includes("blocked") || m.includes("bloque"))
    return `${source} bloqueó la imagen por filtros de seguridad. Intenta con otra foto.`;
  if (m.includes("parse") || m.includes("json"))
    return `${source} regresó una respuesta no válida. Reintenta.`;
  if (m.includes("500") || m.includes("502") || m.includes("503") || m.includes("504") || m.includes("overloaded"))
    return `${source} está temporalmente saturado. Espera unos segundos y reintenta.`;
  return e?.message ? `Error de ${source}: ${e.message}` : `Error con ${source}. Reintenta.`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen. ¿Formato soportado?"));
    img.src = src;
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("No se pudo leer el archivo."));
    r.onabort = () => reject(new Error("Lectura del archivo cancelada."));
    r.readAsDataURL(file);
  });
}

async function compressImage(file) {
  if (!file) throw new Error("No se seleccionó archivo.");
  if (HEIC_PATTERN.test(file.type) || HEIC_PATTERN.test(file.name))
    throw new Error("Tu foto es HEIC/HEIF (formato iPhone). Cambia el formato a JPG en Ajustes › Cámara › Formatos › Más compatible, o conviértela antes de subir.");
  if (!file.type.startsWith("image/"))
    throw new Error("El archivo seleccionado no es una imagen.");
  if (file.size > 25 * 1024 * 1024)
    throw new Error("La foto pesa más de 25MB. Usa una más ligera.");

  const dataUrl = await readFileAsDataURL(file);
  const img     = await loadImage(dataUrl);

  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (!w || !h) throw new Error("La imagen no tiene dimensiones válidas.");

  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no soporta canvas.");
  ctx.drawImage(img, 0, 0, w, h);

  let quality = 0.85;
  let blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", quality));
  while (blob && blob.size > MAX_IMAGE_BYTES && quality > 0.4) {
    quality -= 0.15;
    blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", quality));
  }
  if (!blob) throw new Error("No se pudo comprimir la imagen.");

  const out = await readFileAsDataURL(blob);
  const base64 = out.split(",")[1] || "";
  if (!base64) throw new Error("No se pudo convertir la imagen a base64.");

  return { base64, mime: "image/jpeg", previewUrl: out, bytes: blob.size };
}

function normalizeScannedTask(t, fallbackArea = "prep") {
  if (!t || typeof t !== "object") return null;
  const name = typeof t.name === "string" ? t.name.trim() : "";
  if (!name) return null;
  return {
    name:         name.slice(0, 200),
    area:         VALID_AREAS.includes(t.area)        ? t.area      : fallbackArea,
    frequency:    FREQUENCIES.includes(t.frequency)   ? t.frequency : "Daily",
    priority:     VALID_PRIORITIES.includes(t.priority) ? t.priority : "medium",
    timeEstimate: typeof t.timeEstimate === "string" && t.timeEstimate ? t.timeEstimate.slice(0, 40) : "10 min",
    products:     typeof t.products    === "string" ? t.products.slice(0, 300) : "",
    sopContent:   typeof t.sopContent  === "string" ? t.sopContent.slice(0, 2000) : "",
    reason:       typeof t.reason      === "string" ? t.reason.slice(0, 300) : ""
  };
}

function validateScanResult(r) {
  if (!r || typeof r !== "object") throw new Error("La IA devolvió una respuesta vacía.");
  const rawTasks = Array.isArray(r.tasks) ? r.tasks : [];
  const tasks    = rawTasks.map(t => normalizeScannedTask(t)).filter(Boolean);
  if (tasks.length === 0) throw new Error("La IA no detectó tareas en esta foto. Intenta más cerca, mejor iluminación o desde otro ángulo.");
  return {
    areaDetected: typeof r.areaDetected === "string" && r.areaDetected ? r.areaDetected.slice(0, 80) : "Área detectada",
    overallRisk:  VALID_RISKS.includes(r.overallRisk) ? r.overallRisk : "medium",
    riskSummary:  typeof r.riskSummary === "string" && r.riskSummary ? r.riskSummary.slice(0, 400) : "Revisión general de higiene.",
    tasks
  };
}

async function callClaude(messages, system = "", maxTokens = 1200) {
  const key = getClaudeKey();
  if (!key) throw new Error("Falta la API key de Claude.");
  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, system, messages })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json().catch(() => null);
  if (!data) throw new Error("Claude devolvió una respuesta no parseable.");
  const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
  if (!text) throw new Error("Claude devolvió contenido vacío.");
  const parsed = extractJSON(text);
  return parsed !== null ? parsed : text;
}

async function callGeminiVision(b64, mime = "image/jpeg") {
  const key = getGeminiKey();
  if (!key) throw new Error("Falta la API key de Gemini.");
  if (!b64)  throw new Error("Imagen vacía.");
  const validMime = ACCEPTED_MIME.includes(mime) ? mime : "image/jpeg";
  const prompt = `You are a health & safety inspector for Casa Jaguar Mexican Food & Cafe in Glenorchy, NZ.
Analyze this kitchen image and identify ALL cleaning tasks, hygiene issues, and maintenance needs you can see.

Respond ONLY with this exact JSON structure, no other text:
{
  "areaDetected": "name of the kitchen area",
  "overallRisk": "low|medium|high|critical",
  "riskSummary": "one sentence about main hygiene concern",
  "tasks": [
    {
      "name": "specific cleaning task",
      "area": "prep|grill|dishpit|walkin|storage|foh|bathrooms|patio|express",
      "reason": "what you can visually see that requires this task",
      "priority": "critical|high|medium|low",
      "frequency": "Daily|Weekly|Monthly",
      "timeEstimate": "X min",
      "products": "cleaning products needed",
      "sopContent": "1. Step one\n2. Step two\n3. Step three\n4. Step four\n5. Step five\n⚠️ Safety tip"
    }
  ]
}
Every task MUST use one of the exact area codes listed above. If you cannot see at least one task, still return the JSON with an empty tasks array.`;

  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: validMime, data: b64 } },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      })
    }
  );
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gemini HTTP ${res.status}`);
  }
  const data = await res.json().catch(() => null);
  if (!data) throw new Error("Gemini devolvió una respuesta no parseable.");

  const block = data.promptFeedback?.blockReason;
  if (block) throw new Error(`Gemini bloqueó la imagen (${block}). Intenta con otra foto.`);

  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error("Gemini no devolvió resultados. Reintenta.");
  if (candidate.finishReason && !["STOP","MAX_TOKENS"].includes(candidate.finishReason)) {
    throw new Error(`Gemini detuvo el análisis (${candidate.finishReason}). Intenta otra foto.`);
  }
  const text = candidate.content?.parts?.map(p => p.text).filter(Boolean).join("") || "";
  if (!text) throw new Error("Gemini devolvió contenido vacío. Reintenta.");

  const parsed = extractJSON(text);
  if (!parsed) {
    console.error("Gemini parse failed. Raw:", text);
    throw new Error("La respuesta de Gemini no es JSON válido. Reintenta.");
  }
  return validateScanResult(parsed);
}


function getStatus(task, logs) {
  const now = Date.now(), tod = new Date().setHours(0,0,0,0), wk = now - 7*864e5, mo = now - 30*864e5;
  const tl = logs.filter(l => l.taskId === task.id);
  if (!tl.length) return "pending";
  const lat = Math.max(...tl.map(l => l.timestamp));
  if (task.frequency === "Daily")  return lat >= tod ? "completed" : "pending";
  if (task.frequency === "Weekly") return lat >= wk  ? "completed" : "pending";
  return lat >= mo ? "completed" : "pending";
}

function timeAgo(ts) {
  const m = Math.floor((Date.now()-ts)/6e4);
  if (m < 1) return "just now"; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

function pColor(p) { return p==="critical"?B.red:p==="high"?B.orange:p==="medium"?B.gold:B.teal; }

// ── Setup Screen ──────────────────────────────────────────────
function SetupScreen({ onSave }) {
  const [claudeKey, setClaudeKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [testing,   setTesting]   = useState(false);
  const [err,       setErr]       = useState("");

  const inp = (err) => ({width:"100%",background:"#252525",border:`1px solid ${err?B.red:"#3a3a3a"}`,borderRadius:10,padding:"12px 14px",color:B.cream,fontSize:13,outline:"none",fontFamily:"'Nunito',sans-serif",marginBottom:10});

  const testAndSave = async () => {
    const ck = claudeKey.trim(), gk = geminiKey.trim();
    if (!ck.startsWith("sk-ant-")) { setErr("La key de Claude debe empezar con sk-ant-"); return; }
    if (!gk)                         { setErr("Ingresa tu API key de Gemini");           return; }
    if (!gk.startsWith("AIza"))      { setErr("La key de Gemini suele empezar con AIza"); return; }
    setTesting(true); setErr("");
    localStorage.setItem("cj_api_key",    ck);
    localStorage.setItem("cj_gemini_key", gk);
    try {
      await callClaude([{ role:"user", content:"hi" }], "Say ok", 10);
      onSave();
    } catch(e) {
      const msg = (e.message || "").toLowerCase();
      const isCreditOrAuth = msg.includes("credit") || msg.includes("billing") || msg.includes("402")
                           || msg.includes("401") || msg.includes("auth") || msg.includes("api key");
      if (isCreditOrAuth) {
        // Borra credenciales malas para que el usuario las corrija
        localStorage.removeItem("cj_api_key");
        setErr(friendlyError(e, "Claude") + " Corrige y reintenta.");
      } else {
        // Errores transitorios (red, timeout, 5xx) — guardamos y dejamos pasar
        console.warn("Claude test no concluyente:", e);
        onSave();
      }
    }
    setTesting(false);
  };

  return (
    <div style={{background:B.black,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{maxWidth:400,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:56,marginBottom:12}}>🐆</div>
          <div style={{fontWeight:900,fontSize:24,color:B.gold,letterSpacing:"0.05em"}}>CASA JAGUAR</div>
          <div style={{fontSize:11,color:B.muted,letterSpacing:"0.18em",marginTop:4}}>CLEAN & SOP AGENT</div>
        </div>

        <div style={{background:B.card,borderRadius:16,padding:20,border:"1px solid #2a2a2a",marginBottom:12}}>
          <div style={{fontWeight:800,fontSize:12,color:B.gold,marginBottom:4}}>🤖 Claude API Key</div>
          <div style={{fontSize:10,color:B.muted,marginBottom:10}}>For AI Audit & SOP generation · <span style={{color:B.teal}}>console.anthropic.com</span></div>
          <input type="password" value={claudeKey} onChange={e=>setClaudeKey(e.target.value)} placeholder="sk-ant-api03-..." style={inp(false)} />

          <div style={{fontWeight:800,fontSize:12,color:"#4285F4",marginBottom:4,marginTop:6}}>🔍 Gemini API Key</div>
          <div style={{fontSize:10,color:B.muted,marginBottom:10}}>For AI Kitchen Eye photo scan · <span style={{color:"#4285F4"}}>aistudio.google.com</span></div>
          <input type="password" value={geminiKey} onChange={e=>setGeminiKey(e.target.value)} placeholder="AIza..." style={inp(false)} />

          {err && <div style={{fontSize:11,color:B.red,marginBottom:10,lineHeight:1.5}}>⚠️ {err}</div>}
          <button
            onClick={testAndSave}
            disabled={testing || !claudeKey.trim() || !geminiKey.trim()}
            style={{width:"100%",padding:"13px",borderRadius:12,border:"none",background:(claudeKey.trim()&&geminiKey.trim())?`linear-gradient(135deg,${B.gold},${B.orange})`:"#2a2a2a",color:(claudeKey.trim()&&geminiKey.trim())?B.black:B.muted,fontWeight:900,fontSize:14,cursor:(claudeKey.trim()&&geminiKey.trim())?"pointer":"default",marginTop:4}}
          >
            {testing ? "⏳ Connecting..." : "CONNECT & START →"}
          </button>
        </div>

        <div style={{background:`rgba(0,168,150,0.08)`,border:`1px solid ${B.teal}33`,borderRadius:12,padding:14}}>
          <div style={{fontWeight:800,fontSize:11,color:B.teal,marginBottom:8}}>🔑 How to get API keys</div>
          <div style={{fontSize:11,color:B.muted,lineHeight:2}}>
            <span style={{color:B.gold}}>Claude:</span> console.anthropic.com → API Keys<br/>
            <span style={{color:"#4285F4"}}>Gemini:</span> aistudio.google.com → Get API Key<br/>
            Both are free to start ✓
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
function MainApp() {
  const [tasks,    setTasks]    = useState(() => load("cj_tasks", DEFAULT_TASKS));
  const [logs,     setLogs]     = useState(() => load("cj_logs", []));
  const [view,     setView]     = useState("checklist");
  const [manager,  setManager]  = useState(false);
  const [selTask,  setSelTask]  = useState(null);
  const [freq,     setFreq]     = useState("Daily");
  const [area,     setArea]     = useState("all");
  const [audit,    setAudit]    = useState(null);
  const [auditing, setAuditing] = useState(false);

  useEffect(() => { save("cj_tasks", tasks); }, [tasks]);
  useEffect(() => { save("cj_logs",  logs);  }, [logs]);

  const completeTask = (task, staff, notes) => {
    setLogs(p => [{
      id:`l${Date.now()}`, taskId:task.id, taskName:task.name,
      area:task.area, frequency:task.frequency, staffName:staff, notes,
      timestamp:Date.now(), dateString:new Date().toLocaleDateString("en-NZ")
    }, ...p]);
    setSelTask(null);
  };

  const addTask = (t) => {
    const safe = normalizeScannedTask(t);
    if (!safe) return;
    setTasks(p => [...p, { ...safe, id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}` }]);
  };
  const deleteTask = id => { setTasks(p => p.filter(t => t.id !== id)); setSelTask(null); };

  const runAudit = async () => {
    setAuditing(true);
    const tod = new Date().toLocaleDateString("en-NZ");
    const tl  = logs.filter(l => l.dateString === tod);
    const daily   = tasks.filter(t => t.frequency === "Daily");
    const missing = daily.filter(t => getStatus(t, logs) === "pending").map(t => t.name);
    const sc  = tl.reduce((a,l) => { a[l.staffName]=(a[l.staffName]||0)+1; return a; }, {});
    const top = Object.entries(sc).sort((a,b) => b[1]-a[1])[0];
    try {
      const r = await callClaude(
        [{ role:"user", content:`Casa Jaguar kitchen compliance. Completed: ${tl.length}/${daily.length} daily. Missing: ${missing.join(",")||"None"}. Top staff: ${top?`${top[0]} (${top[1]})`:"None yet"}. Return ONLY JSON: {"score":number,"grade":"A+|A|B|C|D|F","summary":"2 sentences","shoutout":"praise","recommendation":"1 tip","criticalMissing":"missing task or All done!"}` }],
        "You are a health inspector. JSON only."
      );
      if (!r || typeof r !== "object") throw new Error("Respuesta no estructurada.");
      setAudit({
        score:           typeof r.score === "number" ? r.score : 0,
        grade:           VALID_GRADES.includes(r.grade) ? r.grade : "—",
        summary:         typeof r.summary === "string" ? r.summary : "",
        shoutout:        typeof r.shoutout === "string" ? r.shoutout : "",
        recommendation:  typeof r.recommendation === "string" ? r.recommendation : "",
        criticalMissing: typeof r.criticalMissing === "string" ? r.criticalMissing : "",
        error: false
      });
    } catch(e) {
      console.error(e);
      setAudit({
        score: 0, grade: "—",
        summary: friendlyError(e, "Claude"),
        shoutout: "", recommendation: "", criticalMissing: "",
        error: true
      });
    }
    setAuditing(false);
  };

  const downloadCSV = () => {
    const rows = logs.map(l => [new Date(l.timestamp).toISOString(), l.dateString, `"${l.taskName}"`, l.area, l.frequency, `"${l.staffName}"`, `"${l.notes||""}"`]);
    const csv = [["Timestamp","Date","Task","Area","Freq","Staff","Notes"], ...rows].map(r=>r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `CasaJaguar_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const todayStr    = new Date().toLocaleDateString("en-NZ");
  const todayLogs   = logs.filter(l => l.dateString === todayStr);
  const daily       = tasks.filter(t => t.frequency === "Daily");
  const doneToday   = daily.filter(t => getStatus(t, logs) === "completed").length;
  const pct         = daily.length ? Math.round(doneToday / daily.length * 100) : 0;
  const critPending = tasks.filter(t => t.priority === "critical" && getStatus(t, logs) === "pending").length;
  const filtered    = tasks.filter(t => t.frequency === freq && (area === "all" || t.area === area));

  const s = (extra={}) => ({ fontFamily:"'Nunito',sans-serif", ...extra });

  return (
    <div style={s({background:B.black,minHeight:"100vh",color:B.cream,maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column"})}>

      {/* Header */}
      <div style={{background:B.dark,borderBottom:`2px solid ${B.gold}`,padding:"11px 15px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:`linear-gradient(135deg,${B.gold},${B.orange})`,borderRadius:10,padding:"5px 9px",fontSize:18}}>🐆</div>
          <div>
            <div style={{fontWeight:900,fontSize:13,letterSpacing:"0.06em",color:B.gold}}>CASA JAGUAR</div>
            <div style={{fontSize:9,color:B.muted,letterSpacing:"0.14em"}}>CLEAN & SOP AGENT</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={() => setManager(m=>!m)} style={{fontSize:10,fontWeight:800,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${manager?B.gold:"#444"}`,background:manager?`rgba(247,160,25,0.12)`:"transparent",color:manager?B.gold:B.muted,cursor:"pointer"}}>
            {manager ? "⭐ MANAGER" : "STAFF VIEW"}
          </button>
          <button onClick={() => { if(confirm("Sign out and remove API keys?")) { localStorage.removeItem("cj_api_key"); localStorage.removeItem("cj_gemini_key"); window.location.reload(); }}} style={{background:"transparent",border:"none",color:"#444",cursor:"pointer",fontSize:20}}>⚙</button>
        </div>
      </div>

      {/* Body */}
      <div style={{flex:1,overflowY:"auto",paddingBottom:80}}>

        {/* CHECKLIST */}
        {view === "checklist" && (
          <div style={{padding:14}}>

            {/* Manager dashboard */}
            {manager && (
              <div style={{background:"linear-gradient(135deg,#1a0a00,#0a1200)",border:`1px solid ${B.gold}`,borderRadius:16,padding:14,marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:10,color:B.muted,letterSpacing:"0.1em",marginBottom:3}}>TODAY'S COMPLIANCE</div>
                    <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                      <div style={{fontSize:40,fontWeight:900,color:pct>=80?B.teal:pct>=60?B.gold:B.red,lineHeight:1}}>{pct}%</div>
                      {audit && <div style={{fontSize:20,fontWeight:900,color:audit.error?B.red:B.gold}}>{audit.grade}</div>}
                    </div>
                    <div style={{fontSize:10,color:B.muted,marginTop:3}}>{doneToday}/{daily.length} daily tasks</div>
                  </div>
                  <button onClick={runAudit} disabled={auditing} style={{background:`rgba(247,160,25,0.12)`,border:`1px solid ${B.gold}`,color:B.gold,borderRadius:12,padding:"7px 12px",fontSize:11,fontWeight:800,cursor:"pointer"}}>
                    {auditing ? "⏳" : "✨"} AI AUDIT
                  </button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:audit?10:0}}>
                  {[{l:"Critical Pending",v:critPending,c:critPending>0?B.red:B.teal},{l:"Logged Today",v:todayLogs.length,c:B.gold},{l:"Total Tasks",v:tasks.length,c:B.teal}].map(({l,v,c}) => (
                    <div key={l} style={{background:"rgba(0,0,0,0.3)",borderRadius:10,padding:"7px 0",textAlign:"center"}}>
                      <div style={{fontSize:20,fontWeight:900,color:c}}>{v}</div>
                      <div style={{fontSize:8,color:B.muted}}>{l}</div>
                    </div>
                  ))}
                </div>
                {audit && (
                  <div style={{background:"rgba(0,0,0,0.3)",borderRadius:10,padding:10,fontSize:11,lineHeight:1.7,border:audit.error?`1px solid ${B.red}55`:"none"}}>
                    {audit.error ? (
                      <div style={{color:B.red}}>⚠️ {audit.summary}</div>
                    ) : (
                      <>
                        {audit.summary        && <div style={{color:B.cream,marginBottom:4}}>⚡ {audit.summary}</div>}
                        {audit.shoutout       && <div style={{color:B.gold,marginBottom:4}}>⭐ {audit.shoutout}</div>}
                        {audit.recommendation && <div style={{color:B.teal}}>💡 {audit.recommendation}</div>}
                        {audit.criticalMissing && audit.criticalMissing !== "All done!" && (
                          <div style={{color:B.red,marginTop:5,fontWeight:700}}>⚠️ {audit.criticalMissing}</div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Frequency tabs */}
            <div style={{display:"flex",background:"#1a1a1a",borderRadius:11,padding:3,marginBottom:12,gap:3}}>
              {FREQUENCIES.map(f => (
                <button key={f} onClick={() => setFreq(f)} style={{flex:1,padding:"8px 0",borderRadius:9,fontSize:11,fontWeight:800,border:"none",cursor:"pointer",background:freq===f?FREQ_COLORS[f]:"transparent",color:freq===f?B.black:B.muted}}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Area chips */}
            <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:12,paddingBottom:4,scrollbarWidth:"none"}}>
              <button onClick={() => setArea("all")} style={{flexShrink:0,padding:"4px 11px",borderRadius:20,fontSize:10,fontWeight:700,border:`1px solid ${area==="all"?B.gold:"#333"}`,background:area==="all"?`rgba(247,160,25,0.12)`:"transparent",color:area==="all"?B.gold:B.muted,cursor:"pointer"}}>All</button>
              {AREAS.map(a => (
                <button key={a.id} onClick={() => setArea(a.id)} style={{flexShrink:0,padding:"4px 11px",borderRadius:20,fontSize:10,fontWeight:700,border:`1px solid ${area===a.id?a.color:"#333"}`,background:area===a.id?`${a.color}22`:"transparent",color:area===a.id?a.color:B.muted,cursor:"pointer"}}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>

            {/* Task list */}
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {filtered.length === 0 && (
                <div style={{textAlign:"center",padding:"40px 0",color:B.muted}}>
                  <div style={{fontSize:32,marginBottom:8}}>✅</div>
                  <div style={{fontWeight:700}}>No tasks for this filter</div>
                </div>
              )}
              {filtered.map(task => {
                const st = getStatus(task, logs);
                const ar = AREAS.find(a => a.id === task.area);
                const ll = logs.filter(l => l.taskId === task.id)[0];
                return (
                  <div key={task.id} onClick={() => setSelTask(task)} style={{background:B.card,borderRadius:13,padding:"13px 14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:`1px solid ${st==="completed"?B.teal+"44":"#2a2a2a"}`,position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:st==="completed"?B.teal:pColor(task.priority),borderRadius:"13px 0 0 13px"}}/>
                    <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${st==="completed"?B.teal:"#444"}`,background:st==="completed"?B.teal:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:5}}>
                      {st === "completed" && <span style={{color:B.black,fontSize:12}}>✓</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:800,fontSize:13,color:st==="completed"?B.muted:B.cream,textDecoration:st==="completed"?"line-through":"none",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{task.name}</div>
                      <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}>
                        <span style={{fontSize:10,color:ar?.color||B.gold}}>{ar?.icon} {ar?.label}</span>
                        <span style={{fontSize:10,color:pColor(task.priority),fontWeight:700,textTransform:"uppercase"}}>● {task.priority}</span>
                        {task.timeEstimate && <span style={{fontSize:10,color:B.muted}}>⏱ {task.timeEstimate}</span>}
                      </div>
                      {ll && st === "completed" && <div style={{fontSize:10,color:B.teal,marginTop:2}}>✓ {ll.staffName} · {timeAgo(ll.timestamp)}</div>}
                    </div>
                    <span style={{color:"#444",fontSize:16}}>›</span>
                  </div>
                );
              })}
              {manager && (
                <button onClick={() => setView("manage")} style={{padding:"13px",borderRadius:13,border:"2px dashed #333",background:"transparent",color:B.muted,fontWeight:800,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  + Add New Task
                </button>
              )}
            </div>
          </div>
        )}

        {/* AI SCAN */}
        {view === "ai-scan" && <AIScanView addTask={addTask} />}

        {/* LOGBOOK */}
        {view === "logbook" && (
          <div style={{padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontWeight:900,fontSize:16,color:B.gold}}>📋 LOGBOOK</div>
              <button onClick={downloadCSV} style={{background:`rgba(0,168,150,0.12)`,border:`1px solid ${B.teal}`,color:B.teal,borderRadius:20,padding:"5px 12px",fontSize:10,fontWeight:800,cursor:"pointer"}}>⬇ EXPORT CSV</button>
            </div>
            {logs.length === 0 ? (
              <div style={{textAlign:"center",padding:"60px 0",color:B.muted}}>
                <div style={{fontSize:36,marginBottom:10}}>📋</div>
                <div style={{fontWeight:700}}>No logs yet — complete a task to start</div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {logs.map(log => {
                  const ar = AREAS.find(a => a.id === log.area);
                  return (
                    <div key={log.id} style={{background:B.card,borderRadius:11,padding:"11px 13px",border:"1px solid #252525",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:12,color:B.cream}}>{log.taskName}</div>
                        <div style={{fontSize:10,color:B.muted,marginTop:2}}>{ar?.icon} {log.staffName} · {log.dateString}</div>
                        {log.notes && <div style={{fontSize:10,color:B.teal,marginTop:2,fontStyle:"italic"}}>"{log.notes}"</div>}
                      </div>
                      <div style={{fontSize:10,color:B.gold,fontWeight:700,flexShrink:0,marginLeft:8}}>
                        {new Date(log.timestamp).toLocaleTimeString("en-NZ",{hour:"2-digit",minute:"2-digit"})}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MANAGE */}
        {view === "manage" && <ManageView tasks={tasks} onAdd={addTask} onDelete={deleteTask} onBack={() => setView("checklist")} />}
      </div>

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:B.dark,borderTop:"1px solid #2a2a2a",display:"flex",justifyContent:"space-around",padding:"10px 0 16px",zIndex:50}}>
        {[
          {id:"checklist", icon:"📋", label:"Tasks"},
          {id:"ai-scan",   icon:"📷", label:"AI Scan"},
          {id:"logbook",   icon:"📖", label:"Logbook"},
          ...(manager ? [{id:"manage", icon:"⚙️", label:"Manage"}] : []),
        ].map(({id,icon,label}) => (
          <button key={id} onClick={() => setView(id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"3px 14px",color:view===id?B.gold:B.muted}}>
            <span style={{fontSize:view===id?22:20}}>{icon}</span>
            <span style={{fontSize:8,fontWeight:900,letterSpacing:"0.08em"}}>{label.toUpperCase()}</span>
            {view===id && <div style={{width:4,height:4,borderRadius:"50%",background:B.gold}}/>}
          </button>
        ))}
      </div>

      {selTask && <TaskModal task={selTask} logs={logs} onClose={() => setSelTask(null)} onComplete={completeTask} onDelete={manager ? () => deleteTask(selTask.id) : null} />}
    </div>
  );
}

// ── AI Scan ───────────────────────────────────────────────────
function AIScanView({ addTask }) {
  const [img,         setImg]         = useState(null);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [result,      setResult]      = useState(null);
  const [added,       setAdded]       = useState(new Set());
  const [err,         setErr]         = useState(null);
  const [phase,       setPhase]       = useState("");        // "compressing" | "analyzing"
  const [lastPayload, setLastPayload] = useState(null);      // { base64, mime } para reintentar
  const uploadIdRef = useRef(0);

  const runAnalysis = async (base64, mime, uploadId) => {
    setPhase("analyzing");
    try {
      const r = await callGeminiVision(base64, mime);
      if (uploadIdRef.current !== uploadId) return;
      setResult(r);
      setErr(null);
    } catch(e) {
      if (uploadIdRef.current !== uploadId) return;
      console.error(e);
      setErr(friendlyError(e, "Gemini"));
    } finally {
      if (uploadIdRef.current === uploadId) { setAnalyzing(false); setPhase(""); }
    }
  };

  const handleImg = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";    // permite re-seleccionar la misma foto
    if (!file) return;
    const uploadId = ++uploadIdRef.current;
    setAnalyzing(true); setResult(null); setErr(null); setAdded(new Set()); setImg(null); setLastPayload(null);
    setPhase("compressing");
    try {
      const { base64, mime, previewUrl } = await compressImage(file);
      if (uploadIdRef.current !== uploadId) return;
      setImg(previewUrl);
      setLastPayload({ base64, mime });
      await runAnalysis(base64, mime, uploadId);
    } catch(ex) {
      if (uploadIdRef.current !== uploadId) return;
      console.error(ex);
      setErr(ex.message || "Error procesando la imagen.");
      setAnalyzing(false); setPhase("");
    }
  };

  const retry = async () => {
    if (!lastPayload || analyzing) return;
    const uploadId = ++uploadIdRef.current;
    setAnalyzing(true); setErr(null); setResult(null); setAdded(new Set());
    await runAnalysis(lastPayload.base64, lastPayload.mime, uploadId);
  };

  const reset = () => {
    uploadIdRef.current++;                // invalida cualquier análisis en vuelo
    setImg(null); setResult(null); setErr(null); setAdded(new Set()); setAnalyzing(false); setPhase(""); setLastPayload(null);
  };

  const riskC = r => r==="critical"?B.red:r==="high"?B.orange:r==="medium"?B.gold:B.teal;

  return (
    <div style={{padding:14}}>
      <div style={{textAlign:"center",marginBottom:18}}>
        <div style={{fontSize:20,fontWeight:900,color:B.gold}}>🐆 AI KITCHEN EYE</div>
        <div style={{fontSize:11,color:B.muted,marginTop:4}}>Snap any station — get instant analysis & SOP</div>
      </div>

      {(!img && !analyzing) ? (
        <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:"100%",height:220,border:`2px dashed ${B.gold}`,borderRadius:18,background:"rgba(247,160,25,0.04)",cursor:"pointer"}}>
          <span style={{fontSize:44}}>📷</span>
          <div style={{fontWeight:900,fontSize:15,color:B.gold,marginTop:10}}>SNAP OR UPLOAD PHOTO</div>
          <div style={{fontSize:11,color:B.muted,marginTop:5}}>Prep, grill, fridge, FOH, bathrooms...</div>
          <div style={{fontSize:10,color:B.muted,marginTop:3}}>JPG, PNG o WebP · max 25MB</div>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" capture="environment" style={{display:"none"}} onChange={handleImg} />
        </label>
      ) : (
        <div style={{position:"relative",borderRadius:14,overflow:"hidden",marginBottom:14,background:"#000",minHeight:220}}>
          {img && <img src={img} alt="scan" style={{width:"100%",height:220,objectFit:"cover",display:"block"}} />}
          {analyzing && (
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
              <span style={{fontSize:36,display:"inline-block",animation:"spin 2s linear infinite"}}>🐆</span>
              <div style={{fontWeight:900,fontSize:13,color:B.gold}}>
                {phase === "compressing" ? "PREPARANDO IMAGEN..." : "ANALIZANDO COCINA..."}
              </div>
              <div style={{fontSize:10,color:B.muted}}>Puede tardar hasta 60s</div>
            </div>
          )}
          {!analyzing && (
            <button onClick={reset} style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,0.7)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:B.cream,fontSize:16}}>×</button>
          )}
        </div>
      )}

      {err && (
        <div style={{background:`rgba(192,39,26,0.12)`,border:`1px solid ${B.red}`,borderRadius:10,padding:12,marginBottom:12}}>
          <div style={{color:B.red,fontSize:12,textAlign:"center",marginBottom:lastPayload?10:0,lineHeight:1.5}}>⚠️ {err}</div>
          {lastPayload && (
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={retry} disabled={analyzing} style={{background:B.gold,color:B.black,border:"none",borderRadius:8,padding:"7px 14px",fontSize:11,fontWeight:900,cursor:analyzing?"default":"pointer"}}>
                🔄 REINTENTAR
              </button>
              <button onClick={reset} style={{background:"transparent",color:B.muted,border:`1px solid ${B.muted}55`,borderRadius:8,padding:"7px 14px",fontSize:11,fontWeight:800,cursor:"pointer"}}>
                ✕ CANCELAR
              </button>
            </div>
          )}
        </div>
      )}

      {result && !analyzing && (
        <div>
          <div style={{background:B.card,borderRadius:13,padding:12,marginBottom:12,border:`1px solid ${riskC(result.overallRisk)}44`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontWeight:900,fontSize:12,color:B.cream}}>📍 {result.areaDetected}</div>
              <span style={{fontSize:9,fontWeight:800,padding:"3px 9px",borderRadius:20,background:`${riskC(result.overallRisk)}22`,color:riskC(result.overallRisk),border:`1px solid ${riskC(result.overallRisk)}55`,textTransform:"uppercase"}}>{result.overallRisk} RISK</span>
            </div>
            <div style={{fontSize:11,color:B.muted,lineHeight:1.5}}>{result.riskSummary}</div>
          </div>
          <div style={{fontWeight:900,fontSize:11,color:B.gold,marginBottom:9}}>AI FOUND {result.tasks?.length||0} TASKS</div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {(result.tasks||[]).map((task, idx) => {
              const isAdded = added.has(idx);
              return (
                <div key={idx} style={{background:B.card,borderRadius:13,padding:12,border:`1px solid ${isAdded?B.teal+"44":"#2a2a2a"}`,borderLeft:`3px solid ${pColor(task.priority)}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                    <div style={{flex:1,marginRight:8}}>
                      <div style={{fontWeight:800,fontSize:13,color:B.cream}}>{task.name}</div>
                      <div style={{fontSize:10,color:pColor(task.priority),marginTop:2,fontWeight:700}}>⚠️ {task.reason}</div>
                    </div>
                    <button onClick={() => { if(!isAdded) { addTask({...task,createdAt:Date.now()}); setAdded(p => new Set([...p,idx])); }}} style={{flexShrink:0,padding:"6px 12px",borderRadius:9,border:"none",background:isAdded?`rgba(0,168,150,0.18)`:B.gold,color:isAdded?B.teal:B.black,fontSize:10,fontWeight:900,cursor:isAdded?"default":"pointer"}}>
                      {isAdded ? "✓ ADDED" : "+ ADD"}
                    </button>
                  </div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:7}}>
                    {task.timeEstimate && <span style={{fontSize:9,color:B.muted}}>⏱ {task.timeEstimate}</span>}
                    {task.products     && <span style={{fontSize:9,color:B.muted}}>🧴 {task.products.split(",")[0]}</span>}
                    <span style={{fontSize:9,color:FREQ_COLORS[task.frequency]||B.gold,fontWeight:700}}>{task.frequency}</span>
                  </div>
                  {task.sopContent && (
                    <div style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontSize:9,fontWeight:800,color:B.teal,marginBottom:4}}>SOP STEPS</div>
                      <div style={{fontSize:10,color:"#aaa",lineHeight:1.8,whiteSpace:"pre-line"}}>{task.sopContent}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Task Modal ────────────────────────────────────────────────
function TaskModal({ task, logs, onClose, onComplete, onDelete }) {
  const [staff,   setStaff]   = useState("");
  const [notes,   setNotes]   = useState("");
  const [showSOP, setShowSOP] = useState(true);
  const st   = getStatus(task, logs);
  const ar   = AREAS.find(a => a.id === task.area);
  const tl   = logs.filter(l => l.taskId === task.id).slice(0, 5);
  const last = tl[0];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:B.dark,width:"100%",maxWidth:480,borderRadius:"18px 18px 0 0",maxHeight:"88vh",overflowY:"auto",border:"1px solid #2a2a2a",borderBottom:"none"}}>
        <div style={{padding:"14px 14px 11px",borderBottom:"1px solid #222",position:"sticky",top:0,background:B.dark,zIndex:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:900,fontSize:15,color:B.cream,lineHeight:1.3}}>{task.name}</div>
              <div style={{fontSize:10,color:ar?.color||B.gold,marginTop:3}}>{ar?.icon} {ar?.label} · {task.frequency}</div>
            </div>
            <button onClick={onClose} style={{background:"#2a2a2a",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:B.muted,flexShrink:0,marginLeft:8,fontSize:16}}>×</button>
          </div>
          <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
            <span style={{fontSize:9,padding:"3px 9px",borderRadius:20,fontWeight:800,background:`${pColor(task.priority)}22`,color:pColor(task.priority),border:`1px solid ${pColor(task.priority)}44`,textTransform:"uppercase"}}>{task.priority}</span>
            {task.timeEstimate && <span style={{fontSize:9,padding:"3px 9px",borderRadius:20,background:"#2a2a2a",color:B.muted}}>⏱ {task.timeEstimate}</span>}
            {task.products     && <span style={{fontSize:9,padding:"3px 9px",borderRadius:20,background:"#2a2a2a",color:B.muted}}>🧴 {task.products.split(",")[0]}</span>}
          </div>
        </div>
        <div style={{padding:14}}>
          {task.sopContent && (
            <div style={{marginBottom:14}}>
              <button onClick={() => setShowSOP(s=>!s)} style={{width:"100%",background:`rgba(0,168,150,0.08)`,border:`1px solid ${B.teal}44`,borderRadius:10,padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",color:B.teal,fontWeight:800,fontSize:11}}>
                <span>🛡 SOP GUIDELINES</span>
                <span style={{transform:showSOP?"rotate(180deg)":"none",display:"inline-block",transition:"transform 0.2s"}}>▾</span>
              </button>
              {showSOP && (
                <div style={{background:"rgba(0,0,0,0.3)",borderRadius:"0 0 10px 10px",padding:"10px 12px",border:`1px solid ${B.teal}22`,borderTop:"none"}}>
                  <div style={{fontSize:11,color:"#ccc",lineHeight:1.9,whiteSpace:"pre-line"}}>{task.sopContent}</div>
                </div>
              )}
            </div>
          )}

          {st !== "completed" ? (
            <div>
              <div style={{fontSize:9,fontWeight:800,color:B.muted,marginBottom:6}}>RECORDED BY</div>
              <input value={staff} onChange={e=>setStaff(e.target.value)} placeholder="Enter your name" style={{width:"100%",background:"#252525",border:"1px solid #3a3a3a",borderRadius:11,padding:"11px 13px",color:B.cream,fontSize:13,fontWeight:600,outline:"none",fontFamily:"'Nunito',sans-serif",marginBottom:9}} />
              <div style={{fontSize:9,fontWeight:800,color:B.muted,marginBottom:6}}>NOTES (optional)</div>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any issues or observations..." rows={2} style={{width:"100%",background:"#252525",border:"1px solid #3a3a3a",borderRadius:11,padding:"11px 13px",color:B.cream,fontSize:12,outline:"none",resize:"none",marginBottom:12,fontFamily:"'Nunito',sans-serif"}} />
              <button disabled={!staff.trim()} onClick={() => onComplete(task, staff.trim(), notes.trim())} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:staff.trim()?`linear-gradient(135deg,${B.gold},${B.orange})`:"#2a2a2a",color:staff.trim()?B.black:B.muted,fontWeight:900,fontSize:14,cursor:staff.trim()?"pointer":"default"}}>
                ✓ MARK COMPLETE
              </button>
            </div>
          ) : (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:44,marginBottom:8}}>✅</div>
              <div style={{fontWeight:900,fontSize:15,color:B.teal}}>TASK COMPLETE</div>
              {last && <div style={{fontSize:11,color:B.muted,marginTop:5}}>{last.staffName} · {timeAgo(last.timestamp)}</div>}
            </div>
          )}

          {tl.length > 0 && (
            <div style={{marginTop:18}}>
              <div style={{fontSize:9,fontWeight:800,color:B.muted,marginBottom:8}}>RECENT HISTORY</div>
              {tl.map(log => (
                <div key={log.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #1e1e1e",fontSize:11}}>
                  <div style={{color:B.cream}}>{log.staffName}</div>
                  <div style={{color:B.muted}}>{log.dateString} · {new Date(log.timestamp).toLocaleTimeString("en-NZ",{hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              ))}
            </div>
          )}

          {onDelete && (
            <button onClick={onDelete} style={{width:"100%",marginTop:14,padding:"11px",borderRadius:11,border:`1px solid ${B.red}44`,background:`rgba(192,39,26,0.08)`,color:B.red,fontWeight:700,fontSize:11,cursor:"pointer"}}>
              🗑 Delete Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Manage View ───────────────────────────────────────────────
function ManageView({ tasks, onAdd, onDelete, onBack }) {
  const [adding,  setAdding]  = useState(false);
  const [genSOP,  setGenSOP]  = useState(false);
  const [sopErr,  setSopErr]  = useState("");
  const [nt, setNT] = useState({name:"",area:"prep",frequency:"Daily",priority:"high",timeEstimate:"",products:"",sopContent:""});

  const generateSOP = async () => {
    if (!nt.name.trim()) return;
    setGenSOP(true); setSopErr("");
    const ar = AREAS.find(a => a.id === nt.area);
    try {
      const r = await callClaude(
        [{ role:"user", content:`Write a 5-step cleaning SOP for Casa Jaguar Mexican Restaurant for: "${nt.name}" in the ${ar?.label} area. Include a safety tip at the end. Plain numbered text only.` }],
        "You are an executive chef writing kitchen SOPs. Be specific and safety-conscious."
      );
      const text = typeof r === "string" ? r : (r?.sopContent || r?.text || JSON.stringify(r));
      setNT(p => ({...p, sopContent: text}));
    } catch(e) {
      console.error(e);
      setSopErr(friendlyError(e, "Claude"));
    }
    setGenSOP(false);
  };

  const inp = {width:"100%",background:"#252525",border:"1px solid #3a3a3a",borderRadius:11,padding:"10px 12px",color:B.cream,fontSize:12,outline:"none",fontFamily:"'Nunito',sans-serif"};

  if (adding) return (
    <div style={{padding:14}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <button onClick={() => setAdding(false)} style={{background:"#252525",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",color:B.cream,fontSize:16}}>←</button>
        <div style={{fontWeight:900,fontSize:15,color:B.gold}}>NEW TASK</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <input value={nt.name} onChange={e=>setNT({...nt,name:e.target.value})} placeholder="Task name (e.g. Deep clean fryer)" style={inp} />
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <select value={nt.area}      onChange={e=>setNT({...nt,area:e.target.value})}      style={{...inp}}>{AREAS.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}</select>
          <select value={nt.frequency} onChange={e=>setNT({...nt,frequency:e.target.value})} style={{...inp}}>{FREQUENCIES.map(f=><option key={f}>{f}</option>)}</select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <select value={nt.priority}  onChange={e=>setNT({...nt,priority:e.target.value})}  style={{...inp}}>{["critical","high","medium","low"].map(p=><option key={p}>{p}</option>)}</select>
          <input value={nt.timeEstimate} onChange={e=>setNT({...nt,timeEstimate:e.target.value})} placeholder="Time (e.g. 15 min)" style={inp} />
        </div>
        <input value={nt.products} onChange={e=>setNT({...nt,products:e.target.value})} placeholder="Cleaning products needed" style={inp} />
        <div style={{position:"relative"}}>
          <textarea value={nt.sopContent} onChange={e=>setNT({...nt,sopContent:e.target.value})} placeholder="SOP steps... or hit AI SOP to generate" rows={5} style={{...inp,resize:"none",paddingBottom:42,display:"block"}} />
          <button onClick={generateSOP} disabled={genSOP||!nt.name.trim()} style={{position:"absolute",bottom:8,right:8,background:genSOP||!nt.name.trim()?"#333":B.gold,color:genSOP||!nt.name.trim()?B.muted:B.black,border:"none",borderRadius:9,padding:"6px 12px",fontSize:10,fontWeight:900,cursor:nt.name.trim()&&!genSOP?"pointer":"default"}}>
            {genSOP?"⏳":"✨"} AI SOP
          </button>
        </div>
        {sopErr && <div style={{background:`rgba(192,39,26,0.12)`,border:`1px solid ${B.red}55`,borderRadius:9,padding:"8px 10px",color:B.red,fontSize:11,lineHeight:1.4}}>⚠️ {sopErr}</div>}
        <button onClick={()=>{onAdd({...nt,createdAt:Date.now()});setAdding(false);setNT({name:"",area:"prep",frequency:"Daily",priority:"high",timeEstimate:"",products:"",sopContent:""});}} disabled={!nt.name.trim()} style={{padding:"13px",borderRadius:12,border:"none",background:nt.name.trim()?`linear-gradient(135deg,${B.gold},${B.orange})`:"#2a2a2a",color:nt.name.trim()?B.black:B.muted,fontWeight:900,fontSize:13,cursor:nt.name.trim()?"pointer":"default"}}>
          SAVE TASK
        </button>
      </div>
    </div>
  );

  return (
    <div style={{padding:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={onBack} style={{background:"#252525",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",color:B.cream,fontSize:16}}>←</button>
          <div style={{fontWeight:900,fontSize:15,color:B.gold}}>⚙️ MANAGE TASKS</div>
        </div>
        <button onClick={()=>setAdding(true)} style={{background:`rgba(247,160,25,0.12)`,border:`1px solid ${B.gold}`,color:B.gold,borderRadius:9,padding:"6px 12px",fontSize:10,fontWeight:800,cursor:"pointer"}}>+ NEW</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {tasks.map(t => {
          const ar = AREAS.find(a => a.id === t.area);
          return (
            <div key={t.id} style={{background:B.card,borderRadius:11,padding:"11px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid #252525"}}>
              <div>
                <div style={{fontWeight:800,fontSize:12,color:B.cream}}>{t.name}</div>
                <div style={{fontSize:9,color:B.muted,marginTop:2}}>{ar?.icon} {ar?.label} · <span style={{color:FREQ_COLORS[t.frequency]}}>{t.frequency}</span> · <span style={{color:pColor(t.priority)}}>{t.priority}</span></div>
              </div>
              <button onClick={()=>onDelete(t.id)} style={{background:"transparent",border:"none",color:"#555",cursor:"pointer",fontSize:16}}>🗑</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────
export default function App() {
  const [hasKey, setHasKey] = useState(() =>
    !!localStorage.getItem("cj_api_key") && !!localStorage.getItem("cj_gemini_key")
  );
  if (!hasKey) return <SetupScreen onSave={() => setHasKey(true)} />;
  return <MainApp />;
}
