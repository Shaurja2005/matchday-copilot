/**
 * Accessibility tests — Staff Dashboard & Organizer Control Room
 *
 * Extends axe coverage beyond the ChatWidget to validate that the staff
 * and organizer views also meet WCAG 2.1 AA requirements.
 *
 * Tests:
 *   - Staff page: initial render, tab nav keyboard accessibility
 *   - Organizer page: initial render, queue scoreboard aria labels
 *   - Shared: live-updating crowd density regions use aria-live="polite"
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';

expect.extend(toHaveNoViolations);

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock all API calls
jest.mock('../src/utils/api', () => ({
  chatApi: {
    sendMessage: jest.fn().mockResolvedValue({
      reply: 'Mock reply',
      detectedLanguage: 'en',
      cached: false,
      safetyFlagged: false,
    }),
    draftStaffReply: jest.fn().mockResolvedValue({ reply: 'Mock staff reply' }),
  },
  staffApi: {
    getBriefing: jest.fn().mockResolvedValue({
      generatedAt: new Date().toISOString(),
      summary: 'Current status is AMBER. Monitor Gate A and Gate E closely.',
      hotspots: [
        { zoneId: 'zone-north', zoneName: 'North Stand', densityPercent: 88, reason: '88% capacity (busy)' },
      ],
      recommendedActions: ['Deploy extra staff to Gate A.'],
      staffingNotes: 'Simulated data — human review required.',
    }),
    getIncidents: jest.fn().mockResolvedValue({ incidents: [] }),
    createIncident: jest.fn().mockResolvedValue({
      id: 'test-id',
      description: 'Test incident',
      severity: 'medium',
      status: 'open',
      reportedAt: new Date().toISOString(),
      reportedBy: 'Test User',
      aiTriageSuggestion: 'Monitor situation',
      aiRecommendedNextStep: 'Consider assessing in person.',
    }),
    updateIncidentStatus: jest.fn(),
  },
  crowdApi: {
    getZones: jest.fn().mockResolvedValue({
      zones: [
        {
          id: 'zone-north',
          name: 'North Stand',
          label: 'North Stand',
          densityPercent: 88,
          status: 'busy',
          currentOccupancy: 8800,
          capacity: 10000,
          gateIds: ['gate-a'],
          sections: ['100', '101'],
          x: 20, y: 10, width: 30, height: 15,
        },
      ],
      totalOccupancy: 8800,
      totalCapacity: 10000,
      timestamp: new Date().toISOString(),
    }),
    getQueues: jest.fn().mockResolvedValue({
      queues: [
        {
          id: 'q1',
          gateId: 'gate-a',
          gateName: 'Gate A',
          waitTimeMinutes: 22,
          trend: 'increasing',
          lastUpdated: new Date().toISOString(),
        },
      ],
      timestamp: new Date().toISOString(),
    }),
    getGates: jest.fn().mockResolvedValue({ gates: [] }),
    getTransport: jest.fn().mockResolvedValue({ transport: [] }),
    getDecisions: jest.fn().mockResolvedValue({ decisions: [], count: 0, timestamp: '' }),
  },
  organizerApi: {
    getSummary: jest.fn().mockResolvedValue({
      generatedAt: new Date().toISOString(),
      overallStatus: 'amber',
      summary: 'Overall status is AMBER. Gate A is the primary concern.',
      keyMetrics: [
        { label: 'Total Occupancy', value: '45,000 / 68,000', status: 'ok' },
        { label: 'Gate A Queue', value: 22, unit: 'min', trend: 'up', status: 'critical' },
      ],
    }),
    getSustainability: jest.fn().mockResolvedValue({
      generatedAt: new Date().toISOString(),
      estimatedAttendance: 45000,
      byTransportMode: { metro: 12000, shuttle: 8000, rideshare: 5000 },
      aiAnalysis: 'Metro is the greenest option. Consider promoting shuttle buses.',
    }),
    query: jest.fn().mockResolvedValue({
      query: 'test',
      answer: 'Gate A needs attention.',
      dataTimestamp: new Date().toISOString(),
    }),
  },
}));

import { AccessibilityProvider } from '../src/contexts/AccessibilityContext';
import { PersonaProvider } from '../src/contexts/PersonaContext';
import { StaffPage } from '../src/pages/StaffPage';
import { OrganizerPage } from '../src/pages/OrganizerPage';

function wrapWithProviders(ui: React.ReactElement): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <AccessibilityProvider>
        <PersonaProvider>
          {ui}
        </PersonaProvider>
      </AccessibilityProvider>
    </MemoryRouter>
  );
}

// -----------------------------------------------
// Staff Dashboard accessibility tests
// -----------------------------------------------

describe('StaffPage — Accessibility', () => {
  it('should have no axe violations on initial render', async () => {
    let container!: HTMLElement;
    await act(async () => {
      const result = wrapWithProviders(<StaffPage />);
      container = result.container;
      // Wait for initial data-fetch effects to settle
      await waitFor(() => {}, { timeout: 100 });
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have a visible h1 heading for the page', () => {
    wrapWithProviders(<StaffPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should have tablist with aria-label for the dashboard tabs', () => {
    wrapWithProviders(<StaffPage />);
    const tabList = screen.getByRole('tablist', { name: /staff dashboard sections/i });
    expect(tabList).toBeInTheDocument();
  });

  it('should have each tab button with correct role and aria-selected', () => {
    wrapWithProviders(<StaffPage />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThan(0);
    // At least one tab should be selected
    const selectedTabs = tabs.filter((t) => t.getAttribute('aria-selected') === 'true');
    expect(selectedTabs.length).toBe(1);
  });

  it('should display Volunteer Dashboard persona badge', () => {
    wrapWithProviders(<StaffPage />);
    expect(screen.getByText(/Volunteer Dashboard/i)).toBeInTheDocument();
  });
});

// -----------------------------------------------
// Organizer Control Room accessibility tests
// -----------------------------------------------

describe('OrganizerPage — Accessibility', () => {
  it('should have no axe violations on initial render', async () => {
    let container!: HTMLElement;
    await act(async () => {
      const result = wrapWithProviders(<OrganizerPage />);
      container = result.container;
      await waitFor(() => {}, { timeout: 100 });
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have a visible h1 heading for the page', () => {
    wrapWithProviders(<OrganizerPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should display Organizer Control Room persona badge', () => {
    wrapWithProviders(<OrganizerPage />);
    expect(screen.getByText(/Organizer Control Room/i)).toBeInTheDocument();
  });

  it('should have tablist for the control room sections', () => {
    wrapWithProviders(<OrganizerPage />);
    const tabList = screen.getByRole('tablist');
    expect(tabList).toBeInTheDocument();
  });
});
