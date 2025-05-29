
import React, { useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateSimulationData, SimulationDataPoint } from '@/utils/simulation_utils';
import { SeededRandom } from '@/utils/seeded_rng';

interface StatisticalAnalysisProps {
  currentDuration: number;
  currentNoise: number;
  currentThreshold: number;
}

interface AnalysisResult {
  totalRuns: number;
  totalKnoten: number;
  avgKnotenPerRun: number;
  knotenDistribution: { timeSegment: string; count: number }[];
  parameters: { duration: number; noise: number; threshold: number };
}

// Chevron icons for this component
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


export const StatisticalAnalysis: React.FC<StatisticalAnalysisProps> = ({ currentDuration, currentNoise, currentThreshold }) => {
  const [numRuns, setNumRuns] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showSection, setShowSection] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");


  const handleRunAnalysis = useCallback(async () => {
    setIsLoading(true);
    setAnalysisResult(null);
    setStatusMessage(`Führe ${numRuns} Simulationen durch...`);

    // Use setTimeout to allow UI to update before blocking with calculations
    await new Promise(resolve => setTimeout(resolve, 50));

    let allKnoten: SimulationDataPoint[] = [];
    for (let i = 0; i < numRuns; i++) {
      const seed = Math.floor(Math.random() * 10000000); // Unique seed for each run
      const rng = new SeededRandom(seed);
      const simData = calculateSimulationData(currentDuration, currentNoise, currentThreshold, rng);
      allKnoten.push(...simData.filter(p => p.knoten !== undefined));
       if (i % Math.floor(numRuns/10) === 0 || i === numRuns -1) {
         setStatusMessage(`Simulation ${i + 1}/${numRuns} abgeschlossen...`);
         await new Promise(resolve => setTimeout(resolve, 10)); // Allow UI update for progress
       }
    }

    const totalKnotenFound = allKnoten.length;
    const avgKnoten = numRuns > 0 ? totalKnotenFound / numRuns : 0;

    const timeSegments = 10;
    const segmentDuration = currentDuration / timeSegments;
    const distribution: { timeSegment: string; count: number }[] = Array(timeSegments).fill(null).map((_, i) => {
      const start = i * segmentDuration;
      const end = (i + 1) * segmentDuration;
      return { timeSegment: `${start.toFixed(0)}-${end.toFixed(0)}`, count: 0 };
    });

    allKnoten.forEach(knoten => {
      const segmentIndex = Math.min(Math.floor(knoten.time / segmentDuration), timeSegments - 1);
      if (distribution[segmentIndex]) {
        distribution[segmentIndex].count++;
      }
    });
    
    setAnalysisResult({
      totalRuns: numRuns,
      totalKnoten: totalKnotenFound,
      avgKnotenPerRun: parseFloat(avgKnoten.toFixed(2)),
      knotenDistribution: distribution,
      parameters: { duration: currentDuration, noise: currentNoise, threshold: currentThreshold }
    });
    setStatusMessage(`Analyse abgeschlossen. ${totalKnotenFound} Knoten in ${numRuns} Läufen gefunden.`);
    setIsLoading(false);
  }, [numRuns, currentDuration, currentNoise, currentThreshold]);

  return (
    <section className="bg-slate-800/70 rounded-lg shadow-xl border border-slate-700 p-4 md:p-6">
      <button
        onClick={() => setShowSection(!showSection)}
        className="flex items-center justify-between w-full text-left text-lg font-semibold text-sky-400 hover:text-sky-300 transition-colors duration-150 pb-2 mb-3 border-b border-slate-600 focus:outline-none"
        aria-expanded={showSection}
        aria-controls="statistical-analysis-content"
      >
        Statistische Analyse der Knotenhäufigkeit (Seed-Varianz)
        {showSection ? <ChevronUpIcon className="shrink-0" /> : <ChevronDownIcon className="shrink-0" />}
      </button>
      {showSection && (
        <div id="statistical-analysis-content" className="space-y-6 text-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
            <div className="flex-grow">
              <label htmlFor="numRuns" className="block text-sm font-medium text-sky-300 mb-1">
                Anzahl der Simulationsläufe (Seeds): <span className="font-semibold text-sky-200">{numRuns}</span>
              </label>
              <input
                type="range"
                id="numRuns"
                min="10"
                max="500"
                step="10"
                value={numRuns}
                onChange={(e) => setNumRuns(parseInt(e.target.value, 10))}
                disabled={isLoading}
                className="w-full h-2 rounded-lg appearance-none bg-slate-600 cursor-pointer accent-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-700 disabled:cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleRunAnalysis}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {isLoading ? "Analysiere..." : "Analyse starten"}
            </button>
          </div>

          {statusMessage && !analysisResult && (
             <p className="text-sm text-center text-slate-400" aria-live="polite">{statusMessage}</p>
          )}


          {analysisResult && (
            <div className="mt-6 space-y-4">
              <h4 className="text-md font-semibold text-sky-300 border-b border-slate-600 pb-2">
                Ergebnisse der Analyse:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p><strong>Parameter:</strong></p>
                <p className="font-mono">Dauer: {analysisResult.parameters.duration}, Rauschen: {analysisResult.parameters.noise.toFixed(2)}, Schwelle: {analysisResult.parameters.threshold.toFixed(1)}</p>
                <p><strong>Simulationsläufe:</strong></p> 
                <p className="font-mono">{analysisResult.totalRuns}</p>
                <p><strong>Gesamte Knoten:</strong></p>
                <p className="font-mono">{analysisResult.totalKnoten}</p>
                <p><strong>Durchschnittliche Knoten/Lauf:</strong></p>
                <p className="font-mono">{analysisResult.avgKnotenPerRun}</p>
              </div>
              
              {analysisResult.totalKnoten > 0 && (
                 <div className="mt-4" style={{ width: '100%', height: 300 }}>
                    <h5 className="text-sm font-semibold text-sky-300 mb-2 text-center">Knotenverteilung über Zeitsegmente</h5>
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysisResult.knotenDistribution} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis dataKey="timeSegment" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" allowDecimals={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #475569', borderRadius: '0.5rem' }} 
                            labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                            itemStyle={{ color: '#cbd5e1' }}
                        />
                        <Legend wrapperStyle={{ color: '#e2e8f0' }}/>
                        <Bar dataKey="count" fill="#2dd4bf" name="Anzahl Knoten" />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
              )}
               {analysisResult.totalKnoten === 0 && (
                <p className="text-center text-slate-400 mt-4">Keine Knoten in den {analysisResult.totalRuns} Läufen mit den aktuellen Parametern gefunden.</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
