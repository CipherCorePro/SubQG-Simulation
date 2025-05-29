// utils/simulation_utils.ts
import { SeededRandom } from '@/utils/seeded_rng';

export interface SimulationDataPoint {
  time: number;
  energie?: number;
  phase?: number;
  knoten?: number; // Represents energie value at knoten point for scatter plot
  characteristic?: string; // For semantic knot loading
}

// Helper: Generate numbers from start to stop
function linspace(start: number, stop: number, num: number): number[] {
  if (num <= 0) return [];
  if (num === 1) return [start];
  const arr: number[] = [];
  const step = (stop - start) / (num - 1);
  for (let i = 0; i < num; i++) {
    arr.push(start + step * i);
  }
  return arr;
}

const F_ENERGY = 0.2;
const F_PHASE = 0.203;
const STEPS_PER_UNIT_DURATION = 100;

export const calculateSimulationData = (
  currentDuration: number, 
  currentNoise: number, 
  currentThreshold: number,
  rng: SeededRandom 
): SimulationDataPoint[] => {
  const steps = Math.max(10, Math.floor(currentDuration * STEPS_PER_UNIT_DURATION));
  const timeArray = linspace(0, currentDuration, steps);
  
  if (timeArray.length === 0) {
    return [];
  }

  const energieArray = timeArray.map(t => 
    Math.sin(2 * Math.PI * F_ENERGY * t) + currentNoise * rng.randn()
  );
  const phaseArray = timeArray.map(t => 
    Math.sin(2 * Math.PI * F_PHASE * t + Math.PI / 4) + currentNoise * rng.randn()
  );

  return timeArray.map((t, i) => {
    const rawEnergie = energieArray[i];
    const rawPhase = phaseArray[i];
    
    const displayEnergie = parseFloat(rawEnergie.toFixed(3));
    const displayPhase = parseFloat(rawPhase.toFixed(3));

    const point: SimulationDataPoint = {
      time: parseFloat(t.toFixed(2)),
      energie: displayEnergie,
      phase: displayPhase,
    };

    if (
      rawEnergie > currentThreshold &&
      rawPhase > currentThreshold &&
      displayEnergie === displayPhase 
    ) {
      point.knoten = displayEnergie;
      // Simplified Semantic Knotenladung
      if (displayEnergie > currentThreshold * 1.8 && currentNoise < 0.25) {
        point.characteristic = "Starker Hochenergie-Knoten (Niedrigrauschen)";
      } else if (displayEnergie > currentThreshold * 1.5) {
        point.characteristic = "Hochenergie-Knoten";
      } else if (currentNoise < 0.2) {
        point.characteristic = "Niedrigrauschen-Knoten";
      } else {
        point.characteristic = "Standard-Resonanzknoten";
      }
    }
    return point;
  });
};
