'use client';

import { motion } from 'framer-motion';
import type { Evidence } from '@echotrace/shared';
import { formatBytes, cn } from '@/lib/utils';

interface EvidenceCardProps {
  evidence: Evidence;
}

const typeIcons: Record<string, string> = {
  image: '🖼️',
  audio: '🎵',
  pdf: '📄',
  screenshot: '📸',
  video_frame: '🎬',
  text: '📝',
  map: '🗺️',
};

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative bg-surface/50 backdrop-blur-sm rounded-xl border border-surface-300/30 hover:border-surface-300/60 transition-all overflow-hidden"
    >
      {/* Thumbnail preview for images */}
      {evidence.type === 'image' && evidence.fileUrl && (
        <div className="aspect-video bg-surface-200/50 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={evidence.fileUrl}
            alt={evidence.name}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start gap-2.5">
          <span className="text-lg mt-0.5">{typeIcons[evidence.type] || '📎'}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate">
              {evidence.name}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-200/50 text-muted-foreground capitalize">
                {evidence.type}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatBytes(evidence.sizeBytes)}
              </span>
            </div>
            {evidence.description && (
              <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2">
                {evidence.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
