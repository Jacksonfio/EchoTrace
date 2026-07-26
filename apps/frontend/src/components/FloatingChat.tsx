'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FloatingChatProps {
  messages: Array<{ role: string; content: string }>;
  onSend: (message: string) => void;
}

export function FloatingChat({ messages, onSend }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Simulate typing indicator when messages arrive
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  }

  const suggestedQuestions = [
    'What entities were identified?',
    'Show me every contradiction.',
    'What is the sequence of events?',
    'Which evidence is strongest?',
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-echo-600 hover:bg-echo-500 text-white shadow-lg shadow-echo-600/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        {isOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {messages.length > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white">
            {messages.length}
          </span>
        )}
      </button>

      {/* Chat Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Panel */}
            <motion.div
              initial={{ opacity: 0, x: 320, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 320, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-24 right-6 z-50 w-[360px] h-[500px] rounded-2xl border border-surface-300/30 bg-background shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-surface-300/30 flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-full bg-echo-600/20 border border-echo-500/30 flex items-center justify-center text-sm">
                  🤖
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Investigation Chat</div>
                  <div className="text-[10px] text-muted-foreground">{messages.length} messages</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                {messages.length === 0 && (
                  <div className="space-y-2 pt-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">💬</div>
                      <p className="text-xs text-muted-foreground mb-4">
                        Ask questions about the evidence
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground px-1">Try asking:</p>
                      {suggestedQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => onSend(q)}
                          className="w-full text-left text-[11px] px-3 py-2 rounded-lg bg-surface-200/30 hover:bg-surface-200/50 text-muted-foreground hover:text-foreground transition-all border border-surface-300/20"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex gap-2',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-echo-600/20 border border-echo-500/30 flex items-center justify-center text-[10px] shrink-0 mt-1">
                          🤖
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                          msg.role === 'user'
                            ? 'bg-echo-600 text-white'
                            : 'bg-surface-200/50 border border-surface-300/20 text-foreground'
                        )}
                      >
                        {msg.content}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] shrink-0 mt-1">
                          👤
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-echo-600/20 border border-echo-500/30 flex items-center justify-center text-[10px] shrink-0 mt-1">
                      🤖
                    </div>
                    <div className="bg-surface-200/50 border border-surface-300/20 rounded-xl px-3 py-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-echo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-echo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-echo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-surface-300/30 shrink-0">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about the evidence..."
                    className="flex-1 px-3 py-2 text-xs bg-surface-200/50 border border-surface-300/30 rounded-lg focus:outline-none focus:border-echo-500/50 text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="px-3 py-2 bg-echo-600 hover:bg-echo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all text-xs"
                  >
                    Send
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
