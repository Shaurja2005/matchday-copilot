import React, { useEffect, useState, useCallback } from 'react';
import { crowdApi } from '../../utils/api';
import { Zone, Queue } from '../../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function DensityBar({ percent, status }: { percent: number; status: Zone['status'] }): JSX.Element {
  const colors: Record<Zone['status'], string> = {
    normal: 'bg-pitch-500',
    busy: 'bg-amber-500',
    critical: 'bg-red-500',
  };
  return (
    <div className="density-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${percent}% capacity`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ${colors[status]}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function CrowdHeatmap(): JSX.Element {
  const [zones, setZones] = useState<Zone[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [totalOccupancy, setTotalOccupancy] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [zonesRes, queuesRes] = await Promise.all([
      crowdApi.getZones(),
      crowdApi.getQueues(),
    ]);
    setZones(zonesRes.zones);
    setQueues(queuesRes.queues);
    setTotalOccupancy(zonesRes.totalOccupancy);
    setTotalCapacity(zonesRes.totalCapacity);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => void fetchData(), 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const overallPct = Math.round((totalOccupancy / totalCapacity) * 100);
  const overallStatus: Zone['status'] = overallPct >= 90 ? 'critical' : overallPct >= 70 ? 'busy' : 'normal';

  const TrendIcon = ({ trend }: { trend: Queue['trend'] }): JSX.Element => {
    if (trend === 'increasing') return <TrendingUp className="w-3.5 h-3.5 text-red-400" aria-label="Increasing" />;
    if (trend === 'decreasing') return <TrendingDown className="w-3.5 h-3.5 text-pitch-400" aria-label="Decreasing" />;
    return <Minus className="w-3.5 h-3.5 text-white/40" aria-label="Stable" />;
  };

  const getQueueForZone = (zone: Zone): Queue | undefined =>
    queues.find((q) => zone.gateIds.includes(q.gateId));

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading crowd data">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" role="region" aria-label="Crowd density heatmap">
      {/* Overall stat */}
      <div className="stat-card" aria-label={`Overall stadium occupancy: ${overallPct}%`}>
        <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Overall Occupancy</p>
        <div className="flex items-end gap-3 mb-2">
          <span className="font-headline text-4xl text-gold-gradient">{overallPct}%</span>
          <span className="text-sm text-white/50 mb-1">
            {totalOccupancy.toLocaleString()} / {totalCapacity.toLocaleString()} fans
          </span>
        </div>
        <DensityBar percent={overallPct} status={overallStatus} />
      </div>

      {/* Per-zone grid */}
      <div className="grid grid-cols-1 gap-2" role="list" aria-label="Zone by zone crowd density">
        {zones.map((zone) => {
          const queue = getQueueForZone(zone);
          return (
            <div
              key={zone.id}
              className="glass-card p-3 hover:border-white/20 transition-all duration-200"
              role="listitem"
              aria-label={`${zone.name}: ${zone.densityPercent}% capacity, status ${zone.status}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      zone.status === 'critical' ? 'bg-red-500 animate-pulse' :
                      zone.status === 'busy' ? 'bg-amber-500' : 'bg-pitch-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-white">{zone.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {queue && (
                    <div className="flex items-center gap-1 text-xs text-white/50">
                      <TrendIcon trend={queue.trend} />
                      <span aria-label={`${queue.waitTimeMinutes} minute wait`}>{queue.waitTimeMinutes}m</span>
                    </div>
                  )}
                  <span className={`status-badge status-${zone.status} text-xs`}>
                    {zone.densityPercent}%
                  </span>
                </div>
              </div>
              <DensityBar percent={zone.densityPercent} status={zone.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
