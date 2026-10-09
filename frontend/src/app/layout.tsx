import type { Metadata } from 'next';
import './globals.css';

import { AppBackground } from '@/components/layout/AppBackground';

export const metadata: Metadata = {
  title: 'Tessera // Cognitive Compiler',
  description: 'Uplifting Bauhaus cognitive architecture grounding abstract curricula into intuitive mental models with Bayesian Knowledge Tracing and Agentic Root Cause Analysis.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen text-bauhaus-ink selection:bg-bauhaus-amber selection:text-bauhaus-ink relative">
        <AppBackground />
        {children}
      </body>
    </html>
  );
}
