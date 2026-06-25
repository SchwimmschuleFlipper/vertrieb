#!/usr/bin/env node
/**
 * ClickUp -> Flipper Vertrieb Board Import
 *
 * Zieht alle Tasks einer ClickUp-Liste (inkl. Custom-Fields, Kommentare,
 * Assignees, Fälligkeit, Priorität) und schreibt clickup-import.json,
 * die in der App über den "Import"-Button geladen wird.
 *
 * Der API-Token bleibt lokal — er wird nur als Umgebungsvariable gelesen,
 * nie gespeichert.
 *
 * Nutzung:
 *   CLICKUP_TOKEN=pk_… CLICKUP_LIST=123456 node import-clickup.mjs --discover
 *   CLICKUP_TOKEN=pk_… CLICKUP_LIST=123456 node import-clickup.mjs
 *
 * Token:   ClickUp → Settings → Apps → "API Token" (beginnt mit pk_)
 * List-ID: in der ClickUp-URL der Liste (…/li/<LIST_ID>) oder Liste → ⋯ → Copy link
 */

const TOKEN = process.env.CLICKUP_TOKEN;
const LIST = process.env.CLICKUP_LIST;
const DISCOVER = process.argv.includes("--discover");
const API = "https://api.clickup.com/api/v2";
const OUT = "clickup-import.json";

if (!TOKEN || !LIST) {
  console.error("Fehlt: CLICKUP_TOKEN und/oder CLICKUP_LIST.\n" +
    "Beispiel: CLICKUP_TOKEN=pk_xxx CLICKUP_LIST=123456 node import-clickup.mjs --discover");
  process.exit(1);
}

