





# 🔬 SubQG-Simulator – Interaktive Resonanzanalyse

Ein interaktives, webbasiertes Simulationssystem zur Veranschaulichung der **Subquanten-Resonanz-Theorie (SubQG)**. Es erlaubt die Echtzeit-Visualisierung synchroner Energie- und Phasenwellen sowie die Detektion sogenannter **SubQG-Knoten** – hypothesierte Punkte, an denen Realität emergent entstehen kann.

---

## 🚀 Projektziel

Diese App demonstriert die Kernaussage der SubQG-Theorie:

> *Realität manifestiert sich an Punkten synchroner und identischer Resonanz.*

Dabei wird eine Zeitreihe simuliert, in der Energie- und Phasenwerte fluktuieren. Knotenpunkte – also Kandidaten für reale Manifestationen – entstehen, wenn bestimmte Bedingungen erfüllt sind (siehe [Knoten-Kriterien](https://github.com/user-attachments/assets/f85011a4-a818-49e3-9c1d-f0f9ce04fa3e)).
![SubQG Simulation Screenshot](https://github.com/user-attachments/assets/f85011a4-a818-49e3-9c1d-f0f9ce04fa3e)
---

## 🧠 Funktionen

### 🔧 Parameter (in der Sidebar):

- **Dauer der Simulation:** Bestimmt die Länge der Zeitachse und Anzahl der Samples.
- **Rauschfaktor:** Regelt die Stärke zufälliger Energie-/Phasenfluktuationen.
- **Knotenschwelle:** Mindestwert, den Energie *und* Phase übersteigen müssen.
- **Startsimulation:** Führt eine manuelle Simulation mit aktuellen Parametern aus.
- **Finde Knoten:** Startet eine automatische Parametervariation mit Zufallsseed, um mindestens einen gültigen Knoten zu finden.

---

## 📈 Visualisierung

### Hauptkomponenten im UI:

- **Energiewelle (blau):** Zeitlicher Verlauf des Energieparameters.
- **Phasenwelle (grün):** Zeitlicher Verlauf der Phasenparameter.
- **SubQG-Knoten (rote Kreuze):** Punkte synchroner Resonanz, an denen die Bedingungen erfüllt sind.

---

## 🧮 Kriterien für einen SubQG-Knoten

Ein Zeitpunkt `t` wird als **SubQG-Knoten** identifiziert, wenn:

1. `Energie(t)` > Knotenschwelle (ungefiltert)
2. `Phase(t)` > Knotenschwelle (ungefiltert)
3. `rund(Energie(t), 3) == rund(Phase(t), 3)`

Diese Gleichheit bis auf die dritte Nachkommastelle stellt die Kernbedingung für das **resonante Gleichgewicht** dar.

---

## 📁 Projektstruktur (Vite + TypeScript + React)

```

Projekt\_unzipped/
├── .env.local              # Lokale Umgebungsvariablen
├── .gitignore              # Git-Ausschlüsse
├── vite.config.ts          # Vite-Konfiguration (TS-basierter Build)
├── App.tsx                 # Hauptkomponente der UI
├── index.html              # Einstiegspunkt für das Vite-Bundle
├── main.tsx                # React-Root-Initialisierung
├── src/
│   ├── components/         # UI-Komponenten (Simulation, Charts etc.)
│   ├── hooks/              # Eigene React-Hooks für Logik
│   ├── logic/              # SubQG-Logik: Rauschen, Resonanz, Knotenprüfung
│   ├── styles/             # CSS / Tailwind / Module Styles
│   └── types/              # TS-Interfaces und Modelle

````

---

## ⚙️ Installation & Entwicklung

### Voraussetzungen

- Node.js ≥ 18
- Paketmanager: `npm` oder `yarn`

### Lokale Entwicklung starten:

```bash
# Projekt klonen
git clone https://github.com/dein-user/subqg-simulator.git
cd subqg-simulator

# Abhängigkeiten installieren
npm install

# Lokalen Dev-Server starten
npm run dev
````

### Deployment (z. B. für GitHub Pages oder Vercel)

```bash
npm run build
```

---

## 📚 Wissenschaftlicher Hintergrund

Diese App wurde für die experimentelle Erforschung subquanter Strukturen konzipiert. Insbesondere eignet sie sich zur:

* Visualisierung synchroner Energie-/Phasenwellen
* Analyse emergenter Knotenbedingungen
* Hypothesenprüfung zur strukturellen Knotenresonanz

Ein begleitendes Paper zur SubQG-Theorie findest du demnächst unter:

📄 **\[Link zur Veröffentlichung (z. B. arXiv)]**

---

## 🧪 Beispielhafte Anwendungsszenarien

* Parametervariation zur Knotenfindung
* Reproduzierbare Seeds mit identischer Knotenausgabe
* Interaktive Lehre zur Wellenphysik und Resonanzphänomenen

---

## 📄 Lizenz

MIT License – frei nutzbar mit Quellenvermerk.
(c) 2025 \ Ralf Krümmel
---

## ✉️ Kontakt

**Entwickler:** Ralf Lrümmel]

---

> *„Zwischen Energie und Phase tanzt das Mögliche – bis ein Knoten es zur Realität erhebt.“*

```

