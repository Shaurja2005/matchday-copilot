/**
 * MatchDay Copilot — Crowd Simulator
 *
 * Simulates real-time crowd density and queue fluctuations.
 * In production, this would be replaced with real sensor/turnstile data feeds.
 * All data is clearly labeled as simulated for demo purposes.
 */

import zonesRaw from '../../data/zones.json';
import queuesRaw from '../../data/queues.json';
import { Zone, Queue, CrowdSnapshot } from '../../types';
import { logger } from '../../utils/logger';

// Simulation state
let currentZones: Zone[] = [...(zonesRaw as Zone[])];
let currentQueues: Queue[] = [...(queuesRaw as Queue[])];
let lastUpdateTime = new Date().toISOString();

// Simulation parameters
const SIMULATION_TICK_MS = 30_000; // Update every 30 seconds
const MAX_DENSITY_FLUCTUATION = 5; // ±5% per tick
const MAX_QUEUE_FLUCTUATION = 3; // ±3 minutes per tick

/**
 * Apply a single simulation tick — randomly fluctuate density and queue times
 * within realistic bounds, enforcing status thresholds.
 */
function simulateTick(): void {
  currentZones = currentZones.map((zone) => {
    const delta = (Math.random() - 0.5) * 2 * MAX_DENSITY_FLUCTUATION;
    const newDensity = Math.max(10, Math.min(100, zone.densityPercent + delta));
    const newOccupancy = Math.round((newDensity / 100) * zone.capacity);

    let status: Zone['status'];
    if (newDensity >= 90) status = 'critical';
    else if (newDensity >= 70) status = 'busy';
    else status = 'normal';

    return {
      ...zone,
      densityPercent: Math.round(newDensity),
      currentOccupancy: newOccupancy,
      status,
    };
  });

  currentQueues = currentQueues.map((queue) => {
    const delta = (Math.random() - 0.5) * 2 * MAX_QUEUE_FLUCTUATION;
    const newWait = Math.max(0, Math.round(queue.waitTimeMinutes + delta));

    let trend: Queue['trend'];
    if (delta > 1) trend = 'increasing';
    else if (delta < -1) trend = 'decreasing';
    else trend = 'stable';

    return {
      ...queue,
      waitTimeMinutes: newWait,
      trend,
      lastUpdated: new Date().toISOString(),
    };
  });

  lastUpdateTime = new Date().toISOString();
  logger.info('Crowd simulation tick completed');
}

// Start simulation loop
let simulationInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the crowd simulation loop. Runs a tick every SIMULATION_TICK_MS milliseconds.
 * Idempotent — calling this a second time while the simulation is already running
 * is a no-op, preventing duplicate intervals.
 *
 * In production, replace this interval with a real data ingestion pipeline
 * (e.g., WebSocket subscription to turnstile / access-control APIs).
 */
export function startSimulation(): void {
  if (simulationInterval) return;
  simulationInterval = setInterval(simulateTick, SIMULATION_TICK_MS);
  logger.info(`Crowd simulation started (tick every ${SIMULATION_TICK_MS / 1000}s)`);
}

/**
 * Stop the crowd simulation loop. Used during graceful server shutdown and in tests
 * to prevent lingering interval handles that would block Jest from exiting.
 */
export function stopSimulation(): void {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    logger.info('Crowd simulation stopped');
  }
}

/**
 * Get the current crowd snapshot.
 */
export function getCrowdSnapshot(): CrowdSnapshot {
  const totalOccupancy = currentZones
    .filter((z) => z.id !== 'zone-concourse') // Avoid double-counting
    .reduce((sum, z) => sum + z.currentOccupancy, 0);

  const totalCapacity = currentZones
    .filter((z) => z.id !== 'zone-concourse')
    .reduce((sum, z) => sum + z.capacity, 0);

  return {
    timestamp: lastUpdateTime,
    zones: [...currentZones],
    queues: [...currentQueues],
    totalOccupancy,
    totalCapacity,
  };
}

export function getCurrentZones(): Zone[] {
  return [...currentZones];
}

export function getCurrentQueues(): Queue[] {
  return [...currentQueues];
}

/**
 * Inject a specific crowd state for unit testing.
 * Allows tests to set precise zone densities and queue times without
 * relying on the random simulation tick, making threshold boundary tests deterministic.
 *
 * @param zones  - Zone array to set as the current simulation state
 * @param queues - Queue array to set as the current simulation state
 */
export function setSimulationState(zones: Zone[], queues: Queue[]): void {
  currentZones = [...zones];
  currentQueues = [...queues];
  lastUpdateTime = new Date().toISOString();
}
