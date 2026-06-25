# CLAUDE.md — Working Style für Flipper Vertrieb Board

Wie Claude in diesem Repository arbeitet.

Dieses Projekt entwickelt ein CRM-/Kanban-System für die Bäderakquise der Schwimmschule Flipper. Ziel ist nicht ein allgemeines CRM, sondern eine extrem schnelle und einfache Software für unseren Vertriebsprozess.

---

# Projektphilosophie

Dieses Projekt folgt drei Grundprinzipien:

1. Geschwindigkeit vor Perfektion.
2. Weniger Funktionen, dafür perfekt durchdacht.
3. Jede Funktion muss den Vertriebsprozess beschleunigen.

Wenn eine Funktion keinen klaren Mehrwert für den Vertrieb liefert, wird sie nicht gebaut.

---

# Grundprinzipien

1. Bestehenden Code lesen bevor Änderungen vorgenommen werden.
2. Immer die kleinste sinnvolle Lösung bauen.
3. Niemals unnötige Architektur einführen.
4. Keine Libraries ohne klaren Nutzen.
5. Keine Features bauen, die aktuell nicht benötigt werden.
6. Desktop First.
7. Daten niemals still überschreiben.
8. Push oder Deploy ausschließlich nach explizitem User-Token.

---

# Produktziel

Das Vertrieb Board ersetzt langfristig ClickUp.

Der Nutzer arbeitet täglich mehrere Stunden darin.

Deshalb stehen folgende Eigenschaften über allem:

* maximale Geschwindigkeit
* minimale Klickanzahl
* sofortige Übersicht
* moderne Benutzeroberfläche
* extrem einfache Bedienung

Das Produkt soll sich wie Linear, Notion oder ClickUp anfühlen, aber speziell für den Bädervertrieb optimiert sein.

---

# Arbeitsweise

Arbeite immer in Feature-Blöcken.

Nicht jeden kleinen Zwischenschritt kommentieren.

Jeder Block besteht aus:

## 1. Block-Plan

Vor Beginn:

* Was wird gebaut?
* Warum?
* Was wird bewusst NICHT gebaut?

## 2. Umsetzung

Implementiere den gesamten Block vollständig.

Danach:

* Syntax prüfen
* Selbstreview durchführen
* UI testen

Erst danach berichten.

## 3. Report

Immer nur:

* Was wurde geändert?
* Was soll getestet werden?
* Was ist der nächste sinnvolle Block?

Keine langen Erklärungen.

---

# UX-Regeln

Jede Entscheidung folgt diesen Fragen:

Reduziert sie Klicks?

Verbessert sie die Übersicht?

Beschleunigt sie den Vertrieb?

Falls nein:

Nicht bauen.

---

# Kanban Board

Das Board ist der Mittelpunkt der Software.

Eigenschaften:

* horizontales Scrollen
* Drag & Drop
* extrem flüssig
* keine Wartezeiten
* sofortige Speicherung

---

# Karten

Jede Karte repräsentiert genau ein Bad.

Pflichtfelder:

* Status
* Priorität
* Datum
* Beginn
* Ende
* Verantwortlicher
* Badname
* Stadt
* Ansprechpartner
* Telefonnummer
* E-Mail
* Kategorie

Die Karten bleiben bewusst kompakt.

Weitere Informationen erscheinen erst in der Detailansicht.

---

# Detailansicht

Beim Klick auf eine Karte öffnet sich rechts ein Sidepanel.

Dieses enthält:

## Stammdaten

Alle Informationen des Bades.

## Activity

Chronologische Historie.

Enthält:

* Kommentare
* Statusänderungen
* Bearbeitungen
* Zuweisungen

Jede Activity besitzt:

* Benutzer
* Uhrzeit
* Datum
* Inhalt

---

# Design

Modernes SaaS Design.

Orientierung an:

* Linear
* ClickUp
* Notion

Nicht orientieren an:

* Salesforce
* Hubspot
* Microsoft Dynamics

Weniger ist mehr.

Viel Weißraum.

Klare Typografie.

Sehr schnelle Bedienung.

---

# Entscheidungen

Wenn mehrere Lösungen möglich sind:

Immer die einfachste Variante wählen.

Falls später erweiterbar:

Heute einfach bauen.

Nicht für zukünftige Anforderungen überoptimieren.

---

# Testing

Vor jedem Abschluss:

* Syntax prüfen
* Browser testen
* Drag & Drop testen
* Speichern testen
* Reload testen

---

# Kommunikation

Antworten immer kurz.

Keine Fülltexte.

Keine Marketing-Sprache.

Code-Referenzen als:

path:line

Ende jedes Blocks:

* Was wurde gebaut?
* Was soll getestet werden?
* Nächster Block.

---

# Don't Build

Vorerst NICHT bauen:

* Kalender
* CRM-Automationen
* KI
* Reporting
* Dashboards
* Rollen- und Rechteverwaltung
* Mehrmandantenfähigkeit
* API-Integrationen
* E-Mail-Versand
* Telefonie
* Erinnerungen
* Benachrichtigungen

Diese Funktionen erst entwickeln, wenn der MVP vollständig produktiv genutzt wird.

---

# Entwicklungsziel

Baue zuerst einen MVP, den wir täglich produktiv verwenden können.

Jede neue Funktion muss den Vertrieb schneller machen.

Nicht beeindruckend programmieren.

Nützlich programmieren.
