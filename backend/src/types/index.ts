// ============================================================
// MatchDay Copilot — Core TypeScript Types
// ============================================================

// ----- Stadium Infrastructure -----

export interface Gate {
  id: string;
  name: string;
  label: string; // e.g. "Gate A"
  x: number; // SVG map coordinate (0-100 scale)
  y: number;
  capacity: number;
  isAccessible: boolean;
  accessibleFeatures: string[]; // e.g. ["ramp", "elevator", "priority lane"]
  linkedZoneIds: string[];
  nearbyTransport: string[]; // transport IDs
  nearbyFacilities: Facility[];
}

export interface Facility {
  type: 'restroom' | 'food' | 'medical' | 'info' | 'atm' | 'shop';
  label: string;
  isAccessible: boolean;
  distanceMeters: number;
}

export interface Zone {
  id: string;
  name: string;
  label: string;
  gateIds: string[];
  capacity: number;
  currentOccupancy: number; // persons
  densityPercent: number; // 0–100
  status: 'normal' | 'busy' | 'critical';
  sections: string[]; // e.g. ["210", "211", "212"]
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Queue {
  id: string;
  gateId: string;
  gateName: string;
  waitTimeMinutes: number;
  trend: 'decreasing' | 'stable' | 'increasing';
  lastUpdated: string; // ISO timestamp
}

export interface TransportRoute {
  id: string;
  type: 'metro' | 'shuttle' | 'rideshare' | 'walking' | 'bus';
  label: string;
  origin: string;
  etaMinutes: number;
  crowdingLevel: 'low' | 'medium' | 'high';
  isAccessible: boolean;
  carbonKgPerPerson: number;
  frequency?: string; // e.g. "Every 5 min"
}

// ----- GenAI / Chat -----

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
  persona: 'fan' | 'staff' | 'organizer';
  userContext?: UserContext;
  language?: string; // ISO 639-1 code, e.g. "en", "es"
}

export interface ChatResponse {
  reply: string;
  detectedLanguage: string;
  suggestedActions?: string[];
  safetyFlagged: boolean;
  cached: boolean;
}

export interface UserContext {
  hasWheelchair?: boolean;
  hasChildren?: boolean;
  ticketSection?: string;
  kickoffTime?: string;
  currentLocation?: string;
}

// ----- Crowd & Decision Engine -----

export interface CrowdSnapshot {
  timestamp: string;
  zones: Zone[];
  queues: Queue[];
  totalOccupancy: number;
  totalCapacity: number;
}

export interface Decision {
  id: string;
  triggeredAt: string;
  type: 'queue_alert' | 'density_alert' | 'transport_alert' | 'weather_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedGateIds: string[];
  affectedZoneIds: string[];
  triggerReason: string; // Deterministic rule that fired
  aiRecommendation: string; // GenAI-generated human-readable action
  aiRationale: string; // GenAI explanation of why
  isHumanApprovalRequired: true; // Always true — human-in-the-loop design
  status: 'pending' | 'acknowledged' | 'acted' | 'dismissed';
}

// ----- Staff / Incident -----

export interface Incident {
  id: string;
  reportedAt: string;
  gateId?: string;
  zoneId?: string;
  description: string;
  reportedBy: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  aiTriageSuggestion: string;
  aiRecommendedNextStep: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface ShiftBriefing {
  generatedAt: string;
  summary: string;
  hotspots: Hotspot[];
  recommendedActions: string[];
  staffingNotes: string;
}

export interface Hotspot {
  zoneId: string;
  zoneName: string;
  densityPercent: number;
  reason: string;
}

// ----- Organizer -----

export interface OrganizerSummary {
  generatedAt: string;
  overallStatus: 'green' | 'amber' | 'red';
  summary: string;
  keyMetrics: KeyMetric[];
  sustainabilityPanel: SustainabilityData;
  recommendedActions: string[];
}

export interface KeyMetric {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status: 'ok' | 'warning' | 'critical';
}

export interface SustainabilityData {
  estimatedTotalCarbonKg: number;
  byTransportMode: Record<string, number>;
  suggestions: string[];
}

// ----- FAQ / RAG -----

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  languages: Record<string, { question: string; answer: string }>;
}
