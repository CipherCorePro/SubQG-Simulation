
import React, { useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter, Cell, ReferenceLine, ScatterChart } from 'recharts';
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

// For s-plane scatter plot
interface RiemannAnalogousSPoint {
  re_s: number;
  im_s: number; // Corresponds to knoten.time
  // Original knoten data for tooltip
  originalTime: number;
  originalEnergie: number;
  originalCharacteristic?: string;
}

// For density heatmap cells
interface DensityGridCell {
  x_re_s_center: number; // Center Re(s) of the cell for plotting
  y_im_s_center: number; // Center Im(s) (time) of the cell for plotting
  density: number;       // Number of s-plane points in this cell
  // For tooltip display
  re_s_min: number;
  re_s_max: number;
  im_s_min: number;
  im_s_max: number;
}

interface RiemannAnalysisResult {
  totalRuns: number;
  totalKnotenAnalyzed: number; // Total knoten used for Re(s) calculations
  parameters: { duration: number; noise: number; threshold: number; riemannScalingFactor: number };
  reSDistribution: { reSegment: string; count: number }[]; // For 1D Re(s) histogram
  reSValues: number[]; // Store all Re(s) values for stats
  meanReS: number;
  medianReS: number;
  stdDevReS: number;

  // New data for s-plane projection and density map
  sPlanePoints: RiemannAnalogousSPoint[];
  densityGrid: DensityGridCell[];
  densityGridConfig: {
    reBins: number;
    imBins: number;
    maxDensity: number;
    simDuration: number; // Used for Im(s) axis scaling
  } | null;
}


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
  if (data.length <= 1) return 0; // StdDev is not well-defined for 0 or 1 sample
  const m = mean === undefined ? calculateMean(data) : mean;
  return Math.sqrt(data.reduce((sq, n) => sq + Math.pow(n - m, 2), 0) / (data.length -1) );
};

const getColorForDensity = (density: number, maxDensity: number): string => {
  if (maxDensity === 0 || density === 0) return 'hsla(220, 40%, 90%, 0.5)'; // Light, almost transparent for zero density
  const intensity = Math.sqrt(density / maxDensity); // Sqrt for better visual differentiation
  // Base color: purple-ish blue (hsl(240, 70%, L%))
  // Lightness: 80% (low density) -> 30% (high density)
  const lightness = 80 - intensity * 50;
  const alpha = 0.6 + intensity * 0.4; // Opacity from 0.6 to 1.0
  return `hsla(240, 70%, ${lightness}%, ${alpha})`;
};

const DENSITY_RE_BINS = 20;
const DENSITY_IM_BINS = 20;

