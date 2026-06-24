import type { Metadata } from 'next';
import { Inter, Lora, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/hooks/use-auth';
import Header from '@/app/components/Header';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Community Hero — Citizen Issue Reporting Platform',
  description: 'The citizen-led municipal rectification platform powered by multi-agent validation and real-time insights.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#FAF9F6] text-[#1C1A17] font-sans antialiased selection:bg-[#1C1A17] selection:text-[#FAF9F6]" suppressHydrationWarning>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="border-t border-[#1C1A17] bg-[#FAF9F6] py-8 text-center text-xs font-mono tracking-wider text-stone-500 uppercase">
              <div className="max-w-7xl mx-auto px-4">
                © {new Date().getFullYear()} Community Hero. Published Daily. All Rights Reserved.
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
