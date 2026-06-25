# vertriebsboard.md — Produkt-Kontext

Produkt-, Datenmodell- und Prozess-Kontext für das Flipper Vertriebsboard.
Working-Style steht in `CLAUDE.md`. Beides immer zusammen lesen.

> Status dieser Datei: **Scaffold**. Felder, die noch nicht final entschieden
> sind, sind mit `TBD` markiert. Beim Bauen jeweils den betroffenen Abschnitt
> hier zuerst aktualisieren, dann den Code.

---

## 1. Was das Board ist

Ein operatives Vertriebsboard für die **Bäderakquise** (Flipper). Kein
allgemeines CRM. Ziel: den Akquise-Prozess vom Erst-Kontakt bis zum Abschluss
schneller, übersichtlicher und kontrollierbarer machen.

Primäre Nutzung: Desktop (Laptop/Monitor), kleines internes Team.

Recurring questions, die das Board beantworten muss:

* Welche Bäder sind gerade in welchem Status?
* Wo hängt etwas / was ist als Nächstes zu tun?
* Wer wurde wann zuletzt kontaktiert, mit welchem Ergebnis?

---

## 2. Board-Status (Statusspalten)

Reihenfolge ist verbindlich (siehe `CLAUDE.md` → Produkt-UX-Regeln). Spalten
werden in genau dieser Reihenfolge gerendert.

| # | Status | Bedeutung | Karte gilt als |
| - | --- | --- | --- |
| 1 | `neu` | Lead erfasst, noch nicht kontaktiert | offen |
| 2 | `kontaktiert` | Erstkontakt erfolgt | offen |
| 3 | `termin` | Termin/Gespräch vereinbart | aktiv |
| 4 | `angebot` | Angebot raus, Entscheidung offen | aktiv |
| 5 | `gewonnen` | Abschluss | abgeschlossen |
| 6 | `verloren` | Abgesagt / kein Interesse | abgeschlossen |

> Status-Reihenfolge oder -Set ändern = Fork → `AskUserQuestion`, nicht still.

---

## 3. Datenmodell

Persistenz-Strategie (MVP): **ein JSON-Blob** (Vanilla-JS-Client-Modell),
analog Launch Board. Normalisierung erst beim Trigger in der Don't-Build-Liste.

```
State
├── schemaVersion: number          // bei jeder Schema-Änderung bumpen
├── cards: Card[]
└── meta: { ... }                  // TBD

Card
├── id: string                     // stabil, nie wiederverwenden
├── name: string                   // Name des Bads / Objekts   (Pflicht)
├── status: Status                 // siehe Abschnitt 2          (Pflicht)
├── ort: string                    // Standort / Adresse
├── kontakt: { name, email, telefon }
├── activity: Comment[]            // Kommentare / Verlauf, neueste zuerst
├── createdAt: ISO-String
└── updatedAt: ISO-String

Comment
├── id: string
├── text: string
├── createdAt: ISO-String
└── author: string                 // TBD (kein Auth im MVP)
```

Abgeleitete Werte (nie speichern, immer beim Render berechnen):

* Spalten-Zählung pro Status.
* "Zuletzt kontaktiert" = neuester `activity`-Eintrag.

---

## 4. Felddefinitionen

| Feld | Typ | Pflicht | Validierung | Anzeige |
| --- | --- | --- | --- | --- |
| `name` | string | ja | nicht leer | Kartentitel |
| `status` | enum | ja | aus Abschnitt 2 | Spalte |
| `ort` | string | nein | — | Karte + Sidepanel |
| `kontakt.email` | string | nein | E-Mail-Format wenn gesetzt | Sidepanel |
| `kontakt.telefon` | string | nein | — | Sidepanel |
| `activity[].text` | string | ja (pro Eintrag) | nicht leer | Sidepanel |

Karten zeigen kompakt: `name`, `ort`, letzter Kontakt. Alles Weitere ins
Sidepanel.

---

## 5. Phase-Stand

| Phase | Inhalt | Status |
| --- | --- | --- |
| 0 | Scaffold + Deploy-Pipeline (Hello World live) | offen |
| 1 | Board-Grundgerüst: Spalten, Karten rendern | offen |
| 2 | Karte anlegen + Felder editieren (Sidepanel) | offen |
| 3 | Drag & Drop zwischen Status-Spalten | offen |
| 4 | Activity/Kommentare | offen |
| 5 | Persistenz (Blob) + Auto-Migration | offen |

Aktueller Block: **Phase 0** — noch nichts gebaut.

---

## 6. Don't-Build-Liste

| Feature | Warum jetzt nicht | Trigger zum Bauen |
| --- | --- | --- |
| Auth / Login | Internes Tool, URL = Zugangsgrenze | Public URL ODER sensible Daten |
| Realtime-Sync | Kleines Team, kaum parallele Edits | Parallele Edits gehen verloren |
| Normalisierte Tabellen | JSON-Blob deckt Client-Modell | 50+ Karten ODER langsame Queries |
| Pipelines / Deals / Stages-Logik | CRM-Overengineering vor stabilem MVP | MVP wird stabil genutzt |
| Automationen / Reminders | Erst manueller Flow validieren | Wiederkehrender manueller Aufwand spürbar |
| Reporting-Dashboard | Board-Übersicht reicht | Explizite Auswertungs-Anforderung |
| TypeScript | < 3000 LOC, Typ via Naming | Onboarding-Friktion |

---

## 7. Offene Entscheidungen (TBD)

* Hosting / Deploy-Ziel (Railway? Anderes?) → Fork.
* Live-URL für Deploy-Probe.
* `author`-Feld bei Kommentaren (ohne Auth) — Freitext oder weglassen.
* `meta`-Inhalt im State.
