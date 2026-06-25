# Deploy — Flipper Vertrieb Board

Stack: **Supabase** (Datenbank) + **Railway** (Server/Hosting). Kein Login —
die Railway-URL ist die Zugangsgrenze. Die Supabase-Keys liegen nur
serverseitig (im Railway-Server), nie im Browser.

---

## 1. Supabase einrichten

1. Auf [supabase.com](https://supabase.com) ein Projekt anlegen.
2. **SQL Editor** öffnen → Inhalt von `supabase-schema.sql` einfügen → **Run**.
3. **Project Settings → API** öffnen und notieren:
   - **Project URL**  (z. B. `https://abcd.supabase.co`)
   - **service_role key**  (geheim! beginnt mit `eyJ…`, NICHT der anon-Key)

## 2. Auf GitHub pushen

Im Projektordner (`git` ist schon initialisiert, erster Commit liegt vor):

```bash
# Repo auf github.com anlegen (leer), dann:
git remote add origin https://github.com/<DEIN_USER>/flipper-vertrieb-board.git
git push -u origin main
```

`clickup-import.json` wird durch `.gitignore` bewusst NICHT gepusht
(echte Kontaktdaten).

## 3. Railway deployen

1. Auf [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
   → das eben gepushte Repo wählen. Railway erkennt Node + `npm start` automatisch.
2. Im Projekt → **Variables** → zwei Variablen setzen:
   - `SUPABASE_URL` = die Project URL aus Schritt 1
   - `SUPABASE_SERVICE_KEY` = der service_role key aus Schritt 1
   - (`PORT` setzt Railway selbst.)
3. **Settings → Networking → Generate Domain** → du bekommst eine öffentliche URL.

## 4. Prüfen

```bash
curl -s <DEINE-RAILWAY-URL>/api/health      # erwartet: {"ok":true,"db":true}
```

Dann die URL im Browser öffnen → leeres Board.

## 5. Daten importieren (in die Live-DB)

1. Im Live-Board oben **„Import"** klicken → lokale `clickup-import.json` wählen.
2. „164 Bäder importieren?" → **OK** · „Bestehende entfernen?" → **OK**.

Der Import speichert direkt in Supabase. Ab jetzt liegen die Daten in der
Cloud und sind auf jedem Gerät unter der Railway-URL verfügbar.

---

## Lokal weiterarbeiten

- Als lose Datei: `index.html` doppelklicken → läuft mit localStorage
  (ohne Cloud), gut zum Entwickeln.
- Mit Server lokal:
  ```bash
  SUPABASE_URL=… SUPABASE_SERVICE_KEY=… PORT=3000 npm start
  # http://localhost:3000
  ```

## Status-Anzeige (oben in der Topbar)

- „Mit Cloud synchronisiert" → Speichern ging in die DB.
- „⚠ Offline – Änderungen lokal" → Server/DB nicht erreichbar, Daten liegen
  im localStorage und gehen beim nächsten erfolgreichen Speichern hoch.
- „Lokal gespeichert" → als lose Datei ohne Server geöffnet.
