import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'EchoTrace AI — Investigation Timeline Builder',
  description:
    'Turn scattered evidence into an explainable investigation timeline. Upload photos, screenshots, voice notes, PDFs, maps, and text messages for AI-powered analysis.',
  keywords: [
    'investigation',
    'timeline',
    'AI',
    'evidence',
    'forensics',
    'multimodal',
    'Gemini',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