export const StatisticalAnalysis: React.FC<StatisticalAnalysisProps> = ({ currentDuration, currentNoise, currentThreshold }) => {
  const [numRuns, setNumRuns] = useState<number>(100);
  
  const [knotFreqIsLoading, setKnotFreqIsLoading] = useState<boolean>(false);
  const [knotFreqAnalysisResult, setKnotFreqAnalysisResult] = useState<KnotFrequencyAnalysisResult | null>(null);
  const [showKnotFreqSection, setShowKnotFreqSection] = useState<boolean>(false);
  const [knotFreqStatusMessage, setKnotFreqStatusMessage] = useState<string>("");

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
      if (distribution[segmentIndex]) distribution[segmentIndex].count++;
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
    const allSPlanePoints: RiemannAnalogousSPoint[] = [];
    let totalKnotenForRiemann = 0;

    for (let runIdx = 0; runIdx < numRuns; runIdx++) {
      const seed = Math.floor(Math.random() * 10000000);
      const rng = new SeededRandom(seed);
      const simData = calculateSimulationData(currentDuration, currentNoise, currentThreshold, rng);
      
      const knotenInRun = simData.filter(p => p.knoten !== undefined && p.energie !== undefined && p.time !== undefined);
      totalKnotenForRiemann += knotenInRun.length;

      knotenInRun.forEach(knoten => {
        let relativeEnergyExcess;
        if (currentThreshold > 0.001) {
            const clampedEnergy = Math.max(knoten.energie!, currentThreshold);
            relativeEnergyExcess = (clampedEnergy - currentThreshold) / currentThreshold;
        } else {
            relativeEnergyExcess = knoten.energie! > 0 ? knoten.energie! * 2 : 0;
        }
        relativeEnergyExcess = Math.max(0, Math.min(relativeEnergyExcess, 5)); 

        const deviationTerm = (relativeEnergyExcess - currentNoise) * riemannScalingFactor;
        let calculatedReS = 0.5 + deviationTerm;
        calculatedReS = Math.max(0, Math.min(calculatedReS, 1));
        
        allReSValues.push(calculatedReS);
        allSPlanePoints.push({
          re_s: calculatedReS,
          im_s: knoten.time,
          originalTime: knoten.time,
          originalEnergie: knoten.energie!,
          originalCharacteristic: knoten.characteristic
        });
      });

      if (runIdx % Math.floor(numRuns/10) === 0 || runIdx === numRuns - 1) {
        setRiemannStatusMessage(`Simulation (Riemann) ${runIdx + 1}/${numRuns} abgeschlossen...`);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // 1D Re(s) distribution
    const reSBins = 20;
    const binSizeReS = 1 / reSBins;
    const reSDistribution: { reSegment: string; count: number }[] = Array(reSBins).fill(null).map((_, i) => {
      const start = i * binSizeReS;
      const end = (i + 1) * binSizeReS;
      return { reSegment: `${start.toFixed(2)}-${end.toFixed(2)}`, count: 0 };
    });
    allReSValues.forEach(reSVal => {
      const segmentIndex = Math.min(Math.floor(reSVal / binSizeReS), reSBins - 1);
       if (segmentIndex === reSBins && reSVal === 1.0) { // Handle edge case where reSVal is exactly 1.0
        if (reSDistribution[reSBins - 1]) reSDistribution[reSBins - 1].count++;
       } else if (reSDistribution[segmentIndex]) {
        reSDistribution[segmentIndex].count++;
      }
    });
    
    const meanReS = calculateMean(allReSValues);
    const medianReS = calculateMedian(allReSValues);
    const stdDevReS = calculateStdDev(allReSValues, meanReS);

    // 2D Density Grid Calculation
    let densityGridForState: DensityGridCell[] = [];
    let densityGridConfigObj = null;

    if (allSPlanePoints.length > 0) {
        const reMin = 0, reMax = 1;
        const imMin = 0, imMax = currentDuration;

        const reBinSize = (reMax - reMin) / DENSITY_RE_BINS;
        const imBinSize = (imMax - imMin) / DENSITY_IM_BINS;

        const counts: number[][] = Array(DENSITY_RE_BINS).fill(0).map(() => Array(DENSITY_IM_BINS).fill(0));
        let maxDensity = 0;

        allSPlanePoints.forEach(point => {
            const reBinIndex = Math.min(Math.floor((point.re_s - reMin) / reBinSize), DENSITY_RE_BINS - 1);
            const imBinIndex = Math.min(Math.floor((point.im_s - imMin) / imBinSize), DENSITY_IM_BINS - 1);
            if (reBinIndex >=0 && reBinIndex < DENSITY_RE_BINS && imBinIndex >=0 && imBinIndex < DENSITY_IM_BINS) {
                 counts[reBinIndex][imBinIndex]++;
                 if (counts[reBinIndex][imBinIndex] > maxDensity) {
                    maxDensity = counts[reBinIndex][imBinIndex];
                }
            }
        });

        for (let i = 0; i < DENSITY_RE_BINS; i++) {
            for (let j = 0; j < DENSITY_IM_BINS; j++) {
                if (counts[i][j] > 0) { // Only add cells with non-zero density for scatter plot efficiency
                    densityGridForState.push({
                        x_re_s_center: reMin + (i + 0.5) * reBinSize,
                        y_im_s_center: imMin + (j + 0.5) * imBinSize,
                        density: counts[i][j],
                        re_s_min: reMin + i * reBinSize,
                        re_s_max: reMin + (i + 1) * reBinSize,
                        im_s_min: imMin + j * imBinSize,
                        im_s_max: imMin + (j + 1) * imBinSize,
                    });
                }
            }
        }
        densityGridConfigObj = { reBins: DENSITY_RE_BINS, imBins: DENSITY_IM_BINS, maxDensity: maxDensity, simDuration: currentDuration };
    }

    setRiemannAnalysisResult({
      totalRuns: numRuns,
      totalKnotenAnalyzed: totalKnotenForRiemann,
      parameters: { duration: currentDuration, noise: currentNoise, threshold: currentThreshold, riemannScalingFactor: riemannScalingFactor },
      reSDistribution: reSDistribution,
      reSValues: allReSValues,
      meanReS: parseFloat(meanReS.toFixed(3)),
      medianReS: parseFloat(medianReS.toFixed(3)),
      stdDevReS: parseFloat(stdDevReS.toFixed(3)),
      sPlanePoints: allSPlanePoints,
      densityGrid: densityGridForState,
      densityGridConfig: densityGridConfigObj,
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
                  <>
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

                    {/* s-Ebene Projektion (Scatter Plot) */}
                    {riemannAnalysisResult.sPlanePoints && riemannAnalysisResult.sPlanePoints.length > 0 && (
                        <div className="mt-8" style={{ width: '100%', height: 400 }}>
                            <h5 className="text-sm font-semibold text-sky-300 mb-2 text-center">s-Ebene Projektion der Knoten (Re(s) vs. Zeit)</h5>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                    <XAxis 
                                        type="number" 
                                        dataKey="re_s" 
                                        name="Re(s)" 
                                        domain={[0, 1]} 
                                        stroke="#94a3b8" 
                                        label={{ value: 'Re(s)', position: 'insideBottomRight', offset: -10, fill: '#94a3b8' }}
                                    />
                                    <YAxis 
                                        type="number" 
                                        dataKey="im_s" 
                                        name="Im(s) (Zeit)" 
                                        domain={[0, 'dataMax']} 
                                        stroke="#94a3b8" 
                                        label={{ value: 'Im(s) (Zeit)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                                    />
                                    <Tooltip 
                                        cursor={{ strokeDasharray: '3 3' }}
                                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #475569', borderRadius: '0.5rem' }}
                                        labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                        formatter={(value: number, name: string, props: any) => {
                                            if (props.payload) {
                                                const { originalTime, originalEnergie, originalCharacteristic } = props.payload;
                                                if (name === 're_s') return [value.toFixed(3), 'Re(s)'];
                                                if (name === 'im_s') return [
                                                    `${value.toFixed(2)} (Zeit)`, 
                                                    `Im(s) | Energie: ${originalEnergie.toFixed(3)}, Char: ${originalCharacteristic || 'N/A'}`
                                                ];
                                            }
                                            return [value, name];
                                        }}
                                    />
                                    <ReferenceLine x={0.5} stroke="#f43f5e" strokeDasharray="5 5" label={{ value: "Re(s)=0.5", position:"insideTopRight", fill:"#f43f5e" }} />
                                    <Scatter name="Knoten in s-Ebene" data={riemannAnalysisResult.sPlanePoints} fill="#a78bfa" shape="circle" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Knotencluster-Dichte (Heatmap) */}
                    {riemannAnalysisResult.densityGrid && riemannAnalysisResult.densityGrid.length > 0 && riemannAnalysisResult.densityGridConfig && (
                        <div className="mt-8" style={{ width: '100%', height: 400 }}>
                            <h5 className="text-sm font-semibold text-sky-300 mb-2 text-center">Knotencluster-Dichte in der s-Ebene (Heatmap)</h5>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                    <XAxis 
                                        type="number" 
                                        dataKey="x_re_s_center" 
                                        name="Re(s) (Zentrum der Zelle)" 
                                        domain={[0, 1]} 
                                        stroke="#94a3b8"
                                        tickCount={DENSITY_RE_BINS / 2}
                                        tickFormatter={(val) => val.toFixed(1)}
                                        label={{ value: 'Re(s)', position: 'insideBottomRight', offset: -10, fill: '#94a3b8' }}
                                    />
                                    <YAxis 
                                        type="number" 
                                        dataKey="y_im_s_center" 
                                        name="Im(s) (Zeit, Zentrum der Zelle)" 
                                        domain={[0, riemannAnalysisResult.densityGridConfig.simDuration]} 
                                        stroke="#94a3b8"
                                        tickCount={DENSITY_IM_BINS / 2}
                                        tickFormatter={(val) => val.toFixed(0)}
                                        label={{ value: 'Im(s) (Zeit)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                                    />
                                     <Tooltip 
                                        cursor={{ strokeDasharray: '3 3' }}
                                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #475569', borderRadius: '0.5rem' }}
                                        labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                        formatter={(value: number, name: string, props: any) => {
                                          if (props.payload) {
                                            const { density, re_s_min, re_s_max, im_s_min, im_s_max } = props.payload;
                                            // When rendering the scatter for density grid, the 'value' will be x_re_s_center or y_im_s_center.
                                            // We want to show the density and range for the cell in the tooltip.
                                            // The name prop in tooltip formatter gives 'x_re_s_center' or 'y_im_s_center'.
                                            // We can customize the tooltip content entirely or make a smart decision based on 'name'.
                                            // For simplicity, let's just return the main info once.
                                            if (name === 'x_re_s_center') { // Show info once per point
                                                return [`Dichte: ${density} | Re(s): ${re_s_min.toFixed(2)}-${re_s_max.toFixed(2)}, Im(s): ${im_s_min.toFixed(1)}-${im_s_max.toFixed(1)}`, 'Zelle'];
                                            }
                                            return []; // Hide y_im_s_center from tooltip items if x_re_s_center already displayed full info
                                          }
                                          return [value, name];
                                        }}
                                    />
                                    <Scatter name="Dichte-Grid" data={riemannAnalysisResult.densityGrid} shape="square">
                                        {riemannAnalysisResult.densityGrid.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={getColorForDensity(entry.density, riemannAnalysisResult.densityGridConfig!.maxDensity)} 
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                  </>
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
