import { useState, useEffect } from "react";

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
function getApiKey() { return localStorage.getItem("cj_api_key") || ""; }

async function callClaude(messages, system = "", maxTokens = 1200) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApiKey(),
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages
    })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = errData?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const data = await res.json();
  const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
  try { return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim()); } catch { return text; }
}

function extractJSON(raw) {
  let s = raw.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
  try { return JSON.parse(s); } catch {}
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a !== -1 && b > a) { try { return JSON.parse(s.slice(a, b+1)); } catch {} }
  const m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

async function callClaudeVision(b64, mime = "image/jpeg") {
  const validMime = ["image/jpeg","image/png","image/gif","image/webp"].includes(mime) ? mime : "image/jpeg";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApiKey(),
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: "You are a health & safety inspector for a Mexican restaurant. Output ONLY raw JSON. No markdown, no explanation, no preamble. Start with { and end with }.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: validMime, data: b64 } },
            { type: "text", text: `Analyze this kitchen image from Casa Jaguar Mexican Food & Cafe, Glenorchy NZ. Identify all cleaning tasks and hygiene issues visible. Return ONLY this JSON (nothing else before or after):\n{"areaDetected":"area name","overallRisk":"low|medium|high|critical","riskSummary":"one sentence","tasks":[{"name":"task","area":"prep|grill|dishpit|walkin|storage|foh|bathrooms|patio|express","reason":"what you see","priority":"critical|high|medium|low","frequency":"Daily|Weekly|Monthly","timeEstimate":"X min","products":"products","sopContent":"1. Step\\n2. Step\\n3. Step\\n4. Step\\n5. Step\\n\u26a0\ufe0f Safety tip"}]}` }
          ]
        },
        { role: "assistant", content: "{" }
      ]
    })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  const tail = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
  const parsed = extractJSON("{" + tail);
  if (parsed) return parsed;
  console.error("Vision parse failed. Raw:", tail);
  throw new Error("AI response was not valid JSON. Try again.");
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
  const [key, setKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [err, setErr] = useState("");

  const testAndSave = async () => {
    if (!key.trim().startsWith("sk-ant-")) { setErr("Key should start with sk-ant-"); return; }
    setTesting(true); setErr("");
    try {
      localStorage.setItem("cj_api_key", key.trim());
      const r = await callClaude([{ role:"user", content:'Reply with exactly: {"ok":true}' }], "Reply with valid JSON only.", 100);
      if (r?.ok || r === '{"ok":true}' || JSON.stringify(r).includes("ok")) { onSave(); }
      else { onSave(); } // if we got any response, key works
    } catch(e) {
      const msg = e.message || "";
      if (msg.includes("credit") || msg.includes("billing") || msg.includes("402")) {
        setErr("No credits available. Add credits at console.anthropic.com/settings/billing");
      } else if (msg.includes("401") || msg.includes("auth")) {
        setErr("Invalid API key. Please check and try again.");
      } else if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setErr("Network error. Please check your internet connection and try again.");
      } else {
        setErr("Connection issue. Try again or check console.anthropic.com");
      }
      localStorage.removeItem("cj_api_key");
    }
    setTesting(false);
  };

  return (
    <div style={{background:B.black,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{maxWidth:400,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:56,marginBottom:12}}>🐆</div>
          <div style={{fontWeight:900,fontSize:24,color:B.gold,letterSpacing:"0.05em"}}>CASA JAGUAR</div>
          <div style={{fontSize:11,color:B.muted,letterSpacing:"0.18em",marginTop:4}}>CLEAN & SOP AGENT</div>
        </div>
        <div style={{background:B.card,borderRadius:16,padding:20,border:"1px solid #2a2a2a",marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:13,color:B.cream,marginBottom:6}}>Enter your Anthropic API Key</div>
          <div style={{fontSize:11,color:B.muted,lineHeight:1.7,marginBottom:14}}>
            Powers the AI scanning & SOP generation. Stored only on your device — never shared anywhere else.<br/><br/>
            Get yours free at <span style={{color:B.teal}}>console.anthropic.com</span>
          </div>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === "Enter" && testAndSave()}
            placeholder="sk-ant-api03-..."
            style={{width:"100%",background:"#252525",border:`1px solid ${err?B.red:"#3a3a3a"}`,borderRadius:10,padding:"12px 14px",color:B.cream,fontSize:13,outline:"none",fontFamily:"'Nunito',sans-serif",marginBottom:err?8:14}}
          />
          {err && <div style={{fontSize:11,color:B.red,marginBottom:12,lineHeight:1.5}}>⚠️ {err}</div>}
          <button
            onClick={testAndSave}
            disabled={testing || !key.trim()}
            style={{width:"100%",padding:"13px",borderRadius:12,border:"none",background:key.trim()?`linear-gradient(135deg,${B.gold},${B.orange})`:"#2a2a2a",color:key.trim()?B.black:B.muted,fontWeight:900,fontSize:14,cursor:key.trim()?"pointer":"default"}}
          >
            {testing ? "⏳ Testing connection..." : "CONNECT & START →"}
          </button>
        </div>
        <div style={{background:`rgba(0,168,150,0.08)`,border:`1px solid ${B.teal}33`,borderRadius:12,padding:14}}>
          <div style={{fontWeight:800,fontSize:11,color:B.teal,marginBottom:8}}>🔒 How to get your API key</div>
          <div style={{fontSize:11,color:B.muted,lineHeight:1.9}}>
            1. Go to <span style={{color:B.teal}}>console.anthropic.com</span><br/>
            2. Sign up or log in<br/>
            3. Click API Keys → Create Key<br/>
            4. Copy and paste it above<br/>
            5. New accounts get free credits to start
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

  const addTask    = t  => setTasks(p => [...p, { ...t, id:`task_${Date.now()}` }]);
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
      setAudit(r);
    } catch(e) { console.error(e); }
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
          <button onClick={() => { if(confirm("Remove API key and sign out?")) { localStorage.removeItem("cj_api_key"); window.location.reload(); }}} style={{background:"transparent",border:"none",color:"#444",cursor:"pointer",fontSize:20}}>⚙</button>
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
                      {audit && <div style={{fontSize:20,fontWeight:900,color:B.gold}}>{audit.grade}</div>}
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
                  <div style={{background:"rgba(0,0,0,0.3)",borderRadius:10,padding:10,fontSize:11,lineHeight:1.7}}>
                    <div style={{color:B.cream,marginBottom:4}}>⚡ {audit.summary}</div>
                    <div style={{color:B.gold,marginBottom:4}}>⭐ {audit.shoutout}</div>
                    <div style={{color:B.teal}}>💡 {audit.recommendation}</div>
                    {audit.criticalMissing && audit.criticalMissing !== "All done!" && (
                      <div style={{color:B.red,marginTop:5,fontWeight:700}}>⚠️ {audit.criticalMissing}</div>
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
  const [img,       setImg]       = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result,    setResult]    = useState(null);
  const [added,     setAdded]     = useState(new Set());
  const [err,       setErr]       = useState(null);

  const handleImg = async e => {
    const file = e.target.files[0]; if (!file) return;
    setAnalyzing(true); setResult(null); setErr(null); setAdded(new Set());
    const reader = new FileReader();
    reader.onloadend = async () => {
      setImg(reader.result);
      try {
        const r = await callClaudeVision(reader.result.split(",")[1], file.type || "image/jpeg");
        setResult(r);
      } catch(e) { setErr(`Analysis failed: ${e.message || "Check API key has credits and try again."}`); console.error(e); }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const riskC = r => r==="critical"?B.red:r==="high"?B.orange:r==="medium"?B.gold:B.teal;

  return (
    <div style={{padding:14}}>
      <div style={{textAlign:"center",marginBottom:18}}>
        <div style={{fontSize:20,fontWeight:900,color:B.gold}}>🐆 AI KITCHEN EYE</div>
        <div style={{fontSize:11,color:B.muted,marginTop:4}}>Snap any station — get instant analysis & SOP</div>
      </div>

      {!img ? (
        <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:"100%",height:220,border:`2px dashed ${B.gold}`,borderRadius:18,background:"rgba(247,160,25,0.04)",cursor:"pointer"}}>
          <span style={{fontSize:44}}>📷</span>
          <div style={{fontWeight:900,fontSize:15,color:B.gold,marginTop:10}}>SNAP OR UPLOAD PHOTO</div>
          <div style={{fontSize:11,color:B.muted,marginTop:5}}>Prep, grill, fridge, FOH, bathrooms...</div>
          <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleImg} />
        </label>
      ) : (
        <div style={{position:"relative",borderRadius:14,overflow:"hidden",marginBottom:14}}>
          <img src={img} alt="scan" style={{width:"100%",height:220,objectFit:"cover",display:"block"}} />
          {analyzing && (
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
              <span style={{fontSize:36,display:"inline-block",animation:"spin 2s linear infinite"}}>🐆</span>
              <div style={{fontWeight:900,fontSize:13,color:B.gold}}>ANALYZING KITCHEN...</div>
            </div>
          )}
          {!analyzing && (
            <button onClick={() => { setImg(null); setResult(null); setErr(null); }} style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,0.7)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:B.cream,fontSize:16}}>×</button>
          )}
        </div>
      )}

      {err && <div style={{background:`rgba(192,39,26,0.12)`,border:`1px solid ${B.red}`,borderRadius:10,padding:12,color:B.red,fontSize:12,textAlign:"center",marginBottom:12}}>⚠️ {err}</div>}

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
  const [nt, setNT] = useState({name:"",area:"prep",frequency:"Daily",priority:"high",timeEstimate:"",products:"",sopContent:""});

  const generateSOP = async () => {
    if (!nt.name) return; setGenSOP(true);
    const ar = AREAS.find(a => a.id === nt.area);
    try {
      const r = await callClaude(
        [{ role:"user", content:`Write a 5-step cleaning SOP for Casa Jaguar Mexican Restaurant for: "${nt.name}" in the ${ar?.label} area. Include a safety tip at the end. Plain numbered text only.` }],
        "You are an executive chef writing kitchen SOPs. Be specific and safety-conscious."
      );
      setNT(p => ({...p, sopContent: typeof r==="string" ? r : JSON.stringify(r)}));
    } catch(e) { console.error(e); }
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
          <button onClick={generateSOP} disabled={genSOP||!nt.name} style={{position:"absolute",bottom:8,right:8,background:genSOP||!nt.name?"#333":B.gold,color:genSOP||!nt.name?B.muted:B.black,border:"none",borderRadius:9,padding:"6px 12px",fontSize:10,fontWeight:900,cursor:nt.name&&!genSOP?"pointer":"default"}}>
            {genSOP?"⏳":"✨"} AI SOP
          </button>
        </div>
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
  const [hasKey, setHasKey] = useState(() => !!localStorage.getItem("cj_api_key"));
  if (!hasKey) return <SetupScreen onSave={() => setHasKey(true)} />;
  return <MainApp />;
}
