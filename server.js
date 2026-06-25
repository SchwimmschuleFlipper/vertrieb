import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "8mb" }));

// Supabase-Zugang bleibt SERVERSEITIG — der Service-Key kommt nie in den Browser.
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const ROW_ID = "main";
const dbReady = () => Boolean(SB_URL && SB_KEY);

function sbHeaders(extra = {}) {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", ...extra };
}

// State aus Supabase lesen / schreiben.
async function sbGet() {
  const r = await fetch(`${SB_URL}/rest/v1/board_state?id=eq.${ROW_ID}&select=data`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  const rows = await r.json();
  return rows[0] ? rows[0].data : null;
}
async function sbPut(data) {
  const payload = [{ id: ROW_ID, data, updated_at: new Date().toISOString() }];
  const r = await fetch(`${SB_URL}/rest/v1/board_state?on_conflict=id`, {
    method: "POST",
    headers: sbHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
}

/* ============ AUTOMATIK (serverseitig, läuft auch bei geschlossenem Board) ============ */
// Muss inhaltlich mit der Regel-Engine in index.html übereinstimmen.
function daysUntil(iso) {
  if (!iso) return null;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return null;
  return Math.round((d - t) / 86400000);
}
function applyRules(state) {
  if (!state || !Array.isArray(state.baeder) || !Array.isArray(state.columns) || !Array.isArray(state.rules)) return 0;
  const colById = id => state.columns.find(c => c.id === id);
  const countIn = (id, exceptId) => state.baeder.filter(b => b.status === id && b.id !== exceptId).length;
  const now0 = Date.now();
  function triggered(rule, b) {
    const t = rule.trigger.tage || 0;
    if (rule.trigger.type === "in_column") {
      if (b.status !== rule.trigger.columnId) return false;
      if (!b.statusSince) return false;
      const days = (now0 - new Date(b.statusSince).getTime()) / 86400000;
      return !isNaN(days) && days >= t;
    }
    if (rule.trigger.type === "deadline_offset") {
      if (rule.trigger.columnId && b.status !== rule.trigger.columnId) return false;
      if (!b.datum) return false;
      const du = daysUntil(b.datum);
      return du !== null && -du >= t;                                   // -du = Tage über Deadline
    }
    return false;
  }
  let changed = 0;
  state.rules
    .filter(r => r && r.enabled && r.trigger && (r.trigger.type === "deadline_offset" || r.trigger.type === "in_column"))
    .forEach(rule => {
      state.baeder.slice().forEach(b => {
        const col = colById(b.status);
        if (col && col.final) return;                                   // Endspalten ausgenommen
        if (!triggered(rule, b)) return;
        const tgt = rule.action && rule.action.columnId;
        if (!tgt || !colById(tgt) || b.status === tgt) return;
        const old = b.status, now = new Date();
        b.status = tgt;
        b.statusSince = now.toISOString();
        b.position = countIn(tgt, b.id);
        (b.activity = b.activity || []).push({
          user: "Automatik",
          datum: now.toISOString().slice(0, 10),
          uhrzeit: now.toISOString(),
          typ: "regel",
          inhalt: `Regel „${rule.name}": ${(colById(old) || {}).label || old} → ${(colById(tgt) || {}).label || tgt}`,
        });
        changed++;
      });
    });
  return changed;
}
async function runRulesJob() {
  if (!dbReady()) return 0;
  const state = await sbGet();
  if (!state || !Array.isArray(state.baeder)) return 0;
  const n = applyRules(state);
  if (n > 0) { await sbPut(state); console.log(`[Automatik] ${n} Karte(n) verschoben`); }
  return n;
}

/* ============ API ============ */
app.get("/api/health", (req, res) => res.json({ ok: true, db: dbReady() }));

app.get("/api/state", async (req, res) => {
  if (!dbReady()) return res.status(503).json({ error: "DB nicht konfiguriert" });
  try { res.json(await sbGet()); }
  catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

app.put("/api/state", async (req, res) => {
  if (!dbReady()) return res.status(503).json({ error: "DB nicht konfiguriert" });
  try { await sbPut(req.body); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

// Manueller Trigger (zum Testen).
app.post("/api/run-rules", async (req, res) => {
  if (!dbReady()) return res.status(503).json({ error: "DB nicht konfiguriert" });
  try { res.json({ ok: true, moved: await runRulesJob() }); }
  catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

// Statische App ausliefern.
app.use(express.static(__dirname, { index: "index.html" }));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Flipper Vertrieb Board läuft auf :${port} (DB: ${dbReady() ? "an" : "aus"})`);
  // Automatik: kurz nach Start einmal, danach alle 30 Minuten — auch ohne offenes Board.
  if (dbReady()) {
    setTimeout(() => runRulesJob().catch(e => console.error("[Automatik] Fehler:", e.message)), 10000);
    setInterval(() => runRulesJob().catch(e => console.error("[Automatik] Fehler:", e.message)), 30 * 60 * 1000);
  }
});
