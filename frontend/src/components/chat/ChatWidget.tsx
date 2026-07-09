import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot, User, Globe, Accessibility, Baby, Ticket } from 'lucide-react';
import { chatApi } from '../../utils/api';
import { ChatMessage, SUPPORTED_LANGUAGES, Language } from '../../types';
import { usePersona } from '../../contexts/PersonaContext';
import ReactMarkdown from 'react-markdown';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface ChatWidgetProps {
  className?: string;
}

export function ChatWidget({ className = '' }: ChatWidgetProps): JSX.Element {
  const { persona, userContext, updateUserContext } = usePersona();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "👋 Welcome to MatchDay Copilot! I'm here to help you navigate the stadium, find facilities, and answer your questions in your language. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const debouncedInput = useDebounce(input, 300);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Announce new assistant messages to screen readers
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant' && liveRegionRef.current) {
      liveRegionRef.current.textContent = lastMsg.content;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const trimmed = debouncedInput.trim() || input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatApi.sendMessage({
        message: trimmed,
        conversationHistory: messages.slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        persona,
        userContext,
      });

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        detectedLanguage: response.detectedLanguage,
        cached: response.cached,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [debouncedInput, input, isLoading, messages, persona, userContext]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const quickQuestions = [
    "Where's the nearest restroom?",
    "Which gate has shortest queue?",
    "How do I reach Section 214?",
    "Transport options to stadium?",
  ];

  return (
    <div
      className={`glass-card flex flex-col h-full ${className}`}
      role="region"
      aria-label="Stadium assistant chat"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-pitch-700 flex items-center justify-center shadow-gold">
            <Bot className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-white text-lg">MatchDay Copilot</h2>
            <p className="text-xs text-white/50">Multilingual Stadium Assistant</p>
          </div>
        </div>
        <button
          onClick={() => setShowContext((v) => !v)}
          className="text-white/50 hover:text-gold-400 transition-colors p-2 rounded-lg hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          aria-label="Toggle context settings"
          aria-expanded={showContext}
        >
          <Globe className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Context panel */}
      {showContext && (
        <div className="p-4 bg-navy-900/50 border-b border-white/10 animate-slide-up" aria-label="Personalization settings">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Personalize your experience</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateUserContext({ hasWheelchair: !userContext.hasWheelchair })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                userContext.hasWheelchair
                  ? 'bg-pitch-700 text-pitch-200 border border-pitch-500'
                  : 'bg-navy-700 text-white/60 hover:text-white border border-white/10'
              }`}
              aria-pressed={userContext.hasWheelchair ?? false}
            >
              <Accessibility className="w-3.5 h-3.5" aria-hidden="true" />
              Wheelchair accessible
            </button>
            <button
              onClick={() => updateUserContext({ hasChildren: !userContext.hasChildren })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                userContext.hasChildren
                  ? 'bg-pitch-700 text-pitch-200 border border-pitch-500'
                  : 'bg-navy-700 text-white/60 hover:text-white border border-white/10'
              }`}
              aria-pressed={userContext.hasChildren ?? false}
            >
              <Baby className="w-3.5 h-3.5" aria-hidden="true" />
              Traveling with kids
            </button>
            <div className="flex items-center gap-1.5 bg-navy-700 border border-white/10 rounded-lg px-3 py-1.5">
              <Ticket className="w-3.5 h-3.5 text-gold-400" aria-hidden="true" />
              <input
                type="text"
                placeholder="Section # (e.g. 214)"
                value={userContext.ticketSection || ''}
                onChange={(e) => updateUserContext({ ticketSection: e.target.value })}
                className="bg-transparent text-xs text-white placeholder-white/30 outline-none w-28"
                aria-label="Your ticket section number"
                maxLength={10}
              />
            </div>
          </div>
        </div>
      )}

      {/* Screen reader announcer (aria-live) */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        role="log"
        aria-label="Conversation messages"
        aria-live="off"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            aria-label={`${msg.role === 'user' ? 'You' : 'Assistant'} said`}
          >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'user'
                ? 'bg-pitch-700'
                : 'bg-gradient-to-br from-gold-500 to-pitch-700'
            }`}>
              {msg.role === 'user'
                ? <User className="w-4 h-4 text-white" aria-hidden="true" />
                : <Bot className="w-4 h-4 text-white" aria-hidden="true" />
              }
            </div>

            <div className="flex flex-col gap-1 max-w-[80%]">
              <div
                className={`${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'} text-sm leading-relaxed whitespace-pre-wrap prose prose-invert max-w-none`}
                style={{ direction: msg.detectedLanguage === 'ar' ? 'rtl' : 'ltr' }}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              {msg.cached && (
                <span className="text-xs text-white/30 ml-1">⚡ Cached response</span>
              )}
              {msg.detectedLanguage && msg.detectedLanguage !== 'en' && (
                <span className="text-xs text-white/30 ml-1">
                  Language: {SUPPORTED_LANGUAGES[msg.detectedLanguage as Language] || msg.detectedLanguage}
                </span>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-slide-up" aria-live="polite" aria-label="Assistant is typing">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-pitch-700 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <div className="chat-bubble-assistant">
              <Loader2 className="w-4 h-4 animate-spin text-gold-400" aria-hidden="true" />
              <span className="sr-only">Generating response...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-sm" role="alert">
            ⚠️ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-white/40 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setInput(q);
                  inputRef.current?.focus();
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-navy-700 text-white/60 hover:text-white hover:bg-navy-600 border border-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything in your language..."
              className="w-full bg-navy-700/50 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold-500 border border-white/10 focus:border-gold-500/50 transition-all"
              rows={2}
              maxLength={1000}
              aria-label="Type your message"
              aria-describedby="chat-input-hint"
              disabled={isLoading}
            />
            <span id="chat-input-hint" className="sr-only">Press Enter to send, Shift+Enter for new line</span>
          </div>
          <button
            onClick={() => void sendMessage()}
            disabled={isLoading || !input.trim()}
            className="btn-gold p-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Send message"
          >
            {isLoading
              ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              : <Send className="w-5 h-5" aria-hidden="true" />
            }
          </button>
        </div>
        <p className="text-xs text-white/20 mt-2">
          Supports English, Español, Français, Português, العربية
        </p>
      </div>
    </div>
  );
}
