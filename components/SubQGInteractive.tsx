
import React, { useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter } from 'recharts';
import { SeededRandom } from '@/utils/seeded_rng';
import { calculateSimulationData, SimulationDataPoint } from '@/utils/simulation_utils';


interface SubQGInteractiveProps {
  duration: number;
  noise: number;
  threshold: number;
  seed: number; 
  onKnotenUpdate: (knotenCount: number) => void;
}

export const SubQGInteractive: React.FC<SubQGInteractiveProps> = ({ duration, noise, threshold, seed, onKnotenUpdate }) => {
  const simulationData = useMemo(() => {
    const rng = new SeededRandom(seed); 
    return calculateSimulationData(duration, noise, threshold, rng);
  }, [duration, noise, threshold, seed]); 
  
  const detailedKnotenPoints = useMemo(() =>
    simulationData
      .filter(d => d.knoten !== undefined && d.energie !== undefined && d.phase !== undefined)
      .map(d => ({
        time: d.time,
        energie: d.energie!,
        phase: d.phase!,
        characteristic: d.characteristic || "N/A" // Include characteristic
      })),
  [simulationData]);

  useEffect(() => {
    onKnotenUpdate(detailedKnotenPoints.length);
  }, [detailedKnotenPoints, onKnotenUpdate]);
  
  const knotenPointsForScatter = useMemo(() => 
    simulationData.filter(d => d.knoten !== undefined).map(d => ({ time: d.time, value: d.knoten })),
  [simulationData]);

  const yDomain = useMemo(() => {
    const allValues = simulationData.flatMap(d => [d.energie, d.phase]).filter(v => v !== undefined) as number[];
    if (allValues.length === 0) return [-2, 2];
    const minVal = Math.min(...allValues, -1.5);
    const maxVal = Math.max(...allValues, 1.5);
    const padding = Math.max(0.5, (maxVal - minVal) * 0.1);
    return [Math.floor((minVal - padding)*10)/10, Math.ceil((maxVal + padding)*10)/10];
  }, [simulationData]);


  return (
    <div className="flex flex-col h-full w-full"> {/* Root element is now a flex column taking full height/width */}
      {/* Chart container should grow to fill available space */}
      <div style={{ width: '100%', flexGrow: 1, minHeight: '350px' }} role="figure" aria-label="SubQG Wellensimulation und Knotendetektion">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={simulationData} margin={{ top: 5, right: 25, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis 
              dataKey="time" 
              stroke="#94a3b8" 
              tickFormatter={(tick) => tick.toFixed(0)} 
              type="number" 
              domain={['dataMin', 'dataMax']}
              aria-label="Zeitachse"
            />
            <YAxis 
              stroke="#94a3b8" 
              domain={yDomain}
              aria-label="Amplitudenachse"
              tickFormatter={(tick) => tick.toFixed(1)}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #475569', borderRadius: '0.5rem' }} 
              labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
              itemStyle={{ color: '#cbd5e1' }}
              formatter={(value: number, name: string) => [value.toFixed(3), name]}
              labelFormatter={(label: number) => `Zeit: ${label.toFixed(2)}`}
            />
            <Legend wrapperStyle={{ color: '#e2e8f0', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="energie" stroke="#38bdf8" strokeWidth={2} dot={false} name="Energiewelle" isAnimationActive={false} />
            <Line type="monotone" dataKey="phase" stroke="#34d399" strokeWidth={2} dot={false} name="Phasenwelle" isAnimationActive={false} />
            {knotenPointsForScatter.length > 0 && 
              <Scatter 
                dataKey="value" 
                data={knotenPointsForScatter} 
                fill="#f43f5e" 
                shape="cross" 
                name="SubQG-Knoten" 
              />
            }
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Knoten list container should not grow */}
      <div className="mt-4 text-sm text-slate-300 shrink-0" aria-live="polite">
        {detailedKnotenPoints.length > 0 ? (
          <>
            <h3 className="text-md font-semibold text-sky-300 mb-2">
              Detektierte SubQG-Knoten ({detailedKnotenPoints.length}):
            </h3>
            <ul className="max-h-40 overflow-y-auto space-y-1 bg-slate-700/50 p-3 rounded-md shadow custom-scrollbar">
              {detailedKnotenPoints.map((knoten, index) => (
                <li key={index} className="text-xs font-mono p-1 rounded hover:bg-slate-600/70">
                  Zeit: {knoten.time.toFixed(2)}, Energie: {knoten.energie.toFixed(3)}, Phase: {knoten.phase.toFixed(3)}
                  <br />
                  <span className="text-sky-400 ml-1">↳ Charakteristik: {knoten.characteristic}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-center text-slate-400">
            Keine SubQG-Knoten bei aktuellen Einstellungen detektiert.
          </p>
        )}
      </div>
    </div>
  );
};
