'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadZone({ onUpload, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => {
      const validTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
        'application/pdf', 'text/plain',
      ];
      return validTypes.includes(f.type) || f.name.match(/\.(jpg|jpeg|png|gif|webp|mp3|wav|ogg|m4a|pdf|txt)$/i);
    });
    
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      onUpload(validFiles);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          isDragging
            ? 'border-echo-500 bg-echo-500/10 scale-[1.02]'
            : 'border-surface-300/30 hover:border-surface-300/60 hover:bg-surface-100/30',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="absolute inset-0 bg-grid opacity-[0.03] rounded-xl pointer-events-none" />
        
        <motion.div
          animate={{ scale: isDragging ? 1.1 : 1 }}
          className="relative"
        >
          <div className="text-3xl mb-3">
            {isDragging ? '📥' : '📤'}
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            {isDragging ? 'Drop your evidence here' : 'Upload Evidence'}
          </p>
          <p className="text-xs text-muted-foreground">
            Drag & drop images, audio, PDFs, screenshots, or text files
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            Supports JPG, PNG, GIF, WebP, MP3, WAV, OGG, PDF, TXT — Max 50MB
          </p>
        </motion.div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,audio/*,application/pdf,text/plain"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Uploaded files preview */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-1.5"
          >
            <p className="text-xs text-muted-foreground">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
            </p>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, i) => (
                <motion.div
                  key={`${file.name}-${i}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-200/50 rounded-lg border border-surface-300/20 text-xs"
                >
                  <span className="text-muted-foreground">
                    {file.type.startsWith('image/') ? '🖼️' : file.type.startsWith('audio/') ? '🎵' : file.type.includes('pdf') ? '📄' : '📎'}
                  </span>
                  <span className="text-foreground truncate max-w-[150px]">{file.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="text-muted-foreground hover:text-rose-400 transition-colors"
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
