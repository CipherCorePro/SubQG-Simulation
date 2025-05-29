# 🔬 SubQG-Simulator – Interaktive Resonanzanalyse

Ein interaktives, webbasiertes Simulationssystem zur Veranschaulichung der **Subquanten-Resonanz-Theorie (SubQG)**. Es erlaubt die Echtzeit-Visualisierung synchroner Energie- und Phasenwellen sowie die Detektion sogenannter **SubQG-Knoten** – hypothesierte Punkte, an denen Realität emergent entstehen kann.

---

## 🚀 Projektziel

Diese App demonstriert die Kernaussage der SubQG-Theorie:

> *Realität manifestiert sich an Punkten synchroner und identischer Resonanz.*

Dabei wird eine Zeitreihe simuliert, in der Energie- und Phasenwerte fluktuieren. Knotenpunkte – also Kandidaten für reale Manifestationen – entstehen, wenn bestimmte Bedingungen erfüllt sind (siehe [Knoten-Kriterien](https://github.com/user-attachments/assets/7c5026dd-82b0-4578-8530-635f6053c669)).
![image](https://github.com/user-attachments/assets/7c5026dd-82b0-4578-8530-635f6053c669)

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

📂 Projekt/
├── components/            # React-Komponenten (z. B. Charts, UI-Elemente)
├── node_modules/          # Abhängigkeiten (automatisch durch npm install)
├── utils/                 # Hilfsfunktionen und logische Operationen
├── .env.local             # Lokale Umgebungsvariablen
├── .gitignore             # Auszuschließende Dateien für Git
├── App.tsx                # Einstiegspunkt der Hauptkomponente
├── constants.ts           # Globale Konstanten (z. B. Schwellenwerte)
├── index.html             # HTML-Template für Vite
├── index.tsx              # Einstiegspunkt für React mit Vite
├── metadata.json          # Projekt-Metadaten (z. B. Knotenstatistiken)
├── package.json           # Projektdefinition und Abhängigkeiten
├── package-lock.json      # Genaue Versionsfixierung der Abhängigkeiten
├── README.md              # Projektbeschreibung & Dokumentation
├── seeded_rng.ts          # Zufallszahlengenerator mit Seed-Unterstützung
├── tsconfig.json          # TypeScript-Konfiguration
├── types.ts               # Typdefinitionen (z. B. für SubQG-Knoten)
├── vite.config.ts         # Vite-Konfiguration (Build, Aliase, Plugins)


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

📄 **\[[Link zur Subquanten-Resonanz-Theorie)](https://github.com/CipherCorePro/SubQG-Simulation/blob/main/SubQG-Theorie.md)]**

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

**Entwickler:** \ Ralf Krümmel


> *„Zwischen Energie und Phase tanzt das Mögliche – bis ein Knoten es zur Realität erhebt.“*


