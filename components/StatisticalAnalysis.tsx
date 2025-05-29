
import React, { useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateSimulationData, SimulationDataPoint } from '@/utils/simulation_utils';
import { SeededRandom } from '@/utils/seeded_rng';

interface StatisticalAnalysisProps {
  currentDuration: number;
  currentNoise: number;
  currentThreshold: number;
}

interface KnotFrequencyAnalysisResult {
  totalRuns: number;
  totalKnoten: number;
  avgKnotenPerRun: number;
  knotenDistribution: { timeSegment: string; count: number }[];
  parameters: { duration: number; noise: number; threshold: number };
}

interface RiemannAnalogousKnot {
  re_s: number;
  im_s: number; // time
}

interface RiemannAnalysisResult {
  totalRuns: number;
  totalKnotenAnalyzed: number;
  parameters: { duration: number; noise: number; threshold: number; riemannScalingFactor: number };
  reSDistribution: { reSegment: string; count: number }[];
  reSValues: number[]; // Store all Re(s) values for stats
  meanReS: number;
  medianReS: number;
  stdDevReS: number;
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

// Helper functions for statistics
const calculateMean = (data: number[]): number => {
  if (data.length === 0) return 0;
  return data.reduce((acc, val) => acc + val, 0) / data.length;
};

const calculateMedian = (data: number[]): number => {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const calculateStdDev = (data: number[], mean?: number): number => {
  if (data.length === 0) return 0;
  const m = mean === undefined ? calculateMean(data) : mean;
  return Math.sqrt(data.reduce((sq, n) => sq + Math.pow(n - m, 2), 0) / (data.length -1 < 1 ? 1 : data.length -1) ); // Use n-1 for sample std dev, guard against length < 2
};


export const StatisticalAnalysis: React.FC<StatisticalAnalysisProps> = ({ currentDuration, currentNoise, currentThreshold }) => {
  const [numRuns, setNumRuns] = useState<number>(100);
  
  // Knot Frequency Analysis State
  const [knotFreqIsLoading, setKnotFreqIsLoading] = useState<boolean>(false);
  const [knotFreqAnalysisResult, setKnotFreqAnalysisResult] = useState<KnotFrequencyAnalysisResult | null>(null);
  const [showKnotFreqSection, setShowKnotFreqSection] = useState<boolean>(false);
  const [knotFreqStatusMessage, setKnotFreqStatusMessage] = useState<string>("");

  // Riemann Analysis State
  const [showRiemannSection, setShowRiemannSection] = useState<boolean>(false);
  const [riemannScalingFactor, setRiemannScalingFactor] = useState<number>(0.1);
  const [riemannIsLoading, setRiemannIsLoading] = useState<boolean>(false);
  const [riemannStatusMessage, setRiemannStatusMessage] = useState<string>("");
  const [riemannAnalysisResult, setRiemannAnalysisResult] = useState<RiemannAnalysisResult | null>(null);


  const handleRunKnotFrequencyAnalysis = useCallback(async () => {
    setKnotFreqIsLoading(true);
    setKnotFreqAnalysisResult(null);
    setKnotFreqStatusMessage(`Führe ${numRuns} Simulationen für Knotenhäufigkeit durch...`);

    await new Promise(resolve => setTimeout(resolve, 50));

    let allKnoten: SimulationDataPoint[] = [];
    for (let i = 0; i < numRuns; i++) {
      const seed = Math.floor(Math.random() * 10000000);
      const rng = new SeededRandom(seed);
      const simData = calculateSimulationData(currentDuration, currentNoise, currentThreshold, rng);
      allKnoten.push(...simData.filter(p => p.knoten !== undefined));
       if (i % Math.floor(numRuns/10) === 0 || i === numRuns -1) {
         setKnotFreqStatusMessage(`Simulation (Knotenhäufigkeit) ${i + 1}/${numRuns} abgeschlossen...`);
         await new Promise(resolve => setTimeout(resolve, 10));
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
    
    setKnotFreqAnalysisResult({
      totalRuns: numRuns,
      totalKnoten: totalKnotenFound,
      avgKnotenPerRun: parseFloat(avgKnoten.toFixed(2)),
      knotenDistribution: distribution,
      parameters: { duration: currentDuration, noise: currentNoise, threshold: currentThreshold }
    });
    setKnotFreqStatusMessage(`Knotenhäufigkeitsanalyse abgeschlossen. ${totalKnotenFound} Knoten in ${numRuns} Läufen gefunden.`);
    setKnotFreqIsLoading(false);
  }, [numRuns, currentDuration, currentNoise, currentThreshold]);

  const handleRunRiemannAnalysis = useCallback(async () => {
    setRiemannIsLoading(true);
    setRiemannAnalysisResult(null);
    setRiemannStatusMessage(`Führe ${numRuns} Simulationen für Riemann-Analyse durch...`);
    
    await new Promise(resolve => setTimeout(resolve, 50));

    const allReSValues: number[] = [];
    let totalKnotenForRiemann = 0;

    for (let i = 0; i < numRuns; i++) {
      const seed = Math.floor(Math.random() * 10000000);
      const rng = new SeededRandom(seed);
      const simData = calculateSimulationData(currentDuration, currentNoise, currentThreshold, rng);
      
      const knotenInRun = simData.filter(p => p.knoten !== undefined && p.energie !== undefined);
      totalKnotenForRiemann += knotenInRun.length;

      knotenInRun.forEach(knoten => {
        // Im(s) = knoten.time (not explicitly stored beyond the knoten object itself if needed later)
        
        let relativeEnergyExcess;
        if (currentThreshold > 0.001) { // Avoid division by zero or very small numbers
            // Ensure knoten.energie is not less than currentThreshold before division
            const clampedEnergy = Math.max(knoten.energie!, currentThreshold);
            relativeEnergyExcess = (clampedEnergy - currentThreshold) / currentThreshold;
        } else { // Simplified handling if threshold is near zero
            relativeEnergyExcess = knoten.energie! > 0 ? knoten.energie! * 2 : 0; // Arbitrary scaling if threshold is non-positive
        }
        // Clamp relativeEnergyExcess to avoid extreme values that might skew Re(s) too much
        relativeEnergyExcess = Math.max(0, Math.min(relativeEnergyExcess, 5)); 


        const deviationTerm = (relativeEnergyExcess - currentNoise) * riemannScalingFactor;
        let calculatedReS = 0.5 + deviationTerm;
        calculatedReS = Math.max(0, Math.min(calculatedReS, 1)); // Clamp Re(s) between 0 and 1
        allReSValues.push(calculatedReS);
      });

      if (i % Math.floor(numRuns/10) === 0 || i === numRuns - 1) {
        setRiemannStatusMessage(`Simulation (Riemann) ${i + 1}/${numRuns} abgeschlossen...`);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    const reSBins = 20;
    const binSize = 1 / reSBins;
    const reSDistribution: { reSegment: string; count: number }[] = Array(reSBins).fill(null).map((_, i) => {
      const start = i * binSize;
      const end = (i + 1) * binSize;
      return { reSegment: `${start.toFixed(2)}-${end.toFixed(2)}`, count: 0 };
    });

    allReSValues.forEach(reSVal => {
      const segmentIndex = Math.min(Math.floor(reSVal / binSize), reSBins - 1);
       if (segmentIndex === reSBins && reSVal === 1.0) { // Handle edge case for Re(s) = 1.0
        if (reSDistribution[reSBins - 1]) {
            reSDistribution[reSBins - 1].count++;
        }
       } else if (reSDistribution[segmentIndex]) {
        reSDistribution[segmentIndex].count++;
      }
    });
    
    const meanReS = calculateMean(allReSValues);
    const medianReS = calculateMedian(allReSValues);
    const stdDevReS = calculateStdDev(allReSValues, meanReS);

    setRiemannAnalysisResult({
      totalRuns: numRuns,
      totalKnotenAnalyzed: totalKnotenForRiemann,
      parameters: { duration: currentDuration, noise: currentNoise, threshold: currentThreshold, riemannScalingFactor: riemannScalingFactor },
      reSDistribution: reSDistribution,
      reSValues: allReSValues,
      meanReS: parseFloat(meanReS.toFixed(3)),
      medianReS: parseFloat(medianReS.toFixed(3)),
      stdDevReS: parseFloat(stdDevReS.toFixed(3)),
    });
    setRiemannStatusMessage(`Riemann-Analyse abgeschlossen. ${totalKnotenForRiemann} Knoten für Re(s)-Berechnung verwendet.`);
    setRiemannIsLoading(false);

  }, [numRuns, currentDuration, currentNoise, currentThreshold, riemannScalingFactor]);


  return (
    <>
      {/* Knot Frequency Analysis Section */}
      <section className="bg-slate-800/70 rounded-lg shadow-xl border border-slate-700 p-4 md:p-6 mt-8">
        <button
          onClick={() => setShowKnotFreqSection(!showKnotFreqSection)}
          className="flex items-center justify-between w-full text-left text-lg font-semibold text-sky-400 hover:text-sky-300 transition-colors duration-150 pb-2 mb-3 border-b border-slate-600 focus:outline-none"
          aria-expanded={showKnotFreqSection}
          aria-controls="knot-frequency-analysis-content"
        >
          Statistische Analyse der Knotenhäufigkeit (Seed-Varianz)
          {showKnotFreqSection ? <ChevronUpIcon className="shrink-0" /> : <ChevronDownIcon className="shrink-0" />}
        </button>
        {showKnotFreqSection && (
          <div id="knot-frequency-analysis-content" className="space-y-6 text-slate-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
              <div className="flex-grow">
                <label htmlFor="numRunsKnotFreq" className="block text-sm font-medium text-sky-300 mb-1">
                  Anzahl der Simulationsläufe (Seeds): <span className="font-semibold text-sky-200">{numRuns}</span>
                </label>
                <input
                  type="range"
                  id="numRunsKnotFreq"
                  min="10"
                  max="500" 
                  step="10"
                  value={numRuns}
                  onChange={(e) => setNumRuns(parseInt(e.target.value, 10))}
                  disabled={knotFreqIsLoading || riemannIsLoading}
                  className="w-full h-2 rounded-lg appearance-none bg-slate-600 cursor-pointer accent-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-700 disabled:cursor-not-allowed"
                />
              </div>
              <button
                onClick={handleRunKnotFrequencyAnalysis}
                disabled={knotFreqIsLoading || riemannIsLoading}
                className="w-full sm:w-auto px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {knotFreqIsLoading ? "Analysiere (Häufigkeit)..." : "Knotenhäufigkeit analysieren"}
              </button>
            </div>

            {knotFreqStatusMessage && !knotFreqAnalysisResult && (
              <p className="text-sm text-center text-slate-400" aria-live="polite">{knotFreqStatusMessage}</p>
            )}

            {knotFreqAnalysisResult && (
              <div className="mt-6 space-y-4">
                <h4 className="text-md font-semibold text-sky-300 border-b border-slate-600 pb-2">
                  Ergebnisse der Knotenhäufigkeitsanalyse:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <p><strong>Parameter:</strong></p>
                  <p className="font-mono">Dauer: {knotFreqAnalysisResult.parameters.duration}, Rauschen: {knotFreqAnalysisResult.parameters.noise.toFixed(2)}, Schwelle: {knotFreqAnalysisResult.parameters.threshold.toFixed(1)}</p>
                  <p><strong>Simulationsläufe:</strong></p> 
                  <p className="font-mono">{knotFreqAnalysisResult.totalRuns}</p>
                  <p><strong>Gesamte Knoten:</strong></p>
                  <p className="font-mono">{knotFreqAnalysisResult.totalKnoten}</p>
                  <p><strong>Durchschnittliche Knoten/Lauf:</strong></p>
                  <p className="font-mono">{knotFreqAnalysisResult.avgKnotenPerRun}</p>
                </div>
                
                {knotFreqAnalysisResult.totalKnoten > 0 && (
                  <div className="mt-4" style={{ width: '100%', height: 300 }}>
                      <h5 className="text-sm font-semibold text-sky-300 mb-2 text-center">Knotenverteilung über Zeitsegmente</h5>
                      <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={knotFreqAnalysisResult.knotenDistribution} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
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
                {knotFreqAnalysisResult.totalKnoten === 0 && (
                  <p className="text-center text-slate-400 mt-4">Keine Knoten in den {knotFreqAnalysisResult.totalRuns} Läufen mit den aktuellen Parametern für Häufigkeitsanalyse gefunden.</p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Riemann-Analogous Knot Distribution Section */}
      <section className="bg-slate-800/70 rounded-lg shadow-xl border border-slate-700 p-4 md:p-6 mt-8">
        <button
          onClick={() => setShowRiemannSection(!showRiemannSection)}
          className="flex items-center justify-between w-full text-left text-lg font-semibold text-sky-400 hover:text-sky-300 transition-colors duration-150 pb-2 mb-3 border-b border-slate-600 focus:outline-none"
          aria-expanded={showRiemannSection}
          aria-controls="riemann-analysis-content"
        >
          Riemann-Analoge Verteilung der Knoten (Re(s) ≈ 0.5)
          {showRiemannSection ? <ChevronUpIcon className="shrink-0" /> : <ChevronDownIcon className="shrink-0" />}
        </button>
        {showRiemannSection && (
          <div id="riemann-analysis-content" className="space-y-6 text-slate-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
              <div className="flex-grow space-y-4">
                 <div>
                    <label htmlFor="numRunsRiemann" className="block text-sm font-medium text-sky-300 mb-1">
                    Anzahl der Simulationsläufe (Seeds): <span className="font-semibold text-sky-200">{numRuns}</span>
                    </label>
                    <input 
                        type="range" id="numRunsRiemann" min="10" max="500" step="10" value={numRuns} 
                        onChange={(e) => setNumRuns(parseInt(e.target.value, 10))}
                        disabled={knotFreqIsLoading || riemannIsLoading}
                        className="w-full h-2 rounded-lg appearance-none bg-slate-600 cursor-pointer accent-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-700 disabled:cursor-not-allowed"
                    />
                </div>
                <div>
                    <label htmlFor="riemannScalingFactor" className="block text-sm font-medium text-sky-300 mb-1">
                    Re(s) Skalierungsfaktor <code className="text-xs">(C)</code>: <span className="font-semibold text-sky-200">{riemannScalingFactor.toFixed(2)}</span>
                    </label>
                    <input
                    type="range"
                    id="riemannScalingFactor"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={riemannScalingFactor}
                    onChange={(e) => setRiemannScalingFactor(parseFloat(e.target.value))}
                    disabled={riemannIsLoading || knotFreqIsLoading}
                    className="w-full h-2 rounded-lg appearance-none bg-slate-600 cursor-pointer accent-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-700 disabled:cursor-not-allowed"
                    />
                </div>
              </div>
              <button
                onClick={handleRunRiemannAnalysis}
                disabled={riemannIsLoading || knotFreqIsLoading}
                className="w-full sm:w-auto px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {riemannIsLoading ? "Analysiere (Riemann)..." : "Riemann-Analyse starten"}
              </button>
            </div>

            {riemannStatusMessage && !riemannAnalysisResult && (
              <p className="text-sm text-center text-slate-400" aria-live="polite">{riemannStatusMessage}</p>
            )}

            {riemannAnalysisResult && (
              <div className="mt-6 space-y-4">
                <h4 className="text-md font-semibold text-sky-300 border-b border-slate-600 pb-2">
                  Ergebnisse der Riemann-Analogen Verteilung:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <p><strong>Parameter:</strong></p>
                  <p className="font-mono">D: {riemannAnalysisResult.parameters.duration}, R: {riemannAnalysisResult.parameters.noise.toFixed(2)}, S: {riemannAnalysisResult.parameters.threshold.toFixed(1)}, C: {riemannAnalysisResult.parameters.riemannScalingFactor.toFixed(2)}</p>
                  <p><strong>Simulationsläufe:</strong></p>
                  <p className="font-mono">{riemannAnalysisResult.totalRuns}</p>
                  <p><strong>Analysierte Knoten (für Re(s)):</strong></p>
                  <p className="font-mono">{riemannAnalysisResult.totalKnotenAnalyzed}</p>
                  <p><strong>Mittelwert Re(s):</strong></p>
                  <p className="font-mono">{riemannAnalysisResult.meanReS.toFixed(3)}</p>
                  <p><strong>Median Re(s):</strong></p>
                  <p className="font-mono">{riemannAnalysisResult.medianReS.toFixed(3)}</p>
                  <p><strong>StdAbw Re(s):</strong></p>
                  <p className="font-mono">{riemannAnalysisResult.stdDevReS.toFixed(3)}</p>
                </div>

                {riemannAnalysisResult.totalKnotenAnalyzed > 0 && (
                  <div className="mt-4" style={{ width: '100%', height: 300 }}>
                    <h5 className="text-sm font-semibold text-sky-300 mb-2 text-center">Verteilung der Re(s)-Werte</h5>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riemannAnalysisResult.reSDistribution} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis dataKey="reSegment" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #475569', borderRadius: '0.5rem' }}
                          labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                          itemStyle={{ color: '#cbd5e1' }}
                        />
                        <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                        <Bar dataKey="count" fill="#8b5cf6" name="Anzahl Re(s) in Segment" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                 {riemannAnalysisResult.totalKnotenAnalyzed === 0 && (
                  <p className="text-center text-slate-400 mt-4">Keine Knoten für Riemann-Analyse in den {riemannAnalysisResult.totalRuns} Läufen mit den aktuellen Parametern gefunden.</p>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
};
