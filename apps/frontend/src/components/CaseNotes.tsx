'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Note {
  id: string;
  text: string;
  timestamp: string;
  author: string;
  pinned: boolean;
}

interface CaseNotesProps {
  investigationId?: string;
}

export function CaseNotes({ investigationId }: CaseNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const storageKey = investigationId
    ? `echotrace-notes-${investigationId}`
    : 'echotrace-notes';

  // Load from localStorage after mount (SSR-safe)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setNotes(JSON.parse(saved));
      }
    } catch {}
    setLoaded(true);
  }, [storageKey]);

  function saveToStorage(updated: Note[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  }

  function addNote() {
    if (!newNote.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      text: newNote.trim(),
      timestamp: new Date().toISOString(),
      author: 'Investigator',
      pinned: false,
    };
    const updated = [note, ...notes];
    setNotes(updated);
    saveToStorage(updated);
    setNewNote('');
  }

  function deleteNote(id: string) {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveToStorage(updated);
  }

  function togglePin(id: string) {
    const updated = notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
    setNotes(updated);
    saveToStorage(updated);
  }

  const sorted = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="border-b border-surface-300/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        <span>📝 Case Notes {notes.length > 0 && `(${notes.length})`}</span>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {/* New note input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNote()}
                  placeholder="Add a case note..."
                  className="flex-1 px-2.5 py-1.5 text-xs bg-surface-200/50 border border-surface-300/30 rounded-lg focus:outline-none focus:border-echo-500/50 text-foreground placeholder:text-muted-foreground"
                />
                <button
                  onClick={addNote}
                  disabled={!newNote.trim()}
                  className="px-2.5 py-1.5 text-xs bg-echo-600 hover:bg-echo-500 disabled:opacity-50 text-white rounded-lg transition-all"
                >
                  Add
                </button>
              </div>

              {/* Notes list */}
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-thin">
                {!loaded && (
                  <p className="text-[10px] text-muted-foreground text-center py-4">Loading notes...</p>
                )}
                {loaded && sorted.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-4">
                    No notes yet. Add your observations here.
                  </p>
                )}
                {sorted.map(note => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`group relative p-2 rounded-lg border text-xs ${
                      note.pinned
                        ? 'border-amber-500/20 bg-amber-500/5'
                        : 'border-surface-300/20 bg-surface-200/30'
                    }`}
                  >
                    {note.pinned && (
                      <span className="absolute -top-1.5 -right-1.5 text-[9px]">📌</span>
                    )}
                    <p className="text-foreground text-[11px] leading-relaxed pr-12">
                      {note.text}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(note.timestamp).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => togglePin(note.id)}
                          className={`text-[9px] px-1 py-0.5 rounded ${
                            note.pinned
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'text-muted-foreground hover:text-amber-400'
                          }`}
                        >
                          Pin
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-[9px] px-1 py-0.5 rounded text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
