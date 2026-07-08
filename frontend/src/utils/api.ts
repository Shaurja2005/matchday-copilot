/**
 * MatchDay Copilot — API Client
 *
 * All API calls go through this module (server-side proxy in dev).
 * Never calls GenAI APIs directly from the browser.
 */

import { Zone, Queue, Gate, TransportRoute, Decision, Incident, ShiftBriefing, ChatMessage, UserContext } from '../types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((error as { error: string }).error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// -----------------------------------------------
// Chat
// -----------------------------------------------

export interface ChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
  persona: 'fan' | 'staff' | 'organizer';
  userContext?: UserContext;
}

export interface ChatResponse {
  reply: string;
  detectedLanguage: string;
  cached: boolean;
  safetyFlagged: boolean;
}

export const chatApi = {
  sendMessage: (request: ChatRequest): Promise<ChatResponse> =>
    fetchJSON(`${API_BASE}/chat`, {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  draftStaffReply: (staffNote: string, targetLanguage: string, fanOriginalMessage: string): Promise<{ reply: string }> =>
    fetchJSON(`${API_BASE}/chat/staff-reply`, {
      method: 'POST',
      body: JSON.stringify({ staffNote, targetLanguage, fanOriginalMessage }),
    }),
};

// -----------------------------------------------
// Crowd Data
// -----------------------------------------------

export const crowdApi = {
  getZones: (): Promise<{ zones: Zone[]; totalOccupancy: number; totalCapacity: number; timestamp: string }> =>
    fetchJSON(`${API_BASE}/crowd/zones`),

  getQueues: (): Promise<{ queues: Queue[]; timestamp: string }> =>
    fetchJSON(`${API_BASE}/crowd/queues`),

  getGates: (): Promise<{ gates: Gate[] }> =>
    fetchJSON(`${API_BASE}/crowd/gates`),

  getTransport: (): Promise<{ transport: TransportRoute[] }> =>
    fetchJSON(`${API_BASE}/crowd/transport`),

  getDecisions: (): Promise<{ decisions: Decision[]; count: number; timestamp: string }> =>
    fetchJSON(`${API_BASE}/crowd/decisions`),
};

// -----------------------------------------------
// Staff
// -----------------------------------------------

export const staffApi = {
  getBriefing: (): Promise<ShiftBriefing> =>
    fetchJSON(`${API_BASE}/staff/briefing`),

  getIncidents: (): Promise<{ incidents: Incident[] }> =>
    fetchJSON(`${API_BASE}/staff/incidents`),

  createIncident: (data: { description: string; reportedBy: string; gateId?: string; zoneId?: string }): Promise<Incident> =>
    fetchJSON(`${API_BASE}/staff/incident`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateIncidentStatus: (id: string, status: Incident['status']): Promise<Incident> =>
    fetchJSON(`${API_BASE}/staff/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// -----------------------------------------------
// Organizer
// -----------------------------------------------

export interface OrganizerSummaryResponse {
  generatedAt: string;
  overallStatus: 'green' | 'amber' | 'red';
  summary: string;
  keyMetrics: Array<{
    label: string;
    value: string | number;
    unit?: string;
    trend?: 'up' | 'down' | 'stable';
    status: 'ok' | 'warning' | 'critical';
  }>;
}

export interface SustainabilityResponse {
  generatedAt: string;
  estimatedAttendance: number;
  byTransportMode: Record<string, number>;
  aiAnalysis: string;
}

export const organizerApi = {
  getSummary: (): Promise<OrganizerSummaryResponse> =>
    fetchJSON(`${API_BASE}/organizer/summary`),

  query: (query: string): Promise<{ query: string; answer: string; dataTimestamp: string }> =>
    fetchJSON(`${API_BASE}/organizer/query`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  getSustainability: (): Promise<SustainabilityResponse> =>
    fetchJSON(`${API_BASE}/organizer/sustainability`),
};
