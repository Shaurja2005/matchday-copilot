import React, { useEffect, useState, useCallback } from 'react';
import { crowdApi } from '../../utils/api';
import { Zone, Queue, Gate } from '../../types';
import { MapPin, Users } from 'lucide-react';

const DENSITY_COLORS: Record<Zone['status'], string> = {
  normal: 'rgba(34, 197, 94, 0.35)',
  busy: 'rgba(245, 158, 11, 0.35)',
  critical: 'rgba(239, 68, 68, 0.45)',
};

const DENSITY_BORDER: Record<Zone['status'], string> = {
  normal: 'rgba(34, 197, 94, 0.7)',
  busy: 'rgba(245, 158, 11, 0.7)',
  critical: 'rgba(239, 68, 68, 0.8)',
};

interface StadiumMapProps {
  className?: string;
  showAccessibleRoutes?: boolean;
  highlightZoneId?: string;
}

export function StadiumMap({ className = '', showAccessibleRoutes = false, highlightZoneId }: StadiumMapProps): JSX.Element {
  const [zones, setZones] = useState<Zone[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPin] = useState({ x: 50, y: 92 }); // Default at Gate D

  const fetchData = useCallback(async () => {
    try {
      const [zonesRes, queuesRes, gatesRes] = await Promise.all([
        crowdApi.getZones(),
        crowdApi.getQueues(),
        crowdApi.getGates(),
      ]);
      setZones(zonesRes.zones);
      setQueues(queuesRes.queues);
      setGates(gatesRes.gates);
    } catch {
      // Silently handle error — map will show empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => void fetchData(), 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getQueueForGate = (gateId: string): Queue | undefined =>
    queues.find((q) => q.gateId === gateId);

  const getDensityLabel = (pct: number): string => {
    if (pct >= 90) return 'Critical';
    if (pct >= 70) return 'Busy';
    return 'Normal';
  };

  return (
    <div
      className={`glass-card overflow-hidden ${className}`}
      role="region"
      aria-label="Interactive stadium map showing crowd density"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="font-display font-semibold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gold-400" aria-hidden="true" />
          Stadium Map
          {showAccessibleRoutes && (
            <span className="text-xs px-2 py-0.5 bg-pitch-700/50 text-pitch-300 rounded-full border border-pitch-600/30">
              ♿ Accessible Routes
            </span>
          )}
        </h2>
        <span className="text-xs text-white/40">Live • Updates every 30s</span>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 flex items-center gap-4 text-xs border-b border-white/5">
        {(['normal', 'busy', 'critical'] as Zone['status'][]).map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: DENSITY_BORDER[status] }}
              aria-hidden="true"
            />
            <span className="text-white/60 capitalize">{status}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-3 h-3 rounded-full bg-gold-400 animate-pulse-slow" aria-hidden="true" />
          <span className="text-white/60">You are here</span>
        </div>
      </div>

      {/* Map SVG container */}
      <div className="relative w-full" style={{ paddingBottom: '100%' }}>
        <div className="absolute inset-0 p-3">
          {loading ? (
            <div role="status" aria-busy="true" aria-label="Loading map..." className="w-full h-full skeleton rounded-xl" />
          ) : (
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              role="img"
              aria-label="Stadium map with crowd density zones"
            >
              {/* Pitch background */}
              <rect x="20" y="20" width="60" height="60" rx="4" fill="rgba(26, 122, 46, 0.15)" stroke="rgba(26, 122, 46, 0.4)" strokeWidth="0.5" />
              {/* Pitch center circle */}
              <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              {/* Center spot */}
              <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.15)" />
              {/* Halfway line */}
              <line x1="20" y1="50" x2="80" y2="50" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
              {/* Goal areas */}
              <rect x="38" y="20" width="24" height="6" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
              <rect x="38" y="74" width="24" height="6" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />

              {/* Zone overlays */}
              {zones.map((zone) => {
                const isHighlighted = highlightZoneId === zone.id;
                const isSelected = selectedZone?.id === zone.id;
                return (
                  <g key={zone.id}>
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.width}
                      height={zone.height}
                      rx="2"
                      fill={DENSITY_COLORS[zone.status]}
                      stroke={DENSITY_BORDER[zone.status]}
                      strokeWidth={isHighlighted || isSelected ? 1.5 : 0.6}
                      className="cursor-pointer transition-all duration-500"
                      style={{
                        filter: isSelected ? 'brightness(1.5)' : isHighlighted ? 'brightness(1.3)' : 'none',
                      }}
                      onClick={() => setSelectedZone(isSelected ? null : zone)}
                      role="button"
                      aria-label={`${zone.name}: ${zone.densityPercent}% capacity, ${getDensityLabel(zone.densityPercent)}`}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedZone(isSelected ? null : zone);
                        }
                      }}
                    />
                    {/* Zone label */}
                    <text
                      x={zone.x + zone.width / 2}
                      y={zone.y + zone.height / 2 - 1.5}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.8)"
                      fontSize="3"
                      fontFamily="Inter, sans-serif"
                      fontWeight="600"
                      className="pointer-events-none select-none"
                    >
                      {zone.name.split(' ')[0]}
                    </text>
                    <text
                      x={zone.x + zone.width / 2}
                      y={zone.y + zone.height / 2 + 3}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.6)"
                      fontSize="2.5"
                      fontFamily="Inter, sans-serif"
                      className="pointer-events-none select-none"
                    >
                      {zone.densityPercent}%
                    </text>
                  </g>
                );
              })}

              {/* Gate markers */}
              {gates.map((gate) => {
                const queue = getQueueForGate(gate.id);
                return (
                  <g key={gate.id}>
                    <circle
                      cx={gate.x}
                      cy={gate.y}
                      r="2.5"
                      fill={queue && queue.waitTimeMinutes >= 20 ? '#ef4444' : '#D4AF37'}
                      stroke="white"
                      strokeWidth="0.8"
                    />
                    <text
                      x={gate.x}
                      y={gate.y + 5.5}
                      textAnchor="middle"
                      fill="white"
                      fontSize="2.2"
                      fontFamily="Inter, sans-serif"
                      fontWeight="700"
                      className="pointer-events-none select-none"
                    >
                      {gate.name}
                    </text>
                    {gate.isAccessible && showAccessibleRoutes && (
                      <circle cx={gate.x + 3} cy={gate.y - 2} r="1.5" fill="#22c55e" opacity="0.8" />
                    )}
                  </g>
                );
              })}

              {/* User location pin */}
              <g transform={`translate(${userPin.x}, ${userPin.y})`}>
                <circle r="3" fill="#D4AF37" opacity="0.3" className="animate-pulse-slow" />
                <circle r="1.8" fill="#D4AF37" stroke="white" strokeWidth="0.8" />
                <text y="6" textAnchor="middle" fill="#D4AF37" fontSize="2.5" fontWeight="700" className="select-none">
                  You
                </text>
              </g>

              {/* Accessible route overlay */}
              {showAccessibleRoutes && (
                <path
                  d="M 50 92 L 50 75 L 92 75 L 92 45"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                  opacity="0.7"
                />
              )}
            </svg>
          )}
        </div>
      </div>

      {/* Selected zone panel */}
      {selectedZone && (
        <div className="p-4 border-t border-white/10 bg-navy-900/50 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">{selectedZone.label}</h3>
            <button
              onClick={() => setSelectedZone(null)}
              className="text-white/40 hover:text-white p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              aria-label="Close zone details"
            >
              ×
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gold-400" aria-hidden="true" />
              <span className="text-white/70">
                {selectedZone.currentOccupancy.toLocaleString()} / {selectedZone.capacity.toLocaleString()}
              </span>
            </div>
            <span className={`status-badge status-${selectedZone.status}`}>
              {getDensityLabel(selectedZone.densityPercent)} — {selectedZone.densityPercent}%
            </span>
          </div>
          {/* Queue info for linked gates */}
          <div className="mt-2 space-y-1">
            {selectedZone.gateIds.map((gateId) => {
              const queue = getQueueForGate(gateId);
              const gate = gates.find((g) => g.id === gateId);
              if (!queue || !gate) return null;
              return (
                <div key={gateId} className="flex items-center justify-between text-xs text-white/60">
                  <span>{gate.name}</span>
                  <span className={queue.waitTimeMinutes >= 20 ? 'text-red-400' : queue.waitTimeMinutes >= 10 ? 'text-amber-400' : 'text-pitch-400'}>
                    {queue.waitTimeMinutes} min wait ({queue.trend})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
