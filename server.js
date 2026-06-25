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

app.get("/api/health", (req, res) => res.json({ ok: true, db: dbReady() }));

// Board-State laden (eine JSON-Zeile). null = DB noch leer.
app.get("/api/state", async (req, res) => {
  if (!dbReady()) return res.status(503).json({ error: "DB nicht konfiguriert" });
  try {
    const r = await fetch(`${SB_URL}/rest/v1/board_state?id=eq.${ROW_ID}&select=data`, { headers: sbHeaders() });
    if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
    const rows = await r.json();
    res.json(rows[0] ? rows[0].data : null);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// Board-State speichern (Upsert auf die eine Zeile).
app.put("/api/state", async (req, res) => {
  if (!dbReady()) return res.status(503).json({ error: "DB nicht konfiguriert" });
  try {
    const payload = [{ id: ROW_ID, data: req.body, updated_at: new Date().toISOString() }];
    const r = await fetch(`${SB_URL}/rest/v1/board_state?on_conflict=id`, {
      method: "POST",
      headers: sbHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// Statische App ausliefern.
app.use(express.static(__dirname, { index: "index.html" }));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Flipper Vertrieb Board läuft auf :${port} (DB: ${dbReady() ? "an" : "aus"})`));
