
import React, { useState, useEffect, useCallback } from 'react';
import { SubQGInteractive } from './components/SubQGInteractive';
import { SliderControl } from './components/SliderControl';
import { StatisticalAnalysis } from './components/StatisticalAnalysis';

const MAX_SEARCH_ATTEMPTS = 50;

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
  </svg>
);

const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M14.78 11.78a.75.75 0 0 1-1.06 0L10 8.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" />
  </svg>
);


const App: React.FC = () => {
  const [duration, setDuration] = useState<number>(100);
  const [noise, setNoise] = useState<number>(0.3);
  const [threshold, setThreshold] = useState<number>(1.5);
  const [currentSeed, setCurrentSeed] = useState<number>(() => Math.floor(Math.random() * 1000000));

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [currentSearchAttempt, setCurrentSearchAttempt] = useState<number>(0);
  const [knotenCountFromSim, setKnotenCountFromSim] = useState<number>(0); // -1: pending, 0: no knots, >0: knots found
  const [searchStatusMessage, setSearchStatusMessage] = useState<string>("");
  const [showDocumentation, setShowDocumentation] = useState<boolean>(false);

  const handleKnotenUpdate = useCallback((count: number) => {
    setKnotenCountFromSim(count);
  }, []);

  const handleStartSearch = () => {
    const initialNoise = parseFloat((Math.random() * (0.75 - 0.05) + 0.05).toFixed(2));
    const initialThreshold = parseFloat((Math.random() * (1.8 - 0.7) + 0.7).toFixed(1));
    const initialSeed = Math.floor(Math.random() * 1000000);

    setNoise(initialNoise);
    setThreshold(initialThreshold);
    setCurrentSeed(initialSeed);
    
    setCurrentSearchAttempt(1);
    setIsSearching(true);
    setKnotenCountFromSim(-1); // Mark as pending for attempt 1
    // Status message will be set by useEffect when knotenCountFromSim is -1
  };

  useEffect(() => {
    if (!isSearching) {
      return;
    }

    if (knotenCountFromSim === -1) {
      // Simulation for currentSearchAttempt is pending or has just been set up.
      // SubQGInteractive will run and call onKnotenUpdate.
      setSearchStatusMessage(`Simuliere Versuch ${currentSearchAttempt}/${MAX_SEARCH_ATTEMPTS}...`);
      return; // Wait for onKnotenUpdate to change knotenCountFromSim
    }

    // If we reach here, knotenCountFromSim is >= 0, meaning simulation for currentSearchAttempt has completed.

    if (knotenCountFromSim > 0) {
      // Success with the current `noise`, `threshold`, `currentSeed` for `currentSearchAttempt`.
      setIsSearching(false);
      setSearchStatusMessage(`Knoten gefunden nach ${currentSearchAttempt} Versuch(en)! (R:${noise.toFixed(2)}, S:${threshold.toFixed(1)}, Seed:${currentSeed})`);
      return;
    }
    
    // No knoten found for the `currentSearchAttempt` (knotenCountFromSim === 0).
    if (currentSearchAttempt >= MAX_SEARCH_ATTEMPTS) {
      setIsSearching(false);
      setSearchStatusMessage(`Kein Knoten nach ${MAX_SEARCH_ATTEMPTS} Versuchen gefunden.`);
      return;
    }

    // No success yet, and not at max attempts. Advance to the next attempt.
    const nextAttemptNumber = currentSearchAttempt + 1;
    
    const newNoise = parseFloat((Math.random() * (0.75 - 0.05) + 0.05).toFixed(2));
    const newThreshold = parseFloat((Math.random() * (1.8 - 0.7) + 0.7).toFixed(1));
    const newSeedForNextAttempt = Math.floor(Math.random() * 1000000);

    setNoise(newNoise);
    setThreshold(newThreshold);
    setCurrentSeed(newSeedForNextAttempt);
    
    setCurrentSearchAttempt(nextAttemptNumber);
    setKnotenCountFromSim(-1); // Mark as pending for the next attempt
    // The status message for the next attempt will be set when the effect runs again with knotenCountFromSim === -1
    
  }, [isSearching, knotenCountFromSim, currentSearchAttempt, noise, threshold, currentSeed]); // Added noise, threshold, currentSeed to dependencies for success message accuracy


  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-gray-200 font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-800 p-5 md:p-6 space-y-5 shadow-xl shrink-0 overflow-y-auto custom-scrollbar md:h-screen md:sticky md:top-0">
        <h2 className="text-xl md:text-2xl font-semibold text-sky-400 mb-5 md:mb-6 border-b border-slate-700 pb-3">
          Steuerung
        </h2>
        <SliderControl 
          label="Dauer der Simulation" 
          min={10} max={200} step={10} 
          value={duration} onChange={setDuration} 
          formatValue={(v) => v.toFixed(0)}
          disabled={isSearching}
        />
        <SliderControl 
          label="Rauschfaktor" 
          min={0.0} max={1.0} step={0.05} 
          value={noise} onChange={setNoise} 
          formatValue={(v) => v.toFixed(2)}
          disabled={isSearching}
        />
        <SliderControl 
          label="Knotenschwelle" 
          min={0.5} max={3.0} step={0.1} 
          value={threshold} onChange={setThreshold} 
          formatValue={(v) => v.toFixed(1)}
          disabled={isSearching}
        />

        <button
          onClick={handleStartSearch}
          disabled={isSearching}
          className="w-full mt-4 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-150"
          aria-label={isSearching ? "Automatische Knotensuche läuft" : "Automatische Knotensuche starten"}
        >
          {isSearching ? `Suche läuft...` : "Finde Knoten"}
        </button>
        {searchStatusMessage && (
          <p className="mt-3 text-sm text-center text-slate-400" aria-live="polite">
            {searchStatusMessage}
          </p>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar flex flex-col space-y-8">
        <header className="text-center shrink-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 py-2">
            SubQG Live-Beobachtung
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-1">
            Interaktive Simulation der SubQG-Knotenaktivierung
          </p>
        </header>
        <div className="bg-slate-800/70 rounded-lg shadow-2xl border border-slate-700 p-3 sm:p-4 md:p-6 min-h-[450px] md:min-h-[500px] flex flex-col">
          <SubQGInteractive 
            duration={duration} 
            noise={noise} 
            threshold={threshold}
            seed={currentSeed}
            onKnotenUpdate={handleKnotenUpdate} 
          />
        </div>

        {/* Documentation Section */}
        <section className="bg-slate-800/70 rounded-lg shadow-xl border border-slate-700 p-4 md:p-6">
          <button
            onClick={() => setShowDocumentation(!showDocumentation)}
            className="flex items-center justify-between w-full text-left text-lg font-semibold text-sky-400 hover:text-sky-300 transition-colors duration-150 pb-2 mb-3 border-b border-slate-600 focus:outline-none"
            aria-expanded={showDocumentation}
            aria-controls="app-documentation-content"
          >
            App-Dokumentation
            {showDocumentation ? <ChevronUpIcon className="shrink-0" /> : <ChevronDownIcon className="shrink-0" />}
          </button>
          {showDocumentation && (
            <div id="app-documentation-content" className="prose prose-sm prose-invert max-w-none text-slate-300 space-y-4 custom-prose">
              <h3 className="text-sky-400 !mt-0">Ziel der Anwendung:</h3>
              <p>Diese Anwendung dient zur interaktiven Simulation und Veranschaulichung der Subquanten-Resonanz-Theorie (SubQG). Sie ermöglicht die Beobachtung und Detektion von "SubQG-Knoten" – Punkten, an denen sich gemäß der Theorie Realität manifestieren kann durch synchrone Resonanz von Energie- und Phasenwerten.</p>

              <h3 className="text-sky-400">Bedienelemente (Sidebar):</h3>
              <ul>
                <li><strong>Dauer der Simulation:</strong> Legt die Gesamtlänge der simulierten Zeitachse fest. Längere Dauer bedeutet mehr Datenpunkte für die Wellen.</li>
                <li><strong>Rauschfaktor:</strong> Steuert die Intensität zufälliger Fluktuationen (weißes Rauschen), die den Energie- und Phasenwellen überlagert werden. Ein höherer Rauschfaktor führt zu stärkeren, unregelmäßigeren Schwankungen.</li>
                <li><strong>Knotenschwelle:</strong> Definiert den Mindestwert, den sowohl die rohe Energiewelle als auch die rohe Phasenwelle <em>überschreiten</em> müssen, damit ein Punkt überhaupt als potenzieller Knotenpunkt in Betracht gezogen wird.</li>
              </ul>

              <h3 className="text-sky-400">Interaktive Simulation (Hauptbereich):</h3>
              <p><strong>Chart:</strong></p>
              <ul>
                <li><strong>Energiewelle (blau):</strong> Stellt den Verlauf des Energiewertes über die Zeit dar.</li>
                <li><strong>Phasenwelle (grün):</strong> Stellt den Verlauf des Phasenwertes über die Zeit dar.</li>
                <li><strong>SubQG-Knoten (rote Kreuze):</strong> Markieren exakte Zeitpunkte, an denen ein SubQG-Knoten detektiert wurde (siehe Kriterien unten).</li>
              </ul>
              <p><strong>Liste "Detektierte SubQG-Knoten":</strong></p>
              <ul>
                <li>Zeigt alle im aktuellen Simulationslauf gefundenen Knotenpunkte mit ihren exakten Werten für Zeit, Energie, Phase und einer abgeleiteten Charakteristik.</li>
                <li><strong>Kriterien für einen SubQG-Knoten:</strong> Ein Knoten wird an einem Zeitpunkt <code>t</code> registriert, wenn <em>alle</em> folgenden Bedingungen erfüllt sind:
                  <ol>
                    <li>Der rohe (ungerundete) Energiewert zum Zeitpunkt <code>t</code> ist größer als die eingestellte <code>Knotenschwelle</code>.</li>
                    <li>Der rohe (ungerundete) Phasenwert zum Zeitpunkt <code>t</code> ist größer als die eingestellte <code>Knotenschwelle</code>.</li>
                    <li>Der Energiewert, gerundet auf drei Dezimalstellen, ist <em>exakt identisch</em> mit dem Phasenwert, ebenfalls gerundet auf drei Dezimalstellen (z.B. Energie: 0.806, Phase: 0.806).</li>
                  </ol>
                </li>
                <li>Diese strikte Bedingung der Wertgleichheit (bis zur dritten Dezimalstelle) ist zentral für die SubQG-These, dass Realität an Punkten <em>synchroner und identischer</em> Resonanz entsteht. Die Charakteristik gibt eine zusätzliche qualitative Einordnung des Knotens.</li>
              </ul>

              <h3 className="text-sky-400">Automatische Parametersuche:</h3>
              <ul>
                <li><strong>Button "Finde Knoten":</strong> Startet eine automatische Suche. Die App variiert selbstständig die Werte für "Rauschfaktor", "Knotenschwelle" und einen internen "Seed" (Zufallsstartwert) über eine definierte Anzahl von Versuchen, bis mindestens ein SubQG-Knoten gemäß den oben genannten Kriterien gefunden wird. Die "Dauer" wird dabei nicht verändert. Dies kann helfen, Parameterkombinationen zu entdecken, die Knotenpunkte erzeugen. Der Seed stellt sicher, dass erfolgreiche Simulationen reproduzierbar angezeigt werden.</li>
              </ul>

              <h3 className="text-sky-400">Hinweis für Wissenschaftler:</h3>
              <p>Nutzen Sie diese Simulation, um die Bedingungen für die Emergenz von SubQG-Knoten explorativ zu untersuchen. Durch manuelle Anpassung der Parameter oder die automatische Suche können Sie die Hypothese der Knotenbildung durch simultane Schwellenüberschreitung und exakte Werte-Resonanz von Energie und Phase direkt nachvollziehen und validieren. Die Simulation dient als Werkzeug, um die Kernaussage der SubQG-Theorie – "Realität manifestiert sich an Punkten synchroner Resonanz" – experimentell zu untermauern.</p>
            </div>
          )}
        </section>
        
        {/* Statistical Analysis Section */}
        <StatisticalAnalysis 
          currentDuration={duration}
          currentNoise={noise}
          currentThreshold={threshold}
        />

      </main>
    </div>
  );
};

export default App;