/* ---- Farb-Palette der App (Status-Farbe wird auf den nächsten Swatch gemappt) ---- */
const SWATCHES = [
  { dot:"#8A8F98", pillBg:"#ECEDEF", pillText:"#5A5F68" },
  { dot:"#5B8DEF", pillBg:"#EAF1FE", pillText:"#1D5FD4" },
  { dot:"#7C6FE0", pillBg:"#EDEBF7", pillText:"#5E4FB8" },
  { dot:"#E0A030", pillBg:"#FBF1E0", pillText:"#A8761E" },
  { dot:"#EAB308", pillBg:"#FBF6DD", pillText:"#8A6D08" },
  { dot:"#2A9D8F", pillBg:"#E3F4F1", pillText:"#1F7468" },
  { dot:"#6366F1", pillBg:"#EAEBFE", pillText:"#4044C4" },
  { dot:"#C45D8A", pillBg:"#FBEAF1", pillText:"#A23E6C" },
  { dot:"#D0606A", pillBg:"#FBE9EA", pillText:"#B0444C" },
  { dot:"#3FB37F", pillBg:"#E2F6EE", pillText:"#2C7C53" },
  { dot:"#B0444C", pillBg:"#F7E3E4", pillText:"#8E3138" },
  { dot:"#64748B", pillBg:"#ECEEF1", pillText:"#475569" },
];
// ClickUp liefert Farben teils als CSS-Variable var(--cu-status-xxx) statt Hex.
const CU_COLORS = {
  red:"#d33d44", brown:"#aa8d80", teal:"#2a9d8f", green:"#3db88b", orange:"#e16b16",
  pink:"#ee5e99", blue:"#1090e0", purple:"#6f42c1", yellow:"#f9d900", grey:"#87909e", gray:"#87909e",
};
function resolveColor(c) {
  if (!c) return "#87909e";
  const m = /var\(--cu-status-([a-z]+)\)/i.exec(c);
  if (m) return CU_COLORS[m[1].toLowerCase()] || "#87909e";
  return c;
}
function hexToRgb(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(resolveColor(h).trim());
  if (!m) return [138, 143, 152];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function nearestSwatch(hex) {
  const [r, g, b] = hexToRgb(hex);
  let best = 0, bestD = Infinity;
  SWATCHES.forEach((s, i) => {
    const [sr, sg, sb] = hexToRgb(s.dot);
    const d = (r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  });
  return SWATCHES[best];
}

/* ---- Custom-Field-Mapping: ClickUp-Feldname (lowercase contains) -> unser Feld ---- */
const FIELD_RULES = [
  [["name des bad"], "badname"],                                   // "2-Name des Bads"
  [["vollständig", "vollstaendig"], "stadt"],                      // "1-Vollständiger Name" = Stadt/Ort
  [["stadt", "city", "ort"], "stadt"],
  [["ansprechpartner", "kontaktperson", "contact name"], "ansprechpartner"],
  [["position", "rolle", "funktion"], "kontaktPosition"],
  [["telefon", "phone", "mobil"], "telefon"],
  [["mail", "email", "e-mail"], "email"],
  [["kategorie", "category"], "kategorie"],
];
function mapFieldName(name) {
  const n = (name || "").toLowerCase();
  for (const [keys, target] of FIELD_RULES) if (keys.some(k => n.includes(k))) return target;
  return null;
}

const PRIO_MAP = { urgent: "dringend", high: "hoch", normal: "mittel", low: "niedrig" };

function slug(s) {
  return (s || "spalte").toLowerCase()
    .replace(/[äöü]/g, c => ({ "ä":"ae","ö":"oe","ü":"ue" }[c]))
    .replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "spalte";
}

async function api(path) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(API + path, { headers: { Authorization: TOKEN } });
    if (res.status === 429) {
      const wait = parseInt(res.headers.get("x-ratelimit-reset")) ? 3000 : 2000;
      console.log(`  Rate-Limit erreicht, warte ${wait/1000}s …`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) throw new Error(`ClickUp ${res.status} bei ${path}: ${await res.text()}`);
    return res.json();
  }
  throw new Error("Zu oft 429 (Rate-Limit) bei " + path);
}

function dropdownValue(cf) {
  const opts = (cf.type_config && cf.type_config.options) || [];
  if (Array.isArray(cf.value)) { // labels (multi)
    return cf.value.map(v => {
      const o = opts.find(o => o.id === v || o.id === v.id);
      return o ? (o.label != null ? o.label : o.name) : "";
    }).filter(Boolean).join(", ");
  }
  const o = opts.find(o => o.id === cf.value || o.orderindex === cf.value);
  return o ? (o.name != null ? o.name : o.label) : "";
}
function cfValue(cf) {
  if (cf.value == null || cf.value === "") return "";
  if (cf.type === "drop_down" || cf.type === "labels") return dropdownValue(cf);
  if (cf.type === "users" && Array.isArray(cf.value)) return cf.value.map(u => u.username || u.email).join(", ");
  if (typeof cf.value === "object") return JSON.stringify(cf.value);
  return String(cf.value);
}

async function getAllTasks() {
  const tasks = [];
  for (let page = 0; page < 200; page++) {
    const q = `?page=${page}&include_closed=true&subtasks=true`;
    const data = await api(`/list/${LIST}/task${q}`);
    const batch = data.tasks || [];
    tasks.push(...batch);
    process.stdout.write(`  Tasks geladen: ${tasks.length}\r`);
    if (batch.length < 100 || data.last_page) break;
  }
  console.log("");
  return tasks;
}

async function main() {
  console.log("ClickUp-Liste laden …");
  const list = await api(`/list/${LIST}`);
  const statuses = (list.statuses || []).slice().sort((a, b) => (a.orderindex || 0) - (b.orderindex || 0));
  const fieldDefs = (await api(`/list/${LIST}/field`)).fields || [];

  if (DISCOVER) {
    console.log(`\nListe: ${list.name}\n`);
    console.log("STATUS (→ werden zu Spalten):");
    statuses.forEach(s => console.log(`  • ${s.status}   [${s.type}]   ${s.color}`));
    console.log("\nCUSTOM FIELDS (→ Mapping):");
    fieldDefs.forEach(f => {
      const m = mapFieldName(f.name);
      console.log(`  • ${f.name}  (${f.type})  ${m ? "→ " + m : "→ (nicht gemappt)"}`);
    });
    console.log("\nWenn das Mapping passt: Skript ohne --discover erneut ausführen.");
    return;
  }

  // Spalten aus Status bauen
  const columns = statuses.map(s => {
    const sw = nearestSwatch(s.color);
    return { id: slug(s.status), label: s.status, dot: sw.dot, pillBg: sw.pillBg, pillText: sw.pillText,
      final: s.type === "closed" || s.type === "done" };
  });
  const colByStatus = {};
  statuses.forEach((s, i) => { colByStatus[s.status.toLowerCase()] = columns[i].id; });

  console.log("Tasks laden …");
  const tasks = await getAllTasks();

  console.log("Kommentare laden …");
  const baeder = [];
  let posCounter = {};
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const colId = colByStatus[(t.status && t.status.status || "").toLowerCase()] || (columns[0] && columns[0].id);
    posCounter[colId] = (posCounter[colId] || 0);

    const bad = {
      extId: t.id,
      badname: t.name || "Unbenannt",
      stadt: "", ansprechpartner: "", kontaktPosition: "", telefon: "", email: "", kategorie: "",
      status: colId,
      prioritaet: PRIO_MAP[(t.priority && t.priority.priority) || ""] || "mittel",
      datum: t.due_date ? new Date(Number(t.due_date)).toISOString().slice(0, 10) : "",
      verantwortlicher: (t.assignees && t.assignees[0] && (t.assignees[0].username || t.assignees[0].email)) || "",
      position: posCounter[colId]++,
      activity: [],
    };

    (t.custom_fields || []).forEach(cf => {
      const target = mapFieldName(cf.name);
      if (target) { const v = cfValue(cf).trim(); if (v) bad[target] = v; }
    });

    // Kommentare -> Verlauf (älteste zuerst)
    try {
      const cm = await api(`/task/${t.id}/comment`);
      const comments = (cm.comments || []).slice().sort((a, b) => Number(a.date) - Number(b.date));
      comments.forEach(c => {
        const d = new Date(Number(c.date));
        bad.activity.push({
          user: (c.user && (c.user.username || c.user.email)) || "ClickUp",
          datum: d.toISOString().slice(0, 10),
          uhrzeit: d.toISOString(),
          typ: "kommentar",
          inhalt: c.comment_text || "",
        });
      });
    } catch (e) {
      console.log(`  (Kommentare für „${t.name}" übersprungen: ${e.message})`);
    }

    baeder.push(bad);
    process.stdout.write(`  Verarbeitet: ${i + 1}/${tasks.length}\r`);
  }
  console.log("");

  const out = { source: "clickup", list: list.name, exportedAt: new Date().toISOString(), columns, baeder };
  const fs = await import("node:fs");
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\nFertig: ${baeder.length} Bäder, ${columns.length} Spalten → ${OUT}`);
  console.log(`Jetzt in der App den "Import"-Button klicken und ${OUT} auswählen.`);
}

main().catch(e => { console.error("\nFehler:", e.message); process.exit(1); });
