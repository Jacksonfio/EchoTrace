'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Investigation } from '@echotrace/shared';

interface SidebarProps {
  investigations: Investigation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onCreate: (title: string, description?: string) => void;
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
  isCreating: boolean;
}

export function Sidebar({
  investigations,
  activeId,
  onSelect,
  onCreate,
  onLoadDemo,
  isLoadingDemo,
  isCreating,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  function handleCreate() {
    if (!newTitle.trim()) return;
    onCreate(newTitle.trim(), newDesc.trim() || undefined);
    setNewTitle('');
    setNewDesc('');
    setShowCreate(false);
  }

  return (
    <motion.aside
      animate={{ width: isOpen ? 280 : 60 }}
      className="h-full border-r border-surface-300/30 bg-surface/50 backdrop-blur-sm flex flex-col shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-surface-300/30 shrink-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-200/50 text-muted-foreground hover:text-foreground transition-all"
        >
          {isOpen ? '◀' : '▶'}
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <span className="text-sm font-bold bg-gradient-to-r from-echo-400 to-violet-400 bg-clip-text text-transparent">
                EchoTrace
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Investigation Button */}
      <div className="p-3 shrink-0">
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-2 px-3 text-sm font-medium bg-echo-600 hover:bg-echo-500 text-white rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <span>+</span>
            {isOpen && <span>New Investigation</span>}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Case title..."
              className="w-full px-3 py-2 text-sm bg-surface-200/50 border border-surface-300/30 rounded-lg focus:outline-none focus:border-echo-500/50 text-foreground placeholder:text-muted-foreground"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <input
              type="text"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Optional description..."
              className="w-full px-3 py-2 text-sm bg-surface-200/50 border border-surface-300/30 rounded-lg focus:outline-none focus:border-echo-500/50 text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={isCreating || !newTitle.trim()}
                className="flex-1 py-1.5 text-xs font-medium bg-echo-600 hover:bg-echo-500 disabled:opacity-50 text-white rounded-lg transition-all"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="py-1.5 px-3 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-200/50 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Investigation List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-1"
            >
              <div className="px-2 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Investigations
              </div>
              {investigations.length === 0 && (
                <div className="px-3 py-6 text-xs text-muted-foreground text-center">
                  No investigations yet.<br />Create one to get started.
                </div>
              )}
              {investigations.map((inv, i) => (
                <motion.button
                  key={inv.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onSelect(inv.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                    activeId === inv.id
                      ? 'bg-echo-600/20 border border-echo-500/30'
                      : 'hover:bg-surface-200/50 border border-transparent'
                  }`}
                >
                  <div className="text-sm font-medium text-foreground truncate">
                    {inv.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      inv.status === 'complete' ? 'bg-emerald-500/20 text-emerald-400' :
                      inv.status === 'analyzing' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-surface-300/30 text-muted-foreground'
                    }`}>
                      {inv.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {inv.evidenceCount} files
                    </span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom: Demo + Branding */}
      {isOpen && (
        <div className="px-3 pb-3 border-t border-surface-300/30 pt-3 shrink-0 space-y-2">
          <button
            onClick={onLoadDemo}
            disabled={isLoadingDemo}
            className="w-full py-1.5 px-3 text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-50 text-emerald-400 rounded-lg border border-emerald-500/20 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2"
          >
            {isLoadingDemo ? (
              <>
                <span className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                Loading Demo...
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Load Demo Data</span>
              </>
            )}
          </button>
          <div className="text-[10px] text-muted-foreground text-center">
            EchoTrace AI v1.0
          </div>
        </div>
      )}
    </motion.aside>
  );
}
