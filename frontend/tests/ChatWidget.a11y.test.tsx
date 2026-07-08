/**
 * Accessibility tests — ChatWidget
 * Tests ARIA attributes, keyboard navigation, and screen reader support.
 * Uses jest-axe to scan for WCAG violations.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { PersonaProvider } from '../src/contexts/PersonaContext';
import { AccessibilityProvider } from '../src/contexts/AccessibilityContext';
import { ChatWidget } from '../src/components/chat/ChatWidget';

expect.extend(toHaveNoViolations);

// Mock the API
jest.mock('../src/utils/api', () => ({
  chatApi: {
    sendMessage: jest.fn().mockResolvedValue({
      reply: 'The nearest restroom is at Gate D.',
      detectedLanguage: 'en',
      cached: false,
      safetyFlagged: false,
    }),
    draftStaffReply: jest.fn(),
  },
  crowdApi: {
    getZones: jest.fn().mockResolvedValue({ zones: [], totalOccupancy: 0, totalCapacity: 0, timestamp: '' }),
    getQueues: jest.fn().mockResolvedValue({ queues: [], timestamp: '' }),
    getGates: jest.fn().mockResolvedValue({ gates: [] }),
    getTransport: jest.fn().mockResolvedValue({ transport: [] }),
    getDecisions: jest.fn().mockResolvedValue({ decisions: [], count: 0, timestamp: '' }),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

function renderChatWidget(): ReturnType<typeof render> {
  return render(
    <AccessibilityProvider>
      <PersonaProvider>
        <ChatWidget />
      </PersonaProvider>
    </AccessibilityProvider>
  );
}

describe('ChatWidget — Accessibility', () => {
  it('should have no axe violations on initial render', async () => {
    const { container } = renderChatWidget();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have a labeled chat input field', () => {
    renderChatWidget();
    const input = screen.getByLabelText('Type your message');
    expect(input).toBeInTheDocument();
  });

  it('should have an aria-label on the send button', () => {
    renderChatWidget();
    const sendBtn = screen.getByRole('button', { name: 'Send message' });
    expect(sendBtn).toBeInTheDocument();
  });

  it('should have aria-live region for screen reader announcements', () => {
    renderChatWidget();
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('should have a log role on the messages container', () => {
    renderChatWidget();
    const log = screen.getByRole('log');
    expect(log).toBeInTheDocument();
  });

  it('should render the assistant heading', () => {
    renderChatWidget();
    expect(screen.getByRole('heading', { name: /MatchDay Copilot/i })).toBeInTheDocument();
  });

  it('send button should be disabled when input is empty', () => {
    renderChatWidget();
    const sendBtn = screen.getByRole('button', { name: 'Send message' });
    expect(sendBtn).toBeDisabled();
  });

  it('send button should be enabled when input has text', () => {
    renderChatWidget();
    const input = screen.getByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'Where is the restroom?' } });
    const sendBtn = screen.getByRole('button', { name: 'Send message' });
    expect(sendBtn).toBeEnabled();
  });

  it('should show context toggle button with aria-expanded', () => {
    renderChatWidget();
    const contextBtn = screen.getByRole('button', { name: 'Toggle context settings' });
    expect(contextBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('wheelchair toggle should have aria-pressed attribute', () => {
    renderChatWidget();
    // Open context panel first
    const contextBtn = screen.getByRole('button', { name: 'Toggle context settings' });
    fireEvent.click(contextBtn);
    const wheelchairBtn = screen.getByRole('button', { name: /Wheelchair accessible/i });
    expect(wheelchairBtn).toHaveAttribute('aria-pressed');
  });

  it('should announce loading state when sending message', async () => {
    renderChatWidget();
    const input = screen.getByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'Test question' } });
    const sendBtn = screen.getByRole('button', { name: 'Send message' });
    fireEvent.click(sendBtn);
    // The sr-only loading text should appear
    await waitFor(() => {
      expect(screen.queryByText('Generating response...')).toBeInTheDocument();
    });
  });
});

describe('ChatWidget — Keyboard Navigation', () => {
  it('should submit with Enter key', async () => {
    const { chatApi } = await import('../src/utils/api');
    renderChatWidget();
    const input = screen.getByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'Press Enter test' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    await waitFor(() => {
      expect(chatApi.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Press Enter test' })
      );
    });
  });

  it('should NOT submit with Shift+Enter (new line)', () => {
    renderChatWidget();
    const input = screen.getByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'Multi-line' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    // chatApi.sendMessage should not be called
    const { chatApi } = jest.requireMock('../src/utils/api') as { chatApi: { sendMessage: jest.Mock } };
    expect(chatApi.sendMessage).not.toHaveBeenCalled();
  });
});
