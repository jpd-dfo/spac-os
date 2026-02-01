'use client';

// ============================================================================
// SPAC OS AI Assistant - Floating Chat Interface Component
// ============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  sources?: Array<{ title: string; url?: string }>;
}

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

interface AIAssistantProps {
  onSendMessage?: (message: string) => Promise<void>;
  onStreamMessage?: (message: string) => AsyncGenerator<string, void, unknown>;
  contextInfo?: {
    page?: string;
    spacId?: string;
    targetId?: string;
    documentId?: string;
  };
  quickActions?: QuickAction[];
  initialMessages?: Message[];
  className?: string;
}

// ============================================================================
// Default Quick Actions
// ============================================================================

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'summarize',
    label: 'Summarize this page',
    prompt: 'Please summarize the key information on the current page.',
  },
  {
    id: 'analyze-risks',
    label: 'Identify risks',
    prompt: 'What are the potential risks I should be aware of?',
  },
  {
    id: 'next-steps',
    label: 'Suggest next steps',
    prompt: 'What are the recommended next steps?',
  },
  {
    id: 'explain',
    label: 'Explain this',
    prompt: 'Can you explain the key concepts here in simple terms?',
  },
];

// ============================================================================
// Icons
// ============================================================================

const ChatIcon = () => (
  <svg
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const SendIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);

const SparklesIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

const LoadingDots = () => (
  <div className="flex space-x-1">
    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
  </div>
);

// ============================================================================
// AI Assistant Component
// ============================================================================

export function AIAssistant({
  onSendMessage,
  onStreamMessage,
  contextInfo,
  quickActions = DEFAULT_QUICK_ACTIONS,
  initialMessages = [],
  className,
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Hide quick actions after first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowQuickActions(false);
    }
  }, [messages.length]);

  // Generate unique ID
  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Handle sending message
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add assistant message placeholder for streaming
    const assistantMessageId = generateId();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      if (onStreamMessage) {
        // Handle streaming response
        const stream = onStreamMessage(content.trim());
        let fullContent = '';

        for await (const chunk of stream) {
          fullContent += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullContent }
                : msg
            )
          );
        }

        // Mark streaming as complete
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      } else if (onSendMessage) {
        // Handle non-streaming response
        await onSendMessage(content.trim());
      } else {
        // Default behavior - call API
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content.trim(),
            context: contextInfo,
            history: messages.slice(-10), // Last 10 messages for context
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const data = await response.json();

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: data.response, isStreaming: false, sources: data.sources }
              : msg
          )
        );
      }
    } catch (error) {
      // Error is displayed to user in the chat interface
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: 'Sorry, I encountered an error. Please try again.',
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onSendMessage, onStreamMessage, contextInfo, messages]);

  // Handle quick action click
  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.prompt);
  };

  // Handle input key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  // Clear chat history
  const handleClearChat = () => {
    setMessages([]);
    setShowQuickActions(true);
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-primary-600 px-4 py-3">
            <div className="flex items-center space-x-2">
              <SparklesIcon />
              <span className="font-semibold text-white">AI Assistant</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearChat}
                className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
                title="Clear chat"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-primary-100 p-4">
                  <SparklesIcon />
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">How can I help?</h3>
                <p className="mb-4 text-sm text-slate-500">
                  Ask me anything about your SPAC, targets, or documents.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-lg px-4 py-2',
                        message.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-100 text-slate-900'
                      )}
                    >
                      {message.isStreaming && !message.content ? (
                        <LoadingDots />
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-2 border-t border-slate-200 pt-2">
                              <p className="text-xs text-slate-500">Sources:</p>
                              <ul className="mt-1 text-xs">
                                {message.sources.map((source, idx) => (
                                  <li key={idx} className="text-primary-600">
                                    {source.url ? (
                                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                                        {source.title}
                                      </a>
                                    ) : (
                                      source.title
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <p
                            className={cn(
                              'mt-1 text-xs',
                              message.role === 'user' ? 'text-white/70' : 'text-slate-400'
                            )}
                          >
                            {formatTime(message.timestamp)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Quick Actions */}
            {showQuickActions && messages.length === 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:border-primary-300 hover:bg-primary-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-end space-x-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                rows={1}
                className="max-h-32 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={{
                  height: 'auto',
                  minHeight: '40px',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                }}
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                  inputValue.trim() && !isLoading
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-slate-100 text-slate-400'
                )}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                ) : (
                  <SendIcon />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">
              Powered by Claude AI
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105',
          isOpen
            ? 'bg-slate-600 text-white hover:bg-slate-700'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        )}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>
    </div>
  );
}

// ============================================================================
// Minimized Chat Button Component
// ============================================================================

export function AIAssistantButton({
  onClick,
  hasUnread = false,
  className,
}: {
  onClick: () => void;
  hasUnread?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-all hover:scale-105 hover:bg-primary-700',
        className
      )}
    >
      <ChatIcon />
      {hasUnread && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
          !
        </span>
      )}
    </button>
  );
}

// ============================================================================
// Export
// ============================================================================

export default AIAssistant;
