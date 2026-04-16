import { Outfit } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { Anchor } from 'lucide-react';

const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "Shipyard IE Database",
  description: "Advanced analytics and IE metrics comparison for modern shipyard environments.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <header className="glass-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Anchor color="#3b82f6" size={28} />
            <span style={{ fontSize: '1.25rem', fontWeight: 600, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Shipyard IE Analytics
            </span>
          </div>
          <nav style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyItems: 'center', justifyContent: 'center' }}>
            <Link href="/" className="nav-link">Dashboard</Link>
            <Link href="/metrics" className="nav-link">Metrics</Link>
            <Link href="/jobs" className="nav-link">Job Tickets</Link>
            <Link href="/data-entry" className="nav-link">Data Entry</Link>
          </nav>
        </header>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
