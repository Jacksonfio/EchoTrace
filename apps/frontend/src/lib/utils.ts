import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(time: string): string {
  // HH:MM -> formatted
  if (time.includes(':')) {
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }
  return time;
}

export function formatDate(date: string): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getEvidenceIcon(type: string): string {
  const icons: Record<string, string> = {
    image: 'Image',
    audio: 'Headphones',
    pdf: 'FileText',
    screenshot: 'Camera',
    video_frame: 'Video',
    text: 'File',
    map: 'MapPin',
  };
  return icons[type] || 'File';
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };
  return colors[severity] || colors.low;
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-emerald-400';
  if (confidence >= 0.5) return 'text-amber-400';
  return 'text-rose-400';
}

export function getConfidenceBarColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-emerald-500';
  if (confidence >= 0.5) return 'bg-amber-500';
  return 'bg-rose-500';
}
