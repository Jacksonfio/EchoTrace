'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  messages: Array<{ role: string; content: string }>;
  onSend: (message: string) => void;
}

export function ChatPanel({ messages, onSend }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    'What entities were identified in the evidence?',
    'Show me every contradiction found.',
    'What is the sequence of events?',
    'Which evidence has the strongest confidence?',
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-surface-300/30 shrink-0">
        Investigation Chat
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {messages.length === 0 && (
          <div className="space-y-2">
            <div className="text-center py-4">
              <div className="text-2xl mb-2">💬</div>
              <p className="text-xs text-muted-foreground">
                Ask questions about the evidence and investigation
              </p>
            </div>

            {/* Suggested questions */}
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
                    ? 'bg-echo-600/20 border border-echo-500/30 text-foreground'
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
    </div>
  );
}
