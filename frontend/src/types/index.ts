// Frontend TypeScript types (mirrors backend types)

export interface Zone {
  id: string;
  name: string;
  label: string;
  gateIds: string[];
  capacity: number;
  currentOccupancy: number;
  densityPercent: number;
  status: 'normal' | 'busy' | 'critical';
  sections: string[];
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
  lastUpdated: string;
}

export interface Gate {
  id: string;
  name: string;
  label: string;
  x: number;
  y: number;
  capacity: number;
  isAccessible: boolean;
  accessibleFeatures: string[];
  linkedZoneIds: string[];
  nearbyTransport: string[];
  nearbyFacilities: Facility[];
}

export interface Facility {
  type: 'restroom' | 'food' | 'medical' | 'info' | 'atm' | 'shop';
  label: string;
  isAccessible: boolean;
  distanceMeters: number;
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
  frequency?: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  detectedLanguage?: string;
  cached?: boolean;
}

export interface UserContext {
  hasWheelchair?: boolean;
  hasChildren?: boolean;
  ticketSection?: string;
  kickoffTime?: string;
  currentLocation?: string;
}

export interface Decision {
  id: string;
  triggeredAt: string;
  type: 'queue_alert' | 'density_alert' | 'transport_alert' | 'weather_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedGateIds: string[];
  affectedZoneIds: string[];
  triggerReason: string;
  aiRecommendation: string;
  aiRationale: string;
  isHumanApprovalRequired: true;
  status: 'pending' | 'acknowledged' | 'acted' | 'dismissed';
}

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
  hotspots: { zoneId: string; zoneName: string; densityPercent: number; reason: string }[];
  recommendedActions: string[];
  staffingNotes: string;
}

export type Persona = 'fan' | 'staff' | 'organizer';
export type Language = 'en' | 'es' | 'fr' | 'pt' | 'ar';

export const SUPPORTED_LANGUAGES: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  ar: 'العربية',
};
